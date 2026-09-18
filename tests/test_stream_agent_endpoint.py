import json
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
import agent_service

client = TestClient(agent_service.app)

def test_stream_endpoint_contract():
    # Test POST /agent/run/stream with mocked execute_agent_loop
    with patch("agent_service.execute_agent_loop", new_callable=AsyncMock) as mock_loop:
        class FakeResult:
            def __str__(self):
                return "Successfully interacted with page."
            metadata = {"tool_call_count": 1}

        async def fake_loop(task, default_cdp_url, **kwargs):
            callback = kwargs.get("event_callback")
            if callback:
                await callback("thinking", {"detail": "Thinking about the task..."})
                await callback("step", {"step": 1, "tool": "run_browser_harness", "label": "Executing browser code", "status": "running"})
                await callback("step_done", {"step": 1, "tool": "run_browser_harness", "label": "Executing browser code", "success": True})
            return FakeResult()

        mock_loop.side_effect = fake_loop

        response = client.post("/agent/run/stream", json={
            "task": "Draw rocket on excalidraw",
            "taskId": "stream-test-1",
            "tabId": "tab-1",
            "url": "https://excalidraw.com"
        })

        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        text = response.text
        assert "event: perception" in text
        assert "event: thinking" in text
        assert "event: step" in text
        assert "event: step_done" in text
        assert "event: done" in text
        assert "Draw rocket" in text or "excalidraw" in text
