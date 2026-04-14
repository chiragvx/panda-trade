import { WidgetConfig } from './types';

export const WIDGET_REGISTRY: Record<string, WidgetConfig> = {
  // MARKET DATA
  watchlist: {
    id: 'watchlist',
    displayName: 'Watchlist',
    icon: 'List',
    shortcut: 'Alt+W',
    singleton: false,
    category: 'Market Data',
  },
  trending: {
    id: 'trending',
    displayName: 'Trending',
    icon: 'Globe',
    shortcut: '',
    singleton: true,
    category: 'Market Data',
  },
  indices: {
    id: 'indices',
    displayName: 'Indices',
    icon: 'Activity',
    shortcut: '',
    singleton: true,
    category: 'Market Data',
  },
  'etf-scanner': {
    id: 'etf-scanner',
    displayName: 'ETF Scanner',
    icon: 'Search',
    shortcut: '',
    singleton: true,
    category: 'Market Data',
  },
  'holdings-heatmap': {
    id: 'holdings-heatmap',
    displayName: 'Holdings Heatmap',
    icon: 'Grid',
    shortcut: '',
    singleton: true,
    category: 'Market Data',
  },

  // CHARTS & ANALYTICS
  chart: {
    id: 'chart',
    displayName: 'Chart',
    icon: 'LineChart',
    shortcut: 'F8',
    singleton: false,
    category: 'Charts & Analytics',
  },
  'oi-graph': {
    id: 'oi-graph',
    displayName: 'OI Graph',
    icon: 'BarChart2',
    shortcut: 'Alt+G',
    singleton: false,
    category: 'Charts & Analytics',
  },
  'vol-surface-3d': {
    id: 'vol-surface-3d',
    displayName: 'Volatility Surface (3D)',
    icon: 'Mountain',
    shortcut: 'Alt+V',
    singleton: false,
    category: 'Charts & Analytics',
  },
  technicals: {
    id: 'technicals',
    displayName: 'Technicals',
    icon: 'Cpu',
    shortcut: 'Alt+T',
    singleton: false,
    category: 'Charts & Analytics',
  },

  // OPTIONS
  'options-chain': {
    id: 'options-chain',
    displayName: 'Options Chain',
    icon: 'Link',
    shortcut: 'Alt+O',
    singleton: false,
    category: 'Options',
  },

  // ACCOUNT
  portfolio: {
    id: 'portfolio',
    displayName: 'Portfolio',
    icon: 'PieChart',
    shortcut: 'F12',
    singleton: true,
    category: 'Account',
  },
  positions: {
    id: 'positions',
    displayName: 'Positions',
    icon: 'Shield',
    shortcut: 'F4',
    singleton: true,
    category: 'Account',
  },
  orders: {
    id: 'orders',
    displayName: 'Orders',
    icon: 'Package',
    shortcut: 'F3',
    singleton: true,
    category: 'Account',
  },

  // TOOLS
  fundamentals: {
    id: 'fundamentals',
    displayName: 'Fundamentals',
    icon: 'BookOpen',
    shortcut: '',
    singleton: false,
    category: 'Tools',
  },
  'economic-calendar': {
    id: 'economic-calendar',
    displayName: 'Economic Calendar',
    icon: 'Calendar',
    shortcut: '',
    singleton: true,
    category: 'Tools',
  },

  // GAMES
  'world-bank-explorer': {
    id: 'world-bank-explorer',
    displayName: 'World Bank Macro',
    icon: 'Globe',
    shortcut: '',
    singleton: true,
    category: 'Tools',
  },
  snake: {
    id: 'snake',
    displayName: 'Snake',
    icon: 'Gamepad2',
    shortcut: '',
    singleton: false,
    category: 'Take a Break',
  },
  minesweeper: {
    id: 'minesweeper',
    displayName: 'Minesweeper',
    icon: 'Bomb',
    shortcut: '',
    singleton: false,
    category: 'Take a Break',
  },
  wordle: {
    id: 'wordle',
    displayName: 'Wordle (Finance)',
    icon: 'Type',
    shortcut: '',
    singleton: false,
    category: 'Take a Break',
  },

  // INSTITUTIONAL INTEL (Ecosystem Pack 2)
  'shipping-traffic': {
    id: 'shipping-traffic',
    displayName: 'Shipping Traffic',
    icon: 'Anchor',
    shortcut: '',
    singleton: true,
    category: 'Institutional Intel',
  },
  'air-traffic': {
    id: 'air-traffic',
    displayName: 'Air Traffic',
    icon: 'Radar',
    shortcut: '',
    singleton: true,
    category: 'Institutional Intel',
  },
  'fire-map': {
    id: 'fire-map',
    displayName: 'Thermal Fire Map',
    icon: 'Flame',
    shortcut: '',
    singleton: true,
    category: 'Institutional Intel',
  },

  // NEW ACCOUNT WIDGETS
  holdings: {
    id: 'holdings',
    displayName: 'Holdings',
    icon: 'Briefcase',
    shortcut: 'Alt+H',
    singleton: true,
    category: 'Account',
  }
};

