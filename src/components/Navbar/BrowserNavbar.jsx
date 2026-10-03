import React, { useState, useRef, useEffect } from 'react';
import './BrowserNavbar.css';

export default function BrowserNavbar({
  tabs = [],
  activeTabId,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onNavigate,
  onReload,
  onGoHome,
  onToggleChat,
  isChatOpen,
  unreadCount = 0,
  onOpenShortcuts,
  onToggleSidebar,
  isSidebarOpen
}) {
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const [urlInput, setUrlInput] = useState(activeTab?.url || '');
  const [isFocused, setIsFocused] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url === 'comex://launchpad' || activeTab.url === 'nexus://launchpad' ? '' : activeTab.url);
      setIsBookmarked(activeTab.isBookmarked || false);
    }
  }, [activeTab?.id, activeTab?.url, activeTab?.isBookmarked]);

  const canGoBack = activeTab ? (activeTab.canGoBack || (activeTab.historyIndex > 0)) : false;
  const canGoForward = activeTab ? (activeTab.canGoForward || (activeTab.historyIndex < (activeTab.history?.length || 1) - 1)) : false;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      onGoHome();
      return;
    }

    let targetUrl = trimmed;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && !targetUrl.startsWith('comex://') && !targetUrl.startsWith('nexus://')) {
      if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
        targetUrl = 'https://' + targetUrl;
      } else {
        targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
      }
    }

    onNavigate(targetUrl);
    inputRef.current?.blur();
    setIsFocused(false);
  };

  const handleQuickSuggestion = (suggestedUrl) => {
    setUrlInput(suggestedUrl);
    onNavigate(suggestedUrl);
    setIsFocused(false);
  };

  const toggleBookmark = (e) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const isSecure = activeTab?.url?.startsWith('https://');

  return (
    <header className="browser-header">
      {/* ── Top Row: Traffic light spacer + Tabs + Badge + Assistant launcher ── */}
      <div className="drag-region browser-topbar">
        <div className="no-drag topbar-left-group">
          {/* Spacer for macOS traffic lights */}
          <div className="traffic-light-spacer" />

          {/* Tab Strip */}
          <div className="tabs-container" id="tab-strip">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const isHome = !tab.url || tab.url === 'comex://launchpad' || tab.url === 'nexus://launchpad';

              return (
                <div
                  key={tab.id}
                  className={`tab-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectTab(tab.id)}
                  title={tab.url || 'New Tab'}
                >
                  <div className="tab-favicon">
                    {tab.isLoading ? (
                      <div className="tab-spinner" />
                    ) : tab.favicon ? (
                      <img
                        src={tab.favicon}
                        alt=""
                        className="tab-favicon-img"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="material-symbols-outlined text-[15px] text-on-surface-variant">
                        {isHome ? 'home' : 'language'}
                      </span>
                    )}
                  </div>

                  <span className="tab-title">
                    {isHome ? 'New Tab' : (tab.title || tab.url || 'Loading…')}
                  </span>

                  {tabs.length > 1 && (
                    <button
                      className="tab-close"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseTab(tab.id);
                      }}
                      title="Close tab (Cmd+W)"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  )}
                </div>
              );
            })}

            {/* New Tab Button */}
            <button
              className="add-tab-btn"
              onClick={onAddTab}
              title="New tab (Cmd+T)"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
        </div>

        {/* Right Status & Assistant Button */}
        <div className="no-drag topbar-right-group">
          <div className="engine-badge">
            <span className="material-symbols-outlined text-[14px]">memory</span>
            <span>Comex v2.4</span>
          </div>

          <button
            className={`assistant-topbar-btn ${isChatOpen ? 'active' : ''}`}
            onClick={onToggleChat}
            title="Toggle AI Co-Pilot (Cmd+J)"
          >
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            <span>Assistant</span>
            {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
          </button>
        </div>
      </div>

      {/* ── Bottom Row: Navigation Buttons + Pill Omnibar + Action buttons ── */}
      <div className="no-drag browser-toolbar">
        {/* Nav Controls */}
        <div className="nav-buttons-group">
          {onToggleSidebar && (
            <button
              className="nav-action-btn"
              onClick={onToggleSidebar}
              title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSidebarOpen ? 'dock_to_left' : 'menu'}
              </span>
            </button>
          )}

          <button
            className="nav-action-btn"
            disabled={!canGoBack}
            onClick={() => onNavigate('BACK')}
            title="Back (Cmd+[)"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>

          <button
            className="nav-action-btn"
            disabled={!canGoForward}
            onClick={() => onNavigate('FORWARD')}
            title="Forward (Cmd+])"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          <button
            className="nav-action-btn"
            onClick={onReload}
            title="Reload (Cmd+R)"
          >
            <span className={`material-symbols-outlined text-[18px] ${activeTab?.isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>

          <button
            className="nav-action-btn"
            onClick={onGoHome}
            title="Launchpad Home"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
          </button>
        </div>

        {/* Pill URL Omnibar */}
        <div
          className={`omnibox-wrapper ${isFocused ? 'focused' : ''}`}
          onClick={() => inputRef.current?.focus()}
        >
          <form onSubmit={handleSubmit} className="omnibox-form">
            <span className={`material-symbols-outlined omnibox-icon ${isSecure ? 'secure' : ''}`}>
              {isSecure ? 'lock' : 'search'}
            </span>

            <input
              ref={inputRef}
              type="text"
              className="omnibox-input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 220)}
              placeholder="Search or enter address..."
              spellCheck="false"
              autoComplete="off"
            />

            <div className="omnibox-actions">
              <button
                type="button"
                className={`bookmark-star-btn ${isBookmarked ? 'bookmarked' : ''}`}
                onClick={toggleBookmark}
                title={isBookmarked ? 'Bookmarked' : 'Bookmark this page'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isBookmarked ? 'star' : 'star_outline'}
                </span>
              </button>
            </div>
          </form>

          {/* Quick Suggestions Dropdown */}
          {isFocused && (
            <div className="search-dropdown animate-fade-in" ref={dropdownRef}>
              <div className="dropdown-section-header">Quick Navigations</div>
              
              <div
                className="dropdown-item"
                onMouseDown={() => handleQuickSuggestion('https://google.com')}
              >
                <div className="dropdown-icon-tile">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <div className="dropdown-info">
                  <span className="dropdown-item-title">Google Search</span>
                  <span className="dropdown-item-sub">google.com</span>
                </div>
              </div>

              <div
                className="dropdown-item"
                onMouseDown={() => handleQuickSuggestion('https://github.com')}
              >
                <div className="dropdown-icon-tile">
                  <span className="material-symbols-outlined">terminal</span>
                </div>
                <div className="dropdown-info">
                  <span className="dropdown-item-title">GitHub Developer Portal</span>
                  <span className="dropdown-item-sub">github.com</span>
                </div>
              </div>

              <div
                className="dropdown-item"
                onMouseDown={() => handleQuickSuggestion('https://news.ycombinator.com')}
              >
                <div className="dropdown-icon-tile">
                  <span className="material-symbols-outlined">newspaper</span>
                </div>
                <div className="dropdown-info">
                  <span className="dropdown-item-title">Hacker News</span>
                  <span className="dropdown-item-sub">news.ycombinator.com</span>
                </div>
              </div>

              <div
                className="dropdown-item"
                onMouseDown={() => handleQuickSuggestion('https://wikipedia.org')}
              >
                <div className="dropdown-icon-tile">
                  <span className="material-symbols-outlined">book</span>
                </div>
                <div className="dropdown-info">
                  <span className="dropdown-item-title">Wikipedia</span>
                  <span className="dropdown-item-sub">wikipedia.org</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right utility buttons */}
        <div className="toolbar-utilities">
          <button
            className="nav-action-btn"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts & Help"
          >
            <span className="material-symbols-outlined text-[18px]">keyboard</span>
          </button>
        </div>
      </div>
    </header>
  );
}
