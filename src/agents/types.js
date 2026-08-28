/**
 * Comex Browser Multi-Agent System Core Definitions
 */

export const AGENT_ROLES = {
  ORCHESTRATOR: {
    id: 'orchestrator',
    name: 'Comex Orchestrator',
    iconName: 'Crown',
    color: '#8b5cf6', // Violet
    description: 'Decomposes complex requests into task graphs and coordinates sub-agents.'
  },
  NAVIGATOR: {
    id: 'navigator',
    name: 'Browser Navigator',
    iconName: 'Compass',
    color: '#06b6d4', // Cyan
    description: 'Automates tab creation, webview URL navigation, and web interaction.'
  },
  RESEARCHER: {
    id: 'researcher',
    name: 'Content Researcher',
    iconName: 'Search',
    color: '#3b82f6', // Blue
    description: 'Inspects DOM text, extracts page semantics, and parses structured data.'
  },
  INSPECTOR: {
    id: 'inspector',
    name: 'Quality Inspector',
    iconName: 'ShieldCheck',
    color: '#10b981', // Emerald
    description: 'Validates source facts across tabs and ensures report completeness.'
  }
};

export const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export function createAgentLog(agentRole, message, details = null) {
  return {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    agent: agentRole,
    message,
    details,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
}
