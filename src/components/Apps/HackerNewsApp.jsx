import React from 'react';
import { Flame, MessageSquare, ExternalLink, ArrowUp } from 'lucide-react';
import { DUMMY_NEWS } from '../../data/defaultSites';

export default function HackerNewsApp({ onNavigate }) {
  return (
    <div className="hn-container animate-fade-in">
      <header className="hn-header glass-panel">
        <div className="hn-brand">
          <div className="hn-logo">Y</div>
          <h2>Hacker News</h2>
        </div>
        <span className="hn-tag">Top Stories</span>
      </header>

      <div className="hn-news-list">
        {DUMMY_NEWS.map((item, idx) => (
          <div key={item.id} className="hn-item glass-panel">
            <span className="hn-rank">{idx + 1}.</span>
            <button className="hn-upvote"><ArrowUp size={14} /></button>
            <div className="hn-details">
              <h3 className="hn-title" onClick={() => onNavigate(`https://${item.domain}`)}>
                {item.title} <span className="hn-domain">({item.domain})</span>
              </h3>
              <p className="hn-meta">
                {item.points} points by dev_hero {item.time} | hide | <MessageSquare size={11} /> {item.comments} comments
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
