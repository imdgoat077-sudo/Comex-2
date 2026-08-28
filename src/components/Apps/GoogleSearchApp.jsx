import React, { useState, useEffect } from 'react';
import { Search, Globe, Sparkles, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';

export default function GoogleSearchApp({ currentUrl, onNavigate }) {
  // Extract search query if present in URL
  const getQueryFromUrl = (urlStr) => {
    try {
      const urlObj = new URL(urlStr);
      return urlObj.searchParams.get('q') || 'Quantum Computing in 2026';
    } catch {
      return 'Quantum Computing in 2026';
    }
  };

  const [query, setQuery] = useState(getQueryFromUrl(currentUrl));

  useEffect(() => {
    setQuery(getQueryFromUrl(currentUrl));
  }, [currentUrl]);

  const results = [
    {
      title: `Quantum Teleportation & Supercomputing Breakthroughs (2026)`,
      url: 'https://wikipedia.org',
      displayUrl: 'wikipedia.org > wiki > Quantum_teleportation',
      snippet: 'Overview of recent optical fiber and satellite quantum key distribution protocols. Demonstrates non-destructive qubit state transfers.',
      tag: 'Encyclopedia'
    },
    {
      title: `nexus-browser/core: Next-Gen AI Browser Engine on GitHub`,
      url: 'https://github.com',
      displayUrl: 'github.com > nexus-browser > core',
      snippet: 'State-of-the-art modular web engine with built-in contextual AI co-pilot, tab management, and frosted glass layout.',
      tag: 'GitHub Repo'
    },
    {
      title: `Top Tech News & Discussion - Hacker News`,
      url: 'https://news.ycombinator.com',
      displayUrl: 'news.ycombinator.com',
      snippet: 'Live tech stories, developer discussions, Show HN projects, and computer science breakthroughs.',
      tag: 'Community'
    },
    {
      title: `Web Platform Features 2026 - Modern Guidance & API Standards`,
      url: 'https://devdocs.io',
      displayUrl: 'devdocs.io > web-platform',
      snippet: 'Complete documentation for CSS Anchor Positioning, View Transitions API, and WebAssembly SIMD primitives.',
      tag: 'Documentation'
    }
  ];

  return (
    <div className="google-app-container animate-fade-in">
      {/* Search Header */}
      <div className="google-search-header">
        <div className="google-logo" onClick={() => onNavigate('https://google.com')}>
          <span className="g-b">G</span>
          <span className="g-r">o</span>
          <span className="g-y">o</span>
          <span className="g-b">g</span>
          <span className="g-g">l</span>
          <span className="g-r">e</span>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            onNavigate(`https://google.com/search?q=${encodeURIComponent(query)}`);
          }}
          className="google-search-bar"
        >
          <input
            type="text"
            className="google-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="google-search-btn">
            <Search size={16} />
          </button>
        </form>
      </div>

      {/* Results Content */}
      <div className="google-results-layout">
        <div className="main-results">
          <p className="results-count">About 4,210,000 results (0.24 seconds) for "{query}"</p>

          {/* AI Search Overview Card */}
          <div className="ai-overview-card glass-panel">
            <div className="ai-card-header">
              <Sparkles size={16} className="sparkle-icon" />
              <span>AI Search Overview</span>
            </div>
            <p className="ai-card-text">
              Results for <strong>"{query}"</strong> highlight rapidly growing developments in browser computing, 
              quantum networking, and agentic UI systems. Key topics include high-speed frame rendering, 
              contextual LLM copilots, and baseline CSS enhancements.
            </p>
          </div>

          {/* Results List */}
          <div className="results-list">
            {results.map((res, idx) => (
              <div key={idx} className="result-card">
                <span className="display-url">{res.displayUrl}</span>
                <h3 className="result-title" onClick={() => onNavigate(res.url)}>
                  {res.title}
                </h3>
                <p className="result-snippet">{res.snippet}</p>
                <span className="result-tag">{res.tag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Knowledge Graph Side Card */}
        <div className="knowledge-card glass-panel">
          <h4 className="knowledge-title">Nexus Web Architecture</h4>
          <span className="knowledge-subtitle">Software Framework</span>
          <p className="knowledge-desc">
            A modern client-side browser layout that embeds tabs navigation, customizable omnibox controls, and contextual AI chat drawers.
          </p>
          <div className="knowledge-meta">
            <div className="meta-item">
              <span className="meta-label">Primary Stack</span>
              <span className="meta-val">React 19 + CSS Glassmorphism</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Copilot Mode</span>
              <span className="meta-val">Contextual Real-time AI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
