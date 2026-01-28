/**
 * gemcron theme - muted orange with bright orange highlights
 */

export const theme = {
  // Primary colors - orange gradient
  primary: {
    bright: '#FF8C00',      // Bright orange - highlights, active items
    base: '#E07700',        // Base orange
    muted: '#B86000',       // Muted orange
    dim: '#8B4500',         // Dim orange - less emphasis
  },

  // Accent - for selection indicators
  accent: '#FF6B00',        // Vivid orange for selection bar

  // Text colors
  text: {
    primary: '#FFA54F',     // Primary text - warm orange tint
    secondary: '#CC8040',   // Secondary text
    muted: '#996633',       // Muted text
    dim: '#664422',         // Very dim text (help hints descriptions)
    dimmer: '#553311',      // Even dimmer
  },

  // UI elements
  ui: {
    border: '#664422',      // Borders
    separator: '#553311',   // Separators like │
    badge: '#8B4500',       // Badge backgrounds
    badgeText: '#FFD4A0',   // Badge text
  },

  // Status colors (with orange tint)
  status: {
    active: '#66BB66',      // Green for active
    paused: '#666666',      // Gray for paused
    success: '#66BB66',     // Success
    error: '#CC6666',       // Error
    warning: '#FFAA33',     // Warning - orange-ish
  },

  // Semantic
  key: '#CC8040',           // Keyboard shortcut keys
  keyText: '#664422',       // Text after keys

  // Header gradient (yellow to orange)
  gradient: [
    '#FFD700',  // ⚡
    '#FFCC00',  // g
    '#FFC200',  // e
    '#FFB800',  // m
    '#FFAE00',  // c
    '#FFA400',  // r
    '#FF9A00',  // o
    '#FF8C00',  // n
  ],
} as const;

export type Theme = typeof theme;
