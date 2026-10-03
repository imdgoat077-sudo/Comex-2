import React, { useState } from 'react';
import './Apps.css';

const FREQUENT_SPACES = [
  { label: 'GitHub', url: 'https://github.com', icon: 'terminal', color: '#181d1a', bg: '#e5e9e4' },
  { label: 'Figma', url: 'https://figma.com', icon: 'draw', color: '#9e4229', bg: '#ffdbd2' },
  { label: 'Notion', url: 'https://notion.so', icon: 'menu_book', color: '#412a23', bg: '#ffdbd0' },
  { label: 'YouTube', url: 'https://youtube.com', icon: 'play_circle', color: '#ba1a1a', bg: '#ffdad6' },
  { label: 'Hacker News', url: 'https://news.ycombinator.com', icon: 'newspaper', color: '#003638', bg: '#bbebed' },
  { label: 'Wikipedia', url: 'https://wikipedia.org', icon: 'book', color: '#404848', bg: '#ebefea' },
];

const SUGGESTIONS = [
  { text: 'Compare Airbnb lofts in Shibuya with quiet desks', label: 'Compare Airbnb lofts in Shibuya', icon: 'hotel', color: 'text-secondary' },
  { text: 'What is the latest in quantum computing research?', label: 'Latest quantum computing news', icon: 'science', color: 'text-primary' },
  { text: 'Summarize Hacker News front page', label: 'Summarize Hacker News today', icon: 'analytics', color: 'text-tertiary' },
  { text: 'https://github.com', label: 'Open GitHub', icon: 'terminal', color: 'text-on-surface-variant' },
];

function normalizeWebUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.') ? url.href : null;
  } catch {
    return null;
  }
}

export default function Launchpad({ onNavigate, onOpenChat, onSubmitPrompt, history = [] }) {
  const [query, setQuery] = useState('');
  const [omniMode, setOmniMode] = useState('search'); // 'search' | 'web' | 'deep'

  const handleSubmit = (e) => {
    e?.preventDefault();
    const value = query.trim();
    if (!value) return;

    const webUrl = normalizeWebUrl(value);
    if (webUrl) {
      onNavigate(webUrl);
    } else if (onSubmitPrompt) {
      onSubmitPrompt(value);
    } else {
      onOpenChat?.();
    }
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChipClick = (item) => {
    const webUrl = normalizeWebUrl(item.text);
    if (webUrl) {
      onNavigate(webUrl);
    } else if (onSubmitPrompt) {
      onSubmitPrompt(item.text);
    } else {
      setQuery(item.text);
    }
  };

  return (
    <div className="home-page-container">
      {/* Soft background gradient blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="home-content-wrap">
        {/* Hero omnibar section */}
        <section className="hero-section">
          <div className="engine-pill-badge">
            <span className="badge-pulse-dot animate-pulse-dot" />
            <span className="badge-text">Sphere Engine v2.4 • Co-Browser Active</span>
          </div>

          <div className="hero-titles">
            <h1 className="hero-headline">Where would you like to begin today?</h1>
            <p className="hero-subtext">
              Navigate the open web, or let your AI co-pilot run multi-step research tasks.
            </p>
          </div>

          {/* Elevated Omnibar search card */}
          <div className="omni-card">
            <div className="omni-card-top">
              <div className="omni-input-icon">
                <span className="material-symbols-outlined text-[18px]">travel_explore</span>
              </div>
              <textarea
                className="omni-textarea"
                placeholder="Search the web, enter a URL, or ask your AI co-pilot..."
                rows={2}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="omni-card-bottom">
              <div className="omni-modes">
                <button
                  type="button"
                  onClick={() => setOmniMode('search')}
                  className={`omni-mode-btn ${omniMode === 'search' ? 'active' : ''}`}
                >
                  <span className="material-symbols-outlined text-[15px] text-primary">search</span>
                  <span>Search</span>
                  <span className="material-symbols-outlined text-[13px] text-on-surface-variant">expand_more</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOmniMode('web')}
                  className={`omni-mode-btn ${omniMode === 'web' ? 'active' : ''}`}
                >
                  <span className="material-symbols-outlined text-[15px]">language</span>
                  <span>Live Web</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOmniMode('deep')}
                  className={`omni-mode-btn ${omniMode === 'deep' ? 'active' : ''}`}
                >
                  <span className="material-symbols-outlined text-[15px]">memory</span>
                  <span>Deep Reason</span>
                </button>
              </div>

              <div className="omni-actions">
                <button
                  type="button"
                  className="omni-action-icon-btn"
                  title="Voice prompt"
                  onClick={() => {}}
                >
                  <span className="material-symbols-outlined text-[18px]">mic</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  className="omni-submit-btn"
                  title="Submit (Enter)"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Suggestion Chips */}
          <div className="suggestion-chips-container">
            <span className="suggestion-label">Try asking:</span>
            {SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className="suggestion-chip"
                onClick={() => handleChipClick(item)}
              >
                <span className={`material-symbols-outlined text-[14px] ${item.color}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Frequent Spaces Grid */}
        <section className="spaces-section">
          <div className="spaces-header">
            <span className="material-symbols-outlined text-tertiary text-[20px]">explore</span>
            <h2 className="spaces-title">Frequent Spaces</h2>
          </div>

          <div className="spaces-grid">
            {FREQUENT_SPACES.map((site, index) => (
              <a
                key={index}
                href={site.url}
                className="space-card"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(site.url);
                }}
              >
                <div
                  className="space-icon-box"
                  style={{ backgroundColor: site.bg, color: site.color }}
                >
                  <span className="material-symbols-outlined text-[18px]">{site.icon}</span>
                </div>
                <div className="space-info">
                  <p className="space-label">{site.label}</p>
                  <p className="space-url">{new URL(site.url).hostname}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Recent exploration history */}
        {history.length > 0 && (
          <section className="history-section">
            <div className="spaces-header">
              <span className="material-symbols-outlined text-primary text-[18px]">history</span>
              <h2 className="spaces-title">Recent Exploration</h2>
            </div>
            <div className="history-grid">
              {history.slice(0, 6).map((item) => (
                <div key={item.id} className="history-card">
                  <div className="history-card-header">
                    <span className="history-card-title">{item.title}</span>
                    <span className="history-card-time">{item.timestamp}</span>
                  </div>
                  {item.result && (
                    <p className="history-card-result">{item.result}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
