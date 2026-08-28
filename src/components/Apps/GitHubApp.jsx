import React from 'react';
import { Star, GitFork, Eye, Code, FileText, CheckCircle2, History } from 'lucide-react';
import GithubIcon from '../Icons/GithubIcon';
import { GITHUB_TRENDING_REPOS } from '../../data/defaultSites';

export default function GitHubApp() {
  return (
    <div className="github-container animate-fade-in">
      <header className="github-header glass-panel">
        <div className="repo-header-info">
          <GithubIcon size={24} />
          <h2 className="repo-name">nexus-browser / <span>core</span></h2>
          <span className="repo-badge">Public</span>
        </div>

        <div className="repo-stats">
          <button className="glass-button"><Star size={14} /> Star <span>24.8k</span></button>
          <button className="glass-button"><GitFork size={14} /> Fork <span>1.9k</span></button>
          <button className="glass-button"><Eye size={14} /> Watch <span>420</span></button>
        </div>
      </header>

      {/* Repo Tabs */}
      <div className="github-tabs-bar">
        <span className="gh-tab active"><Code size={14} /> Code</span>
        <span className="gh-tab"><CheckCircle2 size={14} /> Issues (12)</span>
        <span className="gh-tab"><GitFork size={14} /> Pull Requests (4)</span>
        <span className="gh-tab"><History size={14} /> Actions</span>
      </div>

      {/* File Explorer & Readme */}
      <div className="github-content-layout">
        <div className="readme-card glass-panel">
          <div className="readme-header">
            <FileText size={16} />
            <span>README.md</span>
          </div>

          <div className="readme-body">
            <h1>🚀 Nexus Browser & Copilot Engine</h1>
            <p>
              Nexus is an ultra-modern modular browser interface featuring high-performance tab management, 
              integrated omnibox autocomplete, custom themes, and contextual AI chat capabilities.
            </p>

            <h3>✨ Features</h3>
            <ul>
              <li><strong>Multi-Tab Navigation:</strong> Add, close, switch, and maintain tab history stack dynamically.</li>
              <li><strong>Contextual AI Assistant:</strong> Built-in chat drawer with pre-loaded default welcome messages and instant prompt pills.</li>
              <li><strong>Modern Aesthetics:</strong> Frosted glass backdrop filters, vibrant color palettes, and responsive UI design.</li>
              <li><strong>Real & Simulated Web Viewing:</strong> Full support for real external web pages and interactive app simulators.</li>
            </ul>

            <div className="code-box">
              <pre>npm install &amp;&amp; npm run dev</pre>
            </div>
          </div>
        </div>

        <div className="trending-side-panel glass-panel">
          <h4 className="side-title">Trending Repositories</h4>
          <div className="trending-repos-list">
            {GITHUB_TRENDING_REPOS.map((repo, idx) => (
              <div key={idx} className="trending-repo-item">
                <h5 className="tr-name">{repo.name}</h5>
                <p className="tr-desc">{repo.description}</p>
                <div className="tr-meta">
                  <span className="tr-lang">
                    <span className="lang-dot" style={{ background: repo.langColor }}></span>
                    {repo.language}
                  </span>
                  <span>★ {repo.stars}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
