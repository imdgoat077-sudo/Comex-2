import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, RotateCw, Home, Lock, Star,
  Plus, X, Sparkles, Palette, Search, ShieldCheck,
  HelpCircle, Sliders, ExternalLink, Bookmark, Cpu, Volume2
} from 'lucide-react';
import './BrowserNavbar.css';

export default function BrowserNavbar({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onNavigate,
  onReload,
  onGoHome,
  onToggleChat,
  isChatOpen,
  unreadCount,
  currentTheme,
  onChangeTheme,
  onOpenShortcuts
}) {
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const [urlInput, setUrlInput] = useState(activeTab?.url || '');
  const [isFocused, setIsFocused] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync input value when active tab URL changes
  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url);
      setIsBookmarked(activeTab.isBookmarked || false);
    }
  }, [activeTab?.id, activeTab?.url, activeTab?.isBookmarked]);

  const canGoBack = activeTab ? (activeTab.canGoBack || activeTab.historyIndex > 0) : false;
  const canGoForward = activeTab ? (activeTab.canGoForward || activeTab.historyIndex < activeTab.history.length - 1) : false;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    let targetUrl = urlInput.trim();
    // Check if input is a valid URL format or search query
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && !targetUrl.startsWith('nexus://')) {
      if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
        targetUrl = 'https://' + targetUrl;
      } else {
        // Search query -> redirect to Google simulator
        targetUrl = `https://google.com/search?q=${encodeURIComponent(targetUrl)}`;
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

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const isElectron = typeof window !== 'undefined' && window.nexusNative?.isElectron;

  return (
    <header className="browser-header">
      {/* Top Window Bar: Traffic Lights + Tabs */}
      <div className="browser-topbar">
        {/* macOS Window Controls */}
        {isElectron ? (
          <div className="electron-traffic-spacer" />
        ) : (
          <div className="window-controls">
            <span className="control-btn control-close" title="Close Window"></span>
            <span className="control-btn control-minimize" title="Minimize"></span>
            <span className="control-btn control-maximize" title="Expand"></span>
          </div>
        )}

        {/* Multi-Tab Container */}
        <div className="tabs-container">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                className={`browser-tab ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTab(tab.id)}
                title={tab.url}
              >
                <div className="tab-favicon">
                  {tab.isLoading ? (
                    <RotateCw className="tab-spinner animate-spin" size={13} />
                  ) : tab.favicon ? (
                    <img src={tab.favicon} alt="" className="tab-favicon-img" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <span className="tab-dot"></span>
                  )}
                </div>
                <span className="tab-title">{tab.title || 'New Tab'}</span>
                {tab.isAudible && (
                  <span className="tab-audio-indicator" title="Audio playing on this tab">
                    <Volume2 size={13} className="tab-audio-icon active animate-pulse" />
                  </span>
                )}
                {tabs.length > 1 && (
                  <button
                    className="tab-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    title="Close tab (Cmd+W)"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}

          {/* New Tab Button */}
          <button 
            className="add-tab-btn" 
            onClick={onAddTab}
            title="New Tab (Cmd+T)"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Right Utility Buttons */}
        <div className="topbar-actions">
          <button 
            className="utility-btn" 
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts"
          >
            <HelpCircle size={15} />
          </button>
          
          <button 
            className="utility-btn" 
            onClick={() => {
              const themes = ['dark', 'aurora', 'cyberpunk', 'minimal'];
              const nextIdx = (themes.indexOf(currentTheme) + 1) % themes.length;
              onChangeTheme(themes[nextIdx]);
            }}
            title={`Theme: ${currentTheme}`}
          >
            <Palette size={15} />
          </button>
        </div>
      </div>

      {/* Main Address & Navigation Toolbar */}
      <div className="browser-toolbar">
        {/* Navigation Buttons */}
        <div className="nav-group">
          <button 
            className={`nav-btn ${!canGoBack ? 'disabled' : ''}`}
            disabled={!canGoBack}
            onClick={() => onNavigate('BACK')}
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>
          
          <button 
            className={`nav-btn ${!canGoForward ? 'disabled' : ''}`}
            disabled={!canGoForward}
            onClick={() => onNavigate('FORWARD')}
            title="Forward"
          >
            <ArrowRight size={16} />
          </button>

          <button 
            className="nav-btn"
            onClick={onReload}
            title="Reload page (Cmd+R)"
          >
            <RotateCw className={activeTab?.isLoading ? 'animate-spin' : ''} size={15} />
          </button>

          <button
            className="nav-btn"
            onClick={onGoHome}
            title="Comex Launchpad Home"
          >
            <Home size={15} />
          </button>
        </div>

        {/* Omnibox / Address Bar Form */}
        <div className={`omnibox-container ${isFocused ? 'focused' : ''}`}>
          <form onSubmit={handleSubmit} className="omnibox-form">
            <div className="security-badge" title="Encrypted Connection (HTTPS)">
              {activeTab?.url?.startsWith('https://') || activeTab?.url?.startsWith('comex://') || activeTab?.url?.startsWith('nexus://') ? (
                <Lock size={13} className="lock-icon secure" />
              ) : (
                <ShieldCheck size={13} className="lock-icon" />
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              className="omnibox-input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder="Search Google or enter web address..."
            />

            <button 
              type="button" 
              className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
              onClick={toggleBookmark}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark this page"}
            >
              <Star size={14} fill={isBookmarked ? "#f59e0b" : "none"} />
            </button>
          </form>

          {/* Autocomplete & Quick Suggestion Dropdown */}
          {isFocused && (
            <div className="search-dropdown animate-fade-in" ref={dropdownRef}>
              <div className="dropdown-section-header">
                <span>Quick Navigations & Search</span>
              </div>
              <div 
                className="dropdown-item" 
                onClick={() => handleQuickSuggestion('https://google.com')}
              >
                <Search size={14} className="item-icon" />
                <span className="item-title">Google Search</span>
                <span className="item-url">google.com</span>
              </div>
              <div 
                className="dropdown-item" 
                onClick={() => handleQuickSuggestion('https://github.com')}
              >
                <Cpu size={14} className="item-icon" />
                <span className="item-title">GitHub Developer Portal</span>
                <span className="item-url">github.com</span>
              </div>
              <div 
                className="dropdown-item" 
                onClick={() => handleQuickSuggestion('https://wikipedia.org')}
              >
                <Bookmark size={14} className="item-icon" />
                <span className="item-title">Wikipedia Encyclopedia</span>
                <span className="item-url">wikipedia.org</span>
              </div>
              <div 
                className="dropdown-item" 
                onClick={() => handleQuickSuggestion('https://news.ycombinator.com')}
              >
                <ExternalLink size={14} className="item-icon" />
                <span className="item-title">Hacker News Tech Stories</span>
                <span className="item-url">news.ycombinator.com</span>
              </div>
            </div>
          )}
        </div>

        {/* AI Co-Pilot / Chat Toggle Button */}
        <div className="chat-toggle-wrapper">
          <button
            className={`chat-toggle-btn ${isChatOpen ? 'active' : ''}`}
            onClick={onToggleChat}
            title="Toggle Comex AI Assistant"
          >
            <Sparkles size={16} className="sparkle-icon" />
            <span className="chat-btn-label">Comex AI Assistant</span>
            {unreadCount > 0 && <span className="unread-dot">{unreadCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
