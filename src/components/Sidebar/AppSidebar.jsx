import React from 'react';
import './AppSidebar.css';

export default function AppSidebar({
  isOpen = true,
  activeTab,
  tabCount = 1,
  activeView = 'canvas',
  onSelectView,
  onOpenSettings,
  onToggleSidebar
}) {
  return (
    <aside className={`app-sidebar ${isOpen ? '' : 'collapsed'}`}>
      {/* Top branding / wordmark (drag region on mac) */}
      <div className="drag-region sidebar-header">
        <div className="no-drag sidebar-logo-icon">
          <span className="material-symbols-outlined text-[18px]">travel_explore</span>
        </div>
        <div className="no-drag sidebar-logo-text">
          <span className="sidebar-brand-name">Comex Workspace</span>
          <span className="sidebar-brand-version">v2.4 Browser Engine</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        <button
          className={`sidebar-nav-item ${activeView === 'canvas' ? 'active' : ''}`}
          onClick={() => onSelectView('canvas')}
        >
          <span className="material-symbols-outlined text-[18px]">tab</span>
          <span>Active Canvas</span>
        </button>

        <button
          className={`sidebar-nav-item ${activeView === 'copilot' ? 'active' : ''}`}
          onClick={() => onSelectView('copilot')}
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          <span>AI Co-Pilot</span>
        </button>

        <button
          className={`sidebar-nav-item ${activeView === 'brain' ? 'active' : ''}`}
          onClick={() => onSelectView('brain')}
        >
          <span className="material-symbols-outlined text-[18px]">psychology</span>
          <span>Brain Memory</span>
        </button>

        <button
          className={`sidebar-nav-item ${activeView === 'research' ? 'active' : ''}`}
          onClick={() => onSelectView('research')}
        >
          <span className="material-symbols-outlined text-[18px]">auto_stories</span>
          <span>Research Vault</span>
        </button>

        <button
          className={`sidebar-nav-item ${activeView === 'collections' ? 'active' : ''}`}
          onClick={() => onSelectView('collections')}
        >
          <span className="material-symbols-outlined text-[18px]">bookmarks</span>
          <span>Collections</span>
        </button>

        <button
          className={`sidebar-nav-item ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => onSelectView('history')}
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          <span>History &amp; Logs</span>
        </button>
      </nav>

      {/* Active context card */}
      <div className="sidebar-bottom">
        <div className="context-card">
          <div className="context-header">
            <span className="context-label">Active Context</span>
            <span className="context-dot animate-pulse-dot" />
          </div>
          <p className="context-title">
            {activeTab?.title && activeTab.title !== 'Comex Launchpad' ? activeTab.title : 'New Session'}
          </p>
          <p className="context-count">
            {tabCount} tab{tabCount !== 1 ? 's' : ''} open
          </p>
        </div>

        {/* Footer actions */}
        <div className="sidebar-footer-row">
          <button className="sidebar-settings-btn" onClick={onOpenSettings} title="Preferences & Shortcuts">
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span>Preferences</span>
          </button>
          <div className="sidebar-avatar" title="User Profile">
            <span className="material-symbols-outlined text-[16px]">person</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
