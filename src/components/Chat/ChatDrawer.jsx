import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, X, Send, Bot, User, Trash2, Copy, Check,
  ChevronRight, ChevronDown,
  Globe, Play, Layers, Activity, Crown, Compass, Search, ShieldCheck, Terminal
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { runMultiAgentSwarm } from '../../agents/OrchestratorAgent';
import { AGENT_ROLES } from '../../agents/types';
import './ChatDrawer.css';

function getAgentRoleIcon(roleId, size = 12) {
  switch (roleId) {
    case 'orchestrator':
      return <Crown size={size} />;
    case 'navigator':
      return <Compass size={size} />;
    case 'researcher':
      return <Search size={size} />;
    case 'inspector':
      return <ShieldCheck size={size} />;
    default:
      return <Bot size={size} />;
  }
}

function formatDuration(durationMs) {
  const totalSeconds = Math.max(0, durationMs) / 1000;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}m ${seconds}s`;
}

export default function ChatDrawer({
  isOpen,
  onClose,
  activeTab,
  onNavigate,
  onAddTab
}) {
  const [isMultiAgentMode, setIsMultiAgentMode] = useState(false); // default: browser-use Single Agent path
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'assistant',
      text: "Welcome to **Comex Multi-Agent Swarm**.\n\nOur specialized sub-agent pipeline (Orchestrator, Navigator, Researcher, Inspector) executes concurrent background searches, inspects webview DOM semantics, and compiles structured research reports.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 'm2',
      sender: 'assistant',
      text: "### Autonomous Capabilities\n- Search & compare repositories on **GitHub**\n- Execute web queries on **Google**\n- Search & stream videos on **YouTube**\n- Summarize DOM content of active web pages",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentLogs, setAgentLogs] = useState([]);
  const [currentProgress, setCurrentProgress] = useState(null);
  const [expandedActivity, setExpandedActivity] = useState({});
  const [activeSingleAgentMessageId, setActiveSingleAgentMessageId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const activeTaskRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, agentLogs, activeSingleAgentMessageId]);

  // Track active Single Agent message and append real tab activity details
  useEffect(() => {
    if (!activeSingleAgentMessageId) return;
    if (!activeTab) return;

    setMessages((prev) => prev.map((msg) => {
      if (msg.id !== activeSingleAgentMessageId) return msg;

      const newActivity = [...(msg.activity || [])];
      let stepMessage = '';

      if (activeTab.isLoading) {
        stepMessage = `Loading ${activeTab.url || 'page'}...`;
      } else if (activeTab.title && activeTab.title !== 'Comex Launchpad' && activeTab.title !== 'about:blank') {
        stepMessage = `Opened page: ${activeTab.title}`;
      } else if (activeTab.url && activeTab.url !== 'comex://launchpad' && activeTab.url !== 'about:blank') {
        try {
          const urlObj = new URL(activeTab.url);
          stepMessage = `Navigating to ${urlObj.hostname}`;
        } catch {
          stepMessage = `Navigating to ${activeTab.url}`;
        }
      }

      if (stepMessage && !newActivity.some(log => log.message === stepMessage)) {
        newActivity.push({
          id: `log_${Date.now()}_${Math.random()}`,
          message: stepMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      }

      const latestMsg = newActivity[newActivity.length - 1]?.message || 'Working...';

      return {
        ...msg,
        activity: newActivity,
        statusLabel: latestMsg
      };
    }));
  }, [activeTab?.url, activeTab?.title, activeTab?.isLoading, activeSingleAgentMessageId]);

  // Receive prompts submitted from the Comet-style landing page.
  useEffect(() => {
    const handleLandingPrompt = (event) => {
      const prompt = event.detail?.prompt?.trim();
      if (prompt) handleSend(prompt);
    };

    window.addEventListener('comex-landing-prompt', handleLandingPrompt);
    return () => window.removeEventListener('comex-landing-prompt', handleLandingPrompt);
  }, [activeTab?.id, activeTab?.url, isMultiAgentMode]);

  // Single Agent Direct Automation using Python Browser-Use Service
  const executeSingleAgentAction = async (text, taskId, controller) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/agent/run', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: text,
          taskId,
          tabId: activeTab?.id || 'tab-1',
          url: activeTab?.url || ''
        })
      });
      
      const data = await response.json();
      const durationMs = Number.isFinite(data.durationMs) ? data.durationMs : null;
      if (data.stopped) return { status: 'stopped', text: data.result || 'The task was stopped by the user.', durationMs };
      if (data.success) return { status: 'completed', text: `### Browser-Use Result\n\n${data.result}`, durationMs };
      return { status: 'failed', text: `### Agent Error\n\n${data.error}`, durationMs };
    } catch (err) {
      if (err.name === 'AbortError') return { status: 'stopped', text: 'The task was stopped by the user.' };
      return { status: 'failed', text: '### Connection Error\n\nCould not connect to the Python browser-use service (http://127.0.0.1:8000). Ensure `agent_service.py` is running.' };
    }
  };

  const stopSingleAgent = async () => {
    const active = activeTaskRef.current;
    if (!active || active.stopping) return;

    active.stopping = true;
    setMessages((prev) => prev.map((message) => message.id === active.messageId ? {
      ...message,
      statusLabel: 'Stopping...',
    } : message));

    active.controller.abort();
    try {
      await fetch('http://127.0.0.1:8000/agent/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: active.taskId }),
      });
    } catch (err) {
      console.warn('Agent cancellation request failed:', err);
    }
  };

  const handleSend = async (textToSend = input) => {
    const text = textToSend.trim();
    if (!text) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (textToSend === input) setInput('');
    setIsTyping(true);
    setAgentLogs([]);
    setCurrentProgress(null);

    if (isMultiAgentMode) {
      try {
        const finalReport = await runMultiAgentSwarm(text, activeTab, {
          onLog: (logItem) => {
            setAgentLogs((prev) => [...prev, logItem]);
          },
          onProgress: (progress) => {
            setCurrentProgress(progress);
          },
          onTabNavigate: onNavigate,
          onAddTab
        });

        const aiMsg = {
          id: `a_${Date.now()}`,
          sender: 'assistant',
          text: finalReport,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a_err_${Date.now()}`,
            sender: 'assistant',
            text: `### Multi-Agent Pipeline Warning\n\n${err.message}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } finally {
        setIsTyping(false);
        setCurrentProgress(null);
      }
    } else {
      // Single Agent path: keep one assistant message and replace its status in place.
      const messageId = `a_${Date.now()}`;
      setMessages((prev) => [...prev, {
        id: messageId,
        sender: 'assistant',
        text: '',
        status: 'working',
        statusLabel: 'Working...',
        activity: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setActiveSingleAgentMessageId(messageId);

      try {
        const taskId = `task-${Date.now()}`;
        const controller = new AbortController();
        activeTaskRef.current = { taskId, controller, messageId };
        const outcome = await executeSingleAgentAction(text, taskId, controller);
        const active = activeTaskRef.current;
        const terminalStatus = active?.stopping || outcome.status === 'stopped' ? 'stopped' : outcome.status;
        const cleanText = terminalStatus === 'stopped'
          ? 'The task was stopped by the user.'
          : outcome.text.replace(/^### (Agent Error|Connection Error|Browser-Use Result)\s*/, '');
        setMessages((prev) => prev.map((message) => message.id === messageId ? {
          ...message,
          text: cleanText,
          status: terminalStatus,
          statusLabel: terminalStatus === 'stopped' ? 'Task stopped' : terminalStatus === 'failed' ? 'Task failed' : 'Task completed',
          activity: message.activity || [],
          durationMs: outcome.durationMs,
          completed: true,
        } : message));
      } catch (err) {
        const active = activeTaskRef.current;
        const stopped = active?.stopping || err.name === 'AbortError';
        setMessages((prev) => prev.map((message) => message.id === messageId ? {
          ...message,
          text: stopped ? 'The task was stopped by the user.' : err.message || 'The agent could not complete the task.',
          status: stopped ? 'stopped' : 'failed',
          statusLabel: stopped ? 'Task stopped' : 'Task failed',
          activity: message.activity || [],
          completed: true,
        } : message));
      } finally {
        setIsTyping(false);
        setActiveSingleAgentMessageId(null);
        activeTaskRef.current = null;
      }
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'm1',
        sender: 'assistant',
        text: "Chat session cleared. Comex Multi-Agent Swarm pipeline is idle.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setAgentLogs([]);
  };

  if (!isOpen) return null;

  return (
    <div className="chat-drawer animate-slide-right">
      {/* Drawer Header Row 1: Brand & Window Actions */}
      <div className="chat-header">
        <div className="chat-title-group">
          <div className="ai-avatar-badge">
            <Sparkles size={15} />
          </div>
          <h3 className="chat-title">Comex AI Assistant</h3>
        </div>

        <div className="chat-header-actions">
          <button
            className="chat-icon-btn"
            onClick={handleClearChat}
            title="Clear Chat History"
          >
            <Trash2 size={15} />
          </button>
          <button
            className="chat-icon-btn"
            onClick={onClose}
            title="Close Drawer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Drawer Header Row 2: Active Tab Badge & Swarm Mode Toggle */}
      <div className="chat-subbar">
        <div className="active-tab-chip" title={activeTab?.title || "Comex Launchpad"}>
          <Globe size={12} className="tab-chip-icon" />
          <span className="active-tab-text">{activeTab?.title || "Comex Launchpad"}</span>
        </div>

        <button
          className={`agent-mode-toggle ${isMultiAgentMode ? 'active' : ''}`}
          onClick={() => setIsMultiAgentMode(!isMultiAgentMode)}
          title={isMultiAgentMode ? "Multi-Agent Swarm Mode Active" : "Single Agent Mode"}
        >
          <Layers size={12} />
          <span>{isMultiAgentMode ? "Swarm Mode" : "Single Agent"}</span>
        </button>
      </div>

      {/* Messages List Area */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble-wrapper ${msg.sender === 'user' ? 'user-wrapper' : 'assistant-wrapper'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="avatar-icon assistant">
                <Bot size={13} />
              </div>
            )}
            <div className={`chat-bubble ${msg.sender} ${msg.status ? `message-${msg.status}` : ''}`}>
              {msg.sender === 'assistant' && msg.status ? (
                <>
                  {msg.status === 'working' && msg.activity && msg.activity.length > 0 ? (
                    <div className="agent-live-activity">
                      {msg.activity.map((log, idx) => {
                        const isLast = idx === msg.activity.length - 1;
                        return (
                          <div
                            key={log.id}
                            className={`agent-live-step ${isLast ? 'current' : 'done'}`}
                          >
                            <span className="agent-step-dot" />
                            <span className="agent-step-text">{log.message}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : msg.status === 'working' ? (
                    <div className="agent-status-line"><Activity size={12} className="animate-spin" /> <span>{msg.statusLabel || 'Working...'}</span></div>
                  ) : (
                    <button
                      className="agent-result-toggle"
                      onClick={() => setExpandedActivity((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                      aria-expanded={Boolean(expandedActivity[msg.id])}
                      type="button"
                    >
                      <span>{msg.statusLabel}</span>
                      {expandedActivity[msg.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                  {msg.text && <MarkdownRenderer content={msg.text} />}
                  {expandedActivity[msg.id] && msg.activity?.length > 0 && (
                    <div className="agent-result-details">
                      <div className="agent-activity-header"><Activity size={13} /> <span>Agent activity</span></div>
                      <div className="agent-logs-list">
                        {msg.activity.map((log) => <div key={log.id} className="agent-log-item"><span className="agent-log-msg">{log.message}</span></div>)}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bubble-text">
                  {msg.sender === 'user' ? <p>{msg.text}</p> : <MarkdownRenderer content={msg.text} />}
                </div>
              )}
              <div className="bubble-footer">
                <span className="timestamp">{msg.timestamp}</span>
                {msg.durationMs != null && (
                  <span className="agent-duration" title="Time taken by the agent">
                    ⏱ {formatDuration(msg.durationMs)}
                  </span>
                )}
                {msg.sender === 'assistant' && (
                  <button className="copy-btn" onClick={() => handleCopy(msg.id, msg.text)} title="Copy message">
                    {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Live Multi-Agent Swarm Execution Log Feed */}
        {isTyping && isMultiAgentMode && (
          <div className="agent-activity-box animate-fade-in">
            <div className="agent-activity-header">
              <Activity size={14} className="animate-spin text-accent" />
              <span>Multi-Agent Swarm Pipeline</span>
              {currentProgress && (
                <span className="step-tag">Step {currentProgress.step}/{currentProgress.totalSteps}</span>
              )}
            </div>

            <div className="agent-logs-list">
              {agentLogs.map((log) => (
                <div key={log.id} className="agent-log-item animate-fade-in">
                  <span className="agent-role-badge" style={{ color: log.agent.color }}>
                    {getAgentRoleIcon(log.agent.id, 12)}
                    <span className="badge-name">{log.agent.name}</span>
                  </span>
                  <span className="agent-log-msg">{log.message}</span>
                  <span className="agent-log-time">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Prompt Chips */}
      <div className="prompt-chips-bar">
        <button className="chip-btn" onClick={() => handleSend("Research trending AI frameworks on GitHub")}>
          <Layers size={12} /> GitHub Research Swarm
        </button>
        <button className="chip-btn" onClick={() => handleSend("Open YouTube and search for Lo-Fi Beats")}>
          <Play size={12} /> YouTube Search
        </button>
        <button className="chip-btn" onClick={() => handleSend("Search Google for Quantum Computing 2026")}>
          <Globe size={12} /> Google Query
        </button>
      </div>

      {/* Input Textarea Bar */}
      <div className="chat-input-container">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="chat-form"
        >
          <input
            type="text"
            className="chat-input"
            placeholder={isMultiAgentMode ? "Ask Multi-Agent Swarm..." : "Ask Comex AI Assistant..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type={isTyping && !isMultiAgentMode ? 'button' : 'submit'}
            className={`send-btn ${isTyping && !isMultiAgentMode ? 'stop-btn' : ''}`}
            disabled={isTyping && !isMultiAgentMode ? Boolean(activeTaskRef.current?.stopping) : !input.trim() || isTyping}
            onClick={isTyping && !isMultiAgentMode ? stopSingleAgent : undefined}
            aria-label={isTyping && !isMultiAgentMode ? 'Stop agent task' : 'Send message'}
            title={isTyping && !isMultiAgentMode ? 'Stop agent task' : 'Send message'}
          >
            {isTyping && !isMultiAgentMode ? <span className="stop-icon" aria-hidden="true" /> : <Send size={14} />}
          </button>
        </form>
      </div>
    </div>
  );
}
