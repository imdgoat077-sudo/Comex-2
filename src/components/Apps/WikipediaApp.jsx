import React from 'react';
import { BookOpen, ExternalLink, Bookmark, Share2, Globe, Clock } from 'lucide-react';
import { WIKIPEDIA_FEATURED_ARTICLE } from '../../data/defaultSites';

export default function WikipediaApp() {
  const article = WIKIPEDIA_FEATURED_ARTICLE;

  return (
    <div className="wikipedia-container animate-fade-in">
      <header className="wiki-header glass-panel">
        <div className="wiki-brand">
          <BookOpen size={24} className="wiki-logo" />
          <div>
            <h2 className="wiki-name">WIKIPEDIA</h2>
            <span className="wiki-tagline">The Free Encyclopedia</span>
          </div>
        </div>

        <div className="wiki-actions">
          <button className="glass-button"><Share2 size={14} /> Share</button>
          <button className="glass-button"><Bookmark size={14} /> Bookmark</button>
        </div>
      </header>

      <div className="wiki-article-body">
        <h1 className="article-title">{article.title}</h1>
        <p className="article-subtitle">{article.subtitle}</p>

        <div className="article-box glass-panel">
          <p className="summary-text">{article.summary}</p>
        </div>

        <div className="sections-list">
          {article.sections.map((sec, idx) => (
            <div key={idx} className="wiki-section">
              <h3 className="section-heading">{sec.heading}</h3>
              <p className="section-text">{sec.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
