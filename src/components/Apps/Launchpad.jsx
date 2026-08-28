import React, { useState } from 'react';
import { ArrowUp, Globe, Sparkles, Clock3, ExternalLink } from 'lucide-react';
import './Apps.css';

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

  const handleSubmit = (event) => {
    event.preventDefault();
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

  return (
    <main className="launchpad-container comet-landing animate-fade-in">
      <div className="landing-ambient landing-ambient-one" />
      <div className="landing-ambient landing-ambient-two" />

      <section className="comet-landing-content" aria-labelledby="landing-title">
        <div className="comet-brand-mark" aria-hidden="true">
          <Sparkles size={18} />
        </div>
        <p className="comet-eyebrow">COMEX AI BROWSER</p>
        <h1 id="landing-title">What can I help you explore?</h1>
        <p className="comet-subtitle">Ask a question or enter a website to get started.</p>

        <form className="landing-prompt-form" onSubmit={handleSubmit}>
          <div className="landing-input-leading"><Sparkles size={17} /></div>
          <input
            id="landing-prompt"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ask anything or paste a website link..."
            aria-label="Ask Comex AI or enter a website link"
          />
          <button type="submit" className="landing-submit" aria-label="Submit prompt or open website">
            <ArrowUp size={17} />
          </button>
        </form>

        <div className="landing-hints" aria-label="Input options">
          <span><Sparkles size={13} /> Ask Comex AI</span>
          <span><Globe size={13} /> Open a link</span>
        </div>

        {history.length > 0 && (
          <section className="landing-history" aria-labelledby="landing-history-title">
            <div className="landing-history-heading">
              <Clock3 size={14} />
              <h2 id="landing-history-title">Recent exploration</h2>
            </div>
            <div className="landing-history-list">
              {history.slice(0, 6).map((item) => (
                <div key={item.id} className={`landing-history-item landing-history-item--${item.status || 'done'}`}>
                  <div className="landing-history-item-header">
                    <span className="landing-history-item-title">{item.title}</span>
                    <span className="landing-history-item-time">{item.timestamp}</span>
                  </div>
                  {item.result && (
                    <pre className="landing-history-item-result">{item.result}</pre>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
