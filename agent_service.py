#!/usr/bin/env python3
"""
Minimal browser-harness integration service for Comex Browser.
Connects to the existing Electron browser via CDP at http://127.0.0.1:9222
and uses browser-harness with the 9Router LLM endpoint.
"""
import os
import asyncio
import subprocess
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import logging

from langchain_openai import ChatOpenAI
from typing import Optional
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
from langchain_core.tools import tool

# Load environment variables
load_dotenv()

ROUTER_API_KEY = os.getenv('ROUTER_API_KEY', '')
OPENAI_BASE_URL = os.getenv('OPENAI_BASE_URL', 'http://localhost:20128/v1')
MODEL_NAME = os.getenv('MODEL_NAME', 'ag/gemini-3-flash-agent')
CDP_URL = os.getenv('CDP_URL', 'http://127.0.0.1:9222')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Comex Browser-Harness Service")

# Enable CORS so the React frontend can call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AgentRequest(BaseModel):
    task: str
    tabId: str
    url: str | None = None
    taskId: str

class AgentResponse(BaseModel):
    success: bool
    result: str | None = None
    error: str | None = None
    stopped: bool = False
    durationMs: int | None = None

active_tasks: dict[str, asyncio.Task] = {}

# Load browser-harness SKILL.md for the system prompt
SKILL_PATH = os.path.expanduser("~/.gemini/config/skills/browser-harness/SKILL.md")
try:
    with open(SKILL_PATH, "r") as f:
        BH_SKILL_CONTENT = f.read()
except Exception as e:
    logger.error(f"Could not read SKILL.md: {e}")
    BH_SKILL_CONTENT = "Always use browser-harness for web interaction."

import websockets
import time
import json

SYSTEM_PROMPT = f"""You are an AI browser orchestrator running inside a custom Electron browser called Comex.
You have two superpowers:
1. `run_browser_harness`: Executes Python code to control a specific browser tab via CDP.
2. `create_hidden_tab`: Opens a brand new, invisible background tab in Comex and returns its WebSocket URL.

Here is the browser-harness documentation:
{BH_SKILL_CONTENT}

MULTI-TAB WORKFLOW:
If the user asks you to do something that requires a new tab (or parallel work), use `create_hidden_tab(url, tab_id)` to spin up a background tab. 
Then, pass the returned WebSocket URL as `target_tab_ws` when calling `run_browser_harness`.
If you do not specify `target_tab_ws`, you will control the user's currently active foreground tab.

CRITICAL INSTRUCTION: When you have completed the task, you MUST write a final, detailed text response summarizing your findings (e.g., a list of the products, their prices, ratings, and links). Do not return an empty response.
Your final response will be rendered in a custom chat UI. You MUST format your response using ONLY these supported Markdown features:
- Use `- ` or `* ` for bulleted lists.
- Use `**bold text**` for emphasis (e.g., **Price:**).
- Use `[Link Name](url)` for clickable links.
- Use code blocks (```language ... ```) if showing raw data.
- Use `#### ` for subheadings if needed.
Do not use unsupported HTML tags. Ensure your final summary is highly detailed and cleanly formatted.
"""

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "cdp_url": CDP_URL, "model": MODEL_NAME}

async def execute_agent_loop(task: str, default_cdp_url: str):
    llm = ChatOpenAI(
        model=MODEL_NAME,
        base_url=OPENAI_BASE_URL,
        api_key=ROUTER_API_KEY,
    )
    
    @tool
    def run_browser_harness(code: str, target_tab_ws: Optional[str] = None) -> str:
        """Execute Python code using browser-harness on a web page. If target_tab_ws is provided, it runs on that hidden tab. Otherwise, it runs on the active foreground tab."""
        logger.info(f"Executing browser-harness code on {target_tab_ws or 'default tab'}:\n{code}")
        
        target = target_tab_ws if target_tab_ws else default_cdp_url
        env = os.environ.copy()
        if target.startswith("ws"):
            env["BU_CDP_WS"] = target
        else:
            env["BU_CDP_URL"] = target
            
        bh_path = os.path.expanduser("~/.local/bin/browser-harness")
        try:
            result = subprocess.run(
                [bh_path],
                input=code,
                text=True,
                capture_output=True,
                env=env,
                timeout=90
            )
            output = result.stdout + "\n" + result.stderr
            logger.info(f"browser-harness output:\n{output}")
            return output
        except Exception as e:
            logger.error(f"Error running browser-harness: {e}")
            return f"Error: {e}"

    async def _trigger_ui_cdp(expression: str):
        import urllib.request
        req = urllib.request.urlopen(f"{CDP_URL}/json/list")
        targets = json.loads(req.read())
        ui_ws = None
        for t in targets:
            if t.get("type") == "page" and ("localhost:5173" in t.get("url", "") or "index.html" in t.get("url", "")):
                ui_ws = t.get("webSocketDebuggerUrl")
                break
        
        if not ui_ws:
            return "Error: Could not find React UI tab to route command."
            
        async with websockets.connect(ui_ws) as ws:
            msg = {
                "id": 1,
                "method": "Runtime.evaluate",
                "params": {
                    "expression": expression
                }
            }
            await ws.send(json.dumps(msg))
            await ws.recv()
            return "Success"

    @tool
    def create_hidden_tab(url: str, tab_id: str) -> str:
        """Create a new invisible background tab in Comex. Returns the WebSocket URL of the new tab to be passed into run_browser_harness."""
        logger.info(f"Creating hidden tab {tab_id} for {url}")
        
        # Tell the React UI to tell Electron to create the hidden tab
        expr = f"window.nexusNative.tabs.createHiddenAgentTab('{tab_id}', '{url}')"
        
        # Run the async websocket call synchronously from the tool
        try:
            loop = asyncio.get_running_loop()
            asyncio.run_coroutine_threadsafe(_trigger_ui_cdp(expr), loop).result()
        except RuntimeError:
            asyncio.run(_trigger_ui_cdp(expr))
            
        # Give Electron a moment to spawn the WebContentsView
        time.sleep(1.5)
        
        # Find the new tab's websocket URL
        import urllib.request
        req = urllib.request.urlopen(f"{CDP_URL}/json/list")
        targets = json.loads(req.read())
        for t in targets:
            if tab_id in t.get("url", ""):
                ws_url = t.get("webSocketDebuggerUrl", "")
                logger.info(f"Hidden tab created successfully: {ws_url}")
                return ws_url
                
        return "Error: Tab was created but its WebSocket URL could not be found."

    llm_with_tools = llm.bind_tools([run_browser_harness, create_hidden_tab])
    
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=task)
    ]
    
    for step in range(100): # Max 100 steps
        logger.info(f"Agent step {step}")
        response = await llm_with_tools.ainvoke(messages)
        messages.append(response)
        
        if not response.tool_calls:
            return response.content
            
        for tool_call in response.tool_calls:
            if tool_call["name"] == "run_browser_harness":
                code = tool_call["args"].get("code", "")
                target_ws = tool_call["args"].get("target_tab_ws") or None
                invoke_args = {"code": code}
                if target_ws:
                    invoke_args["target_tab_ws"] = target_ws
                result = await asyncio.to_thread(run_browser_harness.invoke, invoke_args)
                messages.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))
            elif tool_call["name"] == "create_hidden_tab":
                url = tool_call["args"].get("url", "")
                tid = tool_call["args"].get("tab_id", "")
                result = await asyncio.to_thread(create_hidden_tab.invoke, {"url": url, "tab_id": tid})
                messages.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))
    
    return "Task stopped after reaching maximum iterations."

@app.post("/agent/run", response_model=AgentResponse)
async def run_agent(request: AgentRequest):
    """
    Run a browser-harness agent task on the existing Electron browser.
    """
    logger.info(f"Received task: {request.task} for tabId: {request.tabId}, taskId: {request.taskId}")
    started_at = time.monotonic()
    
    try:
        target_cdp_url = CDP_URL
        if request.url:
            try:
                import urllib.request
                import json
                req = urllib.request.urlopen(f"{CDP_URL}/json/list")
                targets = json.loads(req.read())
                for t in targets:
                    target_url = t.get("url", "")
                    if request.tabId in target_url:
                        target_cdp_url = t.get("webSocketDebuggerUrl", CDP_URL)
                        logger.info(f"Resolved specific page CDP target via tabId hash: {target_cdp_url}")
                        break
            except Exception as e:
                logger.warning(f"Could not resolve specific CDP target for tabId {request.tabId}: {e}")

        # Start agent task in asyncio so it can be cancelled
        agent_task = asyncio.create_task(execute_agent_loop(request.task, target_cdp_url))
        active_tasks[request.taskId] = agent_task
        
        result_text = await agent_task
        
        elapsed_ms = round((time.monotonic() - started_at) * 1000)
        logger.info(f"Agent completed successfully in {elapsed_ms} ms. Result: {result_text}")
        return AgentResponse(success=True, result=result_text, durationMs=elapsed_ms)
    except asyncio.CancelledError:
        elapsed_ms = round((time.monotonic() - started_at) * 1000)
        logger.info(f"Agent task stopped by user: {request.taskId}")
        return AgentResponse(success=False, result="The task was stopped by the user.", stopped=True, durationMs=elapsed_ms)
    except Exception as e:
        elapsed_ms = round((time.monotonic() - started_at) * 1000)
        logger.error(f"Agent execution failed in {elapsed_ms} ms: {e}", exc_info=True)
        return AgentResponse(success=False, error=str(e), durationMs=elapsed_ms)
    finally:
        active_tasks.pop(request.taskId, None)

@app.post("/agent/stop")
async def stop_agent(payload: dict):
    task_id = payload.get("taskId")
    task = active_tasks.get(task_id)
    if not task_id or not task:
        return {"success": False, "stopped": False, "error": "Task is no longer running."}

    task.cancel()
    return {"success": True, "stopped": True, "taskId": task_id}

@app.get("/cdp/targets")
async def list_cdp_targets():
    """
    Debug endpoint: list all CDP targets from the Electron browser.
    """
    try:
        import urllib.request
        import json
        req = urllib.request.urlopen(f"{CDP_URL}/json/list")
        targets = json.loads(req.read().decode())
        return {"targets": targets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
