export const DEFAULT_BOOKMARKS = [
  { id: 'b1', title: 'Google', url: 'https://google.com', icon: 'Search', color: '#4285F4' },
  { id: 'b2', title: 'GitHub', url: 'https://github.com', icon: 'Github', color: '#333333' },
  { id: 'b3', title: 'Wikipedia', url: 'https://wikipedia.org', icon: 'BookOpen', color: '#6366f1' },
  { id: 'b4', title: 'Hacker News', url: 'https://news.ycombinator.com', icon: 'Flame', color: '#FF6600' },
  { id: 'b5', title: 'Dev Docs', url: 'https://devdocs.io', icon: 'Code', color: '#10b981' },
  { id: 'b6', title: 'Unsplash', url: 'https://unsplash.com', icon: 'Image', color: '#ec4899' },
  { id: 'b7', title: 'YouTube', url: 'https://youtube.com', icon: 'Tv', color: '#FF0000' },
  { id: 'b8', title: 'TechCrunch', url: 'https://techcrunch.com', icon: 'Globe', color: '#06b6d4' }
];

export const SUGGESTED_SEARCHES = [
  "How quantum computing works in 2026",
  "Latest AI models performance benchmarks",
  "React 19 server components overview",
  "Top open source GitHub projects this month",
  "WebAssembly future and browser APIs",
  "Design trends: Vision OS & Glassmorphism"
];

export const DUMMY_NEWS = [
  {
    id: 'n1',
    title: 'Breakthrough in Photonic Supercomputing Achieves 100x Energy Efficiency',
    domain: 'techcrunch.com',
    time: '2 hours ago',
    points: 482,
    comments: 124,
    category: 'Hardware'
  },
  {
    id: 'n2',
    title: 'Show HN: Comex Web Engine - Next-gen browser with embedded contextual AI',
    domain: 'github.com/comex-browser',
    time: '4 hours ago',
    points: 890,
    comments: 312,
    category: 'Show HN'
  },
  {
    id: 'n3',
    title: 'CSS Anchor Positioning & Container Queries reach 100% Global Baseline support',
    domain: 'web.dev',
    time: '6 hours ago',
    points: 345,
    comments: 87,
    category: 'Web Dev'
  },
  {
    id: 'n4',
    title: 'Why Browser-native AI interfaces are replacing traditional search engines',
    domain: 'nature.com',
    time: '8 hours ago',
    points: 620,
    comments: 201,
    category: 'AI Research'
  }
];

export const GITHUB_TRENDING_REPOS = [
  {
    name: 'nexus-browser/core',
    description: 'Ultra-fast modular browser engine built with React 19 and WebAssembly frame renderer.',
    stars: '24.8k',
    forks: '1.9k',
    language: 'TypeScript',
    langColor: '#3178c6',
    updated: 'Updated 10 mins ago'
  },
  {
    name: 'deepmind/agentic-ui',
    description: 'State-of-the-art UI primitives for generative AI chat interfaces & co-pilots.',
    stars: '42.1k',
    forks: '4.3k',
    language: 'JavaScript',
    langColor: '#f7df1e',
    updated: 'Updated 1 hour ago'
  },
  {
    name: 'glass-css/aurora-tokens',
    description: 'Comprehensive CSS custom properties for modern frosted glassmorphism apps.',
    stars: '12.4k',
    forks: '850',
    language: 'CSS',
    langColor: '#563d7c',
    updated: 'Updated yesterday'
  }
];

export const WIKIPEDIA_FEATURED_ARTICLE = {
  title: 'Quantum Teleportation',
  subtitle: 'From Wikipedia, the free encyclopedia',
  summary: 'Quantum teleportation is a technique for transferring quantum information from a sender at one location to a receiver some distance away. While classical teleportation converts physical matter, quantum teleportation transmits the precise quantum state of a qubit without physically sending the particle itself.',
  sections: [
    {
      heading: '1. Experimental Realization',
      text: 'First demonstrated in 1997 by Anton Zeilinger and his team, quantum teleportation has since been accomplished over satellite links spanning over 1,400 kilometers.'
    },
    {
      heading: '2. Applications in Quantum Networking',
      text: 'Quantum teleportation forms the foundational protocol for quantum key distribution (QKD) and quantum repeaters in future quantum internet architectures.'
    }
  ]
};
