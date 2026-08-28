import React from 'react';
import { Command, X, Sparkles, Plus, RotateCw, Search, Bookmark } from 'lucide-react';
import './Modals.css';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Cmd + T / Ctrl + T', desc: 'Open New Tab', icon: Plus },
    { key: 'Cmd + W / Ctrl + W', desc: 'Close Active Tab', icon: X },
    { key: 'Cmd + R / Ctrl + R', desc: 'Reload Active Tab', icon: RotateCw },
    { key: 'Cmd + J / Ctrl + J', desc: 'Toggle AI Assistant Chat', icon: Sparkles },
    { key: 'Cmd + L / Ctrl + L', desc: 'Focus Address Bar', icon: Search }
  ];

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-content glass-panel-elevated" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Command size={18} className="modal-icon text-accent" />
            <h3>Keyboard Shortcuts</h3>
          </div>
          <button className="chat-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="shortcuts-list">
          {shortcuts.map((sc, idx) => {
            const Icon = sc.icon;
            return (
              <div key={idx} className="shortcut-row">
                <div className="shortcut-desc">
                  <Icon size={14} className="sc-icon" />
                  <span>{sc.desc}</span>
                </div>
                <kbd className="shortcut-key">{sc.key}</kbd>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
