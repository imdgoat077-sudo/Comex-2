import { AGENT_ROLES } from './types';

/**
 * Browser Navigator Sub-Agent
 * Handles dynamic URL routing, search query execution, multi-tab spawning, and DOM interaction.
 */
export async function executeNavigationTask(intent, activeTab, callbacks = {}) {
  const { onLog, onTabNavigate, onAddTab } = callbacks;

  const emitLog = (msg, details = null) => {
    if (onLog) onLog(AGENT_ROLES.NAVIGATOR, msg, details);
  };

  let targetUrl = 'comex://launchpad';
  let actionSummary = '';
  let tabsProcessed = 1;

  if (intent.category === 'DIRECT_URL') {
    targetUrl = intent.targetUrl;
    actionSummary = `Loaded direct URL \`${targetUrl}\``;
    emitLog(`Navigating active tab to target URL: \`${targetUrl}\``);
    if (onTabNavigate) onTabNavigate(targetUrl);

  } else if (intent.category === 'YOUTUBE_SEARCH') {
    targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(intent.query)}`;
    actionSummary = `Searched YouTube for **"${intent.query}"**`;
    emitLog(`Navigating active tab to YouTube search query: "${intent.query}"`);
    if (onTabNavigate) onTabNavigate(targetUrl);

  } else if (intent.category === 'GITHUB_RESEARCH') {
    targetUrl = `https://github.com/search?q=${encodeURIComponent(intent.query)}`;
    actionSummary = `Navigated to GitHub search portal for **"${intent.query}"**`;
    emitLog(`Navigating active tab to GitHub search query: "${intent.query}"`);
    if (onTabNavigate) onTabNavigate(targetUrl);

    if (onAddTab) {
      emitLog('Spawning background comparison tab for GitHub Trending...');
      onAddTab('https://github.com/trending');
      tabsProcessed = 2;
    }

  } else if (intent.category === 'WIKIPEDIA_LOOKUP') {
    targetUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(intent.query)}`;
    actionSummary = `Queried Wikipedia encyclopedia for **"${intent.query}"**`;
    emitLog(`Navigating to Wikipedia search portal: "${intent.query}"`);
    if (onTabNavigate) onTabNavigate(targetUrl);

  } else {
    targetUrl = `https://www.google.com/search?q=${encodeURIComponent(intent.query)}`;
    actionSummary = `Executed web search for **"${intent.query}"**`;
    emitLog(`Navigating to Google Search Engine: "${intent.query}"`);
    if (onTabNavigate) onTabNavigate(targetUrl);
  }

  // Simulate network navigation delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  emitLog(`Navigation task completed successfully. Active URL: \`${targetUrl}\``);

  return {
    url: targetUrl,
    actionSummary,
    tabsProcessed
  };
}
