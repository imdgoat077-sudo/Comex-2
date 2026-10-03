# Sphere UI Redesign for Comex Browser Implementation Plan

> **Goal**: Redesign the entire Comex browser user interface to match the sleek, modern Sphere browser UI (`electron-browser`), incorporating the left collapsible sidebar, custom dual-row chrome header, rich hero omnibar with animated background blobs and frequent spaces on Launchpad, Sphere-styled Co-Pilot and Brain Drawer, and synchronized WebContentsView layout bounds coordinator.

## Proposed Changes

### 1. Document Head & Design System Tokens (`index.html`, `src/index.css`)
- In `index.html`:
  - Add Google Fonts link for `Plus Jakarta Sans` and `Material Symbols Outlined`.
  - Add Tailwind CDN script with custom color config matching Sphere (`surface`, `surface-container-*`, `primary`, `secondary`, `tertiary`, etc.).
- In `src/index.css`:
  - Define all color variables, easing tokens (`--ease-spring`, `--ease-smooth`), animations (`pulse-dot`, `blob-drift`, `fade-in`, `scale-up`), and scrollbar styles.
  - Reset styles to blend with the desktop shell `#f6fbf5`.

### 2. Main App Shell & Sidebar Layout (`src/App.jsx`, `src/App.css`, `src/components/Sidebar/AppSidebar.jsx`)
- Create `src/components/Sidebar/AppSidebar.jsx`:
  - Top wordmark branding (`Sphere / Comex Workspace v2.4`) with macOS drag region support.
  - Nav items: `Active Canvas`, `AI Co-Pilot`, `Research Vault`, `Collections`, `History & Logs`, `Brain Memory`.
  - `Active Context` pill with dynamic pulse, active tab title, and open tabs count.
  - Footer with Preferences toggle button and profile avatar.
- In `src/App.jsx`:
  - Introduce `sidebarOpen` state (default true, toggleable).
  - Wrap workspace in flex container with sidebar on the left and main browser area on the right.
  - Wire shortcuts and context actions.

### 3. Sleek Chrome Header & Tab Strip (`src/components/Navbar/BrowserNavbar.jsx`, `src/components/Navbar/BrowserNavbar.css`)
- Redesign `BrowserNavbar.jsx`:
  - Top row: macOS traffic light offset spacer (72px), sleek tab strip (`tab-item` with active glow, favicon/loading spinner, close button on hover, add tab `+` button), right status pill (`Comex v2.4`) and `Assistant` launcher button.
  - Bottom row: Back / Forward / Reload / Home action buttons, pill URL bar (`rounded-full`, lock icon, search icon, star bookmark button), Split view & Shortcuts buttons.
- Update `BrowserNavbar.css` to match Sphere's sleek styling.

### 4. Dynamic WebContentsView Layout Bounds Coordinator (`src/components/Canvas/BrowserCanvas.jsx`)
- Update `sendBounds` in `BrowserCanvas.jsx`:
  - Compute `x`: must account for sidebar width when open (`bodyRect.left` or `sidebarOpen ? 256 : 0`).
  - Compute `y`: titlebar offset + header height.
  - Compute `width`: container width deducting drawer width if `isChatOpen`.
  - Compute `height`: clamped window height.
  - Send proper bounds to `window.nexusNative.tabs.setBounds`.

### 5. New Tab Home / Launchpad (`src/components/Apps/Launchpad.jsx`, `src/components/Apps/Apps.css`)
- Redesign `Launchpad.jsx`:
  - Background soft gradient blobs with subtle animated drift (`blob-drift`).
  - Hero header: "Comex Engine v2.4 • Co-Browser Active" badge, "Where would you like to begin today?", and subtitle.
  - Hero search card: Textarea omnibar, mode buttons ("Search", "Live Web", "Deep Reason"), mic icon, upward arrow submit button.
  - Quick suggestion chips with Material icons.
  - Frequent Spaces grid with 6 cards (GitHub, Figma, Notion, YouTube, Hacker News, Wikipedia) with colored icon squares, hover spring elevation, and domain subtitles.
  - Recent exploration list preserved for agent tasks.

### 6. AI Co-Pilot & Brain Drawer (`src/components/Chat/ChatDrawer.jsx`, `src/components/Chat/ChatDrawer.css`)
- Re-skin `ChatDrawer.jsx`:
  - Side panel: 400px width with clean border and header.
  - Tabs: `Sphere Co-Pilot` (chat) and `Brain Memory` (knowledge graph).
  - Chat messages:
    - User: Terracotta peach bubble (`#ffdbd2`, text `#3c0800`).
    - Assistant: White card bubble with `#e5e9e4` border, perception chip, live streaming content, step logs.
  - Floating input: Rounded-2xl card container with model pill, `@` tab mention, upward arrow send button.
  - Brain section: Clean list views for user memories, domain skills, reflections, adapters.

---

## Verification Plan
1. Run `npm run build` or `npx vite build` to verify React compilation with zero errors.
2. Run oxlint to verify lint cleanliness.
3. Test layout responsiveness and bounds coordinates.
