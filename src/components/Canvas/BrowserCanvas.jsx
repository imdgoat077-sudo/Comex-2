import React, { useEffect, useRef } from 'react';
import Launchpad from '../Apps/Launchpad';
import GoogleSearchApp from '../Apps/GoogleSearchApp';
import WikipediaApp from '../Apps/WikipediaApp';
import GitHubApp from '../Apps/GitHubApp';
import HackerNewsApp from '../Apps/HackerNewsApp';
import IframeViewer from '../Apps/IframeViewer';

function isInternalUrl(url) {
  return !url || url === 'comex://launchpad' || url === 'nexus://launchpad' || url === 'about:blank';
}

export default function BrowserCanvas({
  tabs = [],
  activeTabId,
  activeTab,
  onNavigate,
  onOpenChat,
  onSubmitLandingPrompt,
  onUpdateTabInfo,
  history = [],
  isChatOpen = false,
}) {
  const isElectron = typeof window !== 'undefined' && window.nexusNative?.isElectron;
  const boundsRef = useRef(null);

  // Element ref used only as a presence/mount check; we compute bounds
  // from window dimensions + known chrome heights, not from getBoundingClientRect,
  // because the React renderer's coords and the BrowserWindow content coords are
  // not the same coordinate space.
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isElectron || !window.nexusNative?.tabs) return;

    const CHROME_TOP_PX = 78;       // 42 (topbar/tabs) + 32 (toolbar/address)
    const CHROME_TOP_WITH_BOOKMARKS_PX = 110; // 78 + 32 (bookmarks bar)
    const CONTENT_VIEW_TOP_OFFSET_PX = 28;   // macOS hiddenInset title bar inset

    const sendBounds = () => {
      const el = canvasRef.current;
      if (!el) {
        console.log('[CANVAS] sendBounds: canvasRef.current is null, skipping');
        return;
      }

      const chatWidth = isChatOpen ? Math.min(440, Math.round(window.innerWidth * 0.92)) : 0;
      const hidden = isInternalUrl(activeTab?.url);

      console.log('[CANVAS] sendBounds called');
      console.log('[CANVAS] activeTab.url:', activeTab?.url);
      console.log('[CANVAS] isInternalUrl:', hidden);
      console.log('[CANVAS] isChatOpen:', isChatOpen);
      console.log('[CANVAS] chatWidth:', chatWidth);
      console.log('[CANVAS] window.innerWidth:', window.innerWidth);
      console.log('[CANVAS] window.innerHeight:', window.innerHeight);

      // CRITICAL FIX: The WebContentsView uses BrowserWindow native coordinates,
      // where y=0 is the top of the window content view (below macOS traffic lights).
      // The React renderer viewport (window.innerHeight) is in CSS pixels and includes
      // the full client area.
      //
      // To calculate the correct WebContentsView height:
      // - The view starts at y = CHROME_TOP_WITH_BOOKMARKS_PX + CONTENT_VIEW_TOP_OFFSET_PX
      // - The view should extend to the bottom of the window
      // - Available height = window.innerHeight - CHROME_TOP_WITH_BOOKMARKS_PX
      //
      // This ensures the view occupies the space BELOW the chrome without overlapping it.
      const viewStartY = CHROME_TOP_WITH_BOOKMARKS_PX + CONTENT_VIEW_TOP_OFFSET_PX;
      const width = Math.max(0, window.innerWidth - chatWidth);
      
      // The height is the remaining space from where the view starts to the bottom of the window.
      // Since the React viewport already accounts for the chrome in its layout,
      // we can use the canvas element's actual rendered height.
      const canvasRect = el.getBoundingClientRect();
      
      // CRITICAL FIX: If canvasRect.height is 0 (e.g. display: none or not painted yet),
      // fallback to calculating based on window.innerHeight
      const height = canvasRect.height > 0 
        ? canvasRect.height 
        : Math.max(0, window.innerHeight - CHROME_TOP_WITH_BOOKMARKS_PX);

      const bounds = {
        x: 0,
        y: viewStartY,
        width,
        height,
        isHidden: hidden,
      };

      console.log('[CANVAS] canvasRect.height:', canvasRect.height);
      console.log('[CANVAS] Calculated viewStartY:', viewStartY);
      console.log('[CANVAS] Calculated height:', height);
      console.log('[CANVAS] Total coverage (y + height):', viewStartY + height);
      console.log('[CANVAS] Sending bounds to main process:', JSON.stringify(bounds));

      window.nexusNative.tabs.setBounds(bounds);
    };

    // Send after mount so the canvas element exists in DOM
    const raf = requestAnimationFrame(sendBounds);
    const observer = new ResizeObserver(sendBounds);
    if (canvasRef.current) observer.observe(canvasRef.current);
    window.addEventListener('resize', sendBounds);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', sendBounds);
    };
  }, [isElectron, activeTabId, activeTab?.url, isChatOpen]);

  const renderTabContent = (tab) => {
    const url = tab.url || 'comex://launchpad';

    if (isInternalUrl(url)) {
      return <Launchpad onNavigate={onNavigate} onOpenChat={onOpenChat} onSubmitPrompt={onSubmitLandingPrompt} history={history} />;
    }

    // Real websites are rendered by Electron WebContentsView, not React.
    if (isElectron) {
      return null;
    }

    if (url.includes('google.com')) {
      return <GoogleSearchApp currentUrl={url} onNavigate={onNavigate} />;
    }

    if (url.includes('wikipedia.org')) {
      return <WikipediaApp />;
    }

    if (url.includes('github.com')) {
      return <GitHubApp />;
    }

    if (url.includes('news.ycombinator.com')) {
      return <HackerNewsApp onNavigate={onNavigate} />;
    }

    return (
      <IframeViewer
        url={url}
        title={tab.title}
        tabId={tab.id}
        onUpdateTabInfo={onUpdateTabInfo}
      />
    );
  };

  const tabList = tabs.length > 0 ? tabs : (activeTab ? [activeTab] : []);

  return (
    <main
      ref={canvasRef}
      className="browser-canvas-area"
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {tabList.map((tab) => {
        const isActive = tab.id === activeTabId || (activeTab && tab.id === activeTab.id);
        return (
          <div
            key={tab.id}
            className={`tab-viewport ${isActive ? 'active' : 'hidden'}`}
            style={{
              display: isActive ? 'block' : 'none',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            {renderTabContent(tab)}
          </div>
        );
      })}
    </main>
  );
}
