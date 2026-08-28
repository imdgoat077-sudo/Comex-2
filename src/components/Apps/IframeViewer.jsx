import React, { useState, useEffect, useRef } from 'react';
import { Globe, ExternalLink, ShieldAlert, RefreshCw } from 'lucide-react';

export default function IframeViewer({ url, title, tabId, onUpdateTabInfo }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const webviewRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const currentNavigatedUrlRef = useRef(url);

  const isElectron = typeof window !== 'undefined' && window.nexusNative?.isElectron;

  const onUpdateTabInfoRef = useRef(onUpdateTabInfo);
  const tabIdRef = useRef(tabId);

  useEffect(() => {
    onUpdateTabInfoRef.current = onUpdateTabInfo;
    tabIdRef.current = tabId;
  });

  // Handle programmatically requested URL changes (user input in address bar)
  useEffect(() => {
    if (isElectron && webviewRef.current) {
      const webview = webviewRef.current;
      if (url && currentNavigatedUrlRef.current !== url) {
        currentNavigatedUrlRef.current = url;
        hasLoadedRef.current = false;
        setIsLoading(true);
        try {
          if (typeof webview.loadURL === 'function') {
            webview.loadURL(url);
          }
        } catch {
          // ignore transient load errors
        }
      }
    }
  }, [url, isElectron]);

  // Listen for toolbar Back/Forward/Reload navigation commands
  useEffect(() => {
    const handleWebviewNavCommand = (e) => {
      const { action, tabId: targetTabId } = e.detail || {};
      if (targetTabId !== tabIdRef.current || !webviewRef.current) return;

      const webview = webviewRef.current;
      try {
        if (action === 'BACK' && typeof webview.goBack === 'function') {
          if (webview.canGoBack()) {
            webview.goBack();
          }
        } else if (action === 'FORWARD' && typeof webview.goForward === 'function') {
          if (webview.canGoForward()) {
            webview.goForward();
          }
        } else if (action === 'RELOAD' && typeof webview.reload === 'function') {
          webview.reload();
        }
      } catch {
        // ignore navigation errors
      }
    };

    window.addEventListener('comex-webview-nav', handleWebviewNavCommand);
    return () => window.removeEventListener('comex-webview-nav', handleWebviewNavCommand);
  }, []);

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    hasLoadedRef.current = false;

    if (isElectron && webviewRef.current) {
      const webview = webviewRef.current;

      const updateNavState = () => {
        if (onUpdateTabInfoRef.current && tabIdRef.current && typeof webview.canGoBack === 'function') {
          onUpdateTabInfoRef.current(
            tabIdRef.current,
            null,
            null,
            null,
            null,
            { canGoBack: webview.canGoBack(), canGoForward: webview.canGoForward() }
          );
        }
      };

      const handleStart = () => {
        if (!hasLoadedRef.current) {
          setIsLoading(true);
        }
        updateNavState();
      };

      const handleStop = () => {
        hasLoadedRef.current = true;
        setIsLoading(false);
        updateNavState();
      };

      const handleDomReady = () => {
        hasLoadedRef.current = true;
        setIsLoading(false);
        updateNavState();
      };

      const handleFail = () => {
        setIsLoading(false);
        updateNavState();
      };

      const handleTitleUpdate = (e) => {
        if (e.title && onUpdateTabInfoRef.current && tabIdRef.current) {
          onUpdateTabInfoRef.current(tabIdRef.current, e.title);
        }
        updateNavState();
      };

      const handleFaviconUpdate = (e) => {
        if (e.favicons && e.favicons.length > 0 && onUpdateTabInfoRef.current && tabIdRef.current) {
          onUpdateTabInfoRef.current(tabIdRef.current, null, e.favicons[0]);
        }
      };

      const handleNavigated = (e) => {
        if (e.url) {
          currentNavigatedUrlRef.current = e.url;
          if (onUpdateTabInfoRef.current && tabIdRef.current) {
            onUpdateTabInfoRef.current(tabIdRef.current, null, null, e.url);
          }
        }
        updateNavState();
      };

      const handleMediaPlay = () => {
        if (onUpdateTabInfoRef.current && tabIdRef.current) {
          onUpdateTabInfoRef.current(tabIdRef.current, null, null, null, true);
        }
      };

      const handleMediaPause = () => {
        if (onUpdateTabInfoRef.current && tabIdRef.current) {
          onUpdateTabInfoRef.current(tabIdRef.current, null, null, null, false);
        }
      };

      webview.addEventListener('did-start-loading', handleStart);
      webview.addEventListener('did-stop-loading', handleStop);
      webview.addEventListener('did-finish-load', handleStop);
      webview.addEventListener('dom-ready', handleDomReady);
      webview.addEventListener('did-fail-load', handleFail);
      webview.addEventListener('page-title-updated', handleTitleUpdate);
      webview.addEventListener('page-favicon-updated', handleFaviconUpdate);
      webview.addEventListener('did-navigate', handleNavigated);
      webview.addEventListener('did-navigate-in-page', handleNavigated);
      webview.addEventListener('media-started-playing', handleMediaPlay);
      webview.addEventListener('media-paused', handleMediaPause);

      const fallbackTimer = setTimeout(() => {
        hasLoadedRef.current = true;
        setIsLoading(false);
      }, 1200);

      return () => {
        clearTimeout(fallbackTimer);
        webview.removeEventListener('did-start-loading', handleStart);
        webview.removeEventListener('did-stop-loading', handleStop);
        webview.removeEventListener('did-finish-load', handleStop);
        webview.removeEventListener('dom-ready', handleDomReady);
        webview.removeEventListener('did-fail-load', handleFail);
        webview.removeEventListener('page-title-updated', handleTitleUpdate);
        webview.removeEventListener('page-favicon-updated', handleFaviconUpdate);
        webview.removeEventListener('did-navigate', handleNavigated);
        webview.removeEventListener('did-navigate-in-page', handleNavigated);
        webview.removeEventListener('media-started-playing', handleMediaPlay);
        webview.removeEventListener('media-paused', handleMediaPause);
      };
    } else {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isElectron]);

  return (
    <div className="iframe-viewer-container">
      {isLoading && (
        <div className="iframe-loading-overlay glass-panel">
          <RefreshCw size={24} className="animate-spin text-accent" />
          <span>Connecting to {url}...</span>
        </div>
      )}

      {isElectron ? (
        <webview
          ref={webviewRef}
          src={url}
          className="web-iframe"
          allowpopups="true"
          useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        />
      ) : hasError ? (
        <div className="iframe-error-fallback glass-panel-elevated animate-fade-in">
          <ShieldAlert size={42} className="error-icon" />
          <h2>Security Shield & Frame Guard</h2>
          <p>
            The website <strong>{url}</strong> prohibits embedding inside a standard browser iframe via <code>X-Frame-Options</code> or <code>Content-Security-Policy</code>.
          </p>
          <div className="fallback-actions">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button glass-button-primary"
            >
              Open in External Tab <ExternalLink size={14} />
            </a>
          </div>
        </div>
      ) : (
        <iframe
          src={url}
          title={title || 'Web Frame'}
          className="web-iframe"
          onError={() => setHasError(true)}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      )}
    </div>
  );
}
