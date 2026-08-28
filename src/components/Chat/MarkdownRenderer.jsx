import React, { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';

export default function MarkdownRenderer({ content }) {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);

  if (!content) return null;

  // Split content into code blocks and normal markdown text blocks
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const blocks = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: 'markdown',
        text: content.slice(lastIndex, match.index)
      });
    }
    blocks.push({
      type: 'code',
      language: match[1] || 'code',
      code: match[2].trim()
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    blocks.push({
      type: 'markdown',
      text: content.slice(lastIndex)
    });
  }

  const handleCopyCode = (index, codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Helper to parse inline formatting (bold, inline code, links)
  const renderFormattedLine = (lineText) => {
    // Replace inline code `code`
    const parts = [];
    const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
    let lastIdx = 0;
    let inlineMatch;

    while ((inlineMatch = inlineRegex.exec(lineText)) !== null) {
      if (inlineMatch.index > lastIdx) {
        parts.push(lineText.slice(lastIdx, inlineMatch.index));
      }
      const token = inlineMatch[0];

      if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={parts.length} className="markdown-inline-code">
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={parts.length} className="markdown-bold">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('[')) {
        const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
        if (linkMatch) {
          parts.push(
            <a
              key={parts.length}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="markdown-link"
            >
              {linkMatch[1]}
            </a>
          );
        } else {
          parts.push(token);
        }
      } else {
        parts.push(token);
      }
      lastIdx = inlineMatch.index + token.length;
    }

    if (lastIdx < lineText.length) {
      parts.push(lineText.slice(lastIdx));
    }

    return parts;
  };

  return (
    <div className="markdown-renderer-container">
      {blocks.map((block, bIdx) => {
        if (block.type === 'code') {
          return (
            <div key={bIdx} className="markdown-code-block">
              <div className="code-header">
                <span className="code-lang-tag"><Code size={12} /> {block.language}</span>
                <button
                  className="code-copy-btn"
                  onClick={() => handleCopyCode(bIdx, block.code)}
                  title="Copy code"
                >
                  {copiedCodeIndex === bIdx ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedCodeIndex === bIdx ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="code-content">
                <code>{block.code}</code>
              </pre>
            </div>
          );
        }

        // Parse markdown lines
        const lines = block.text.split('\n');
        return (
          <div key={bIdx} className="markdown-text-block">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();

              if (!trimmed) return <div key={lIdx} className="markdown-spacer" />;

              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={lIdx} className="markdown-h4">
                    {renderFormattedLine(trimmed.replace('### ', ''))}
                  </h4>
                );
              }

              if (trimmed.startsWith('#### ')) {
                return (
                  <h5 key={lIdx} className="markdown-h5">
                    {renderFormattedLine(trimmed.replace('#### ', ''))}
                  </h5>
                );
              }

              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const itemContent = trimmed.replace(/^[-*]\s+/, '');
                return (
                  <ul key={lIdx} className="markdown-ul">
                    <li className="markdown-li">
                      {renderFormattedLine(itemContent)}
                    </li>
                  </ul>
                );
              }

              return (
                <p key={lIdx} className="markdown-p">
                  {renderFormattedLine(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
