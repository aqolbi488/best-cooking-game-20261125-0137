// config.js — every constant that shapes Sizzle & Serve: the kitchen layout,
// the ingredients, the recipes, the timers and the difficulty curve.
// Nothing here moves, draws or listens; it only describes the game.

export const VIEW = { width: 1280, height: 800 };

export const SHIFT_SECONDS = 180; // one full shift
export const CARRY_MAX = 2; // hands: two slots, no more

// Kitchen floor plan. Counters and stations sit on a tile grid; the chef walks
// the open floor between them. Coordinates are in pixels on the canvas.
export const KITCHEN = {
  floorTop: 150,
  floorBottom: 760,
  floorLeft: 24,
  floorRight: 1256,
  // order board strip across the top
  board: { x: 24, y: 12, w: 1232, h: 122 },
};

export const COLORS = {
  floor: '#e8cfa8',
  floorLine: '#d9b98a',
  wall: '#7c4a2d',
  wallTrim: '#a9713f',
  counterTop: '#f4ead6',
  counterSide: '#b98a5a',
  board: '#2e2a26',
  boardChalk: '#fdf6e3',
  accent: '#e4572e',
  accentSoft: '#f2a541',
  good: '#3d9b4f',
  bad: '#d64545',
  text: '#2e2a26',
  textSoft: '#6b5d4f',
};

// One ingredient: id, display name, colour, what it looks like on a plate,
// and whether it needs a station before it can be served.
export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8b25c', dark: '#c98f3d', shape: 'bun', needs: null },
  patty: { name: 'Patty', color: '#8a5a3b', dark: '#5f3a24', shape: 'patty', needs: 'grill' },
  cheese: { name: 'Cheese', color: '#f6c945', dark: '#d9a41f', shape: 'cheese', needs: null },
  tomato: { name: 'Tomato', color: '#e4572e', dark: '#b3351c', shape: 'tomato', needs: 'chop' },
  lettuce: { name: 'Lettuce', color: '#5fb84e', dark: '#3d8a33', shape: 'lettuce', needs: 'chop' },
  onion: { name: 'Onion', color: '#efe6f2', dark: '#b9a3c4', shape: 'onion', needs: 'chop' },
  bacon: { name: 'Bacon', color: '#c65b4e', dark: '#8f332a', shape: 'bacon', needs: 'grill' },
  egg: { name: 'Egg', color: '#fdf3d0', dark: '#e8c96a', shape: 'egg', needs: 'grill' },
};

// A recipe is a dish: the exact set of prepared ingredients on one plate.
export const RECIPES = [
  {
    id: 'garden-salad',
    name: 'Garden Salad',
    price: 8,
    needs: ['lettuce', 'tomato'],
    blurb: 'Crisp, bright, gone in a bite.',
  },
  {
    id: 'classic-burger',
    name: 'Classic Burger',
    price: 12,
    needs: ['bun', 'patty', 'lettuce'],
    blurb: 'The one everyone orders.',
  },
  {
    id: 'cheese-burger',
    name: 'Cheese Burger',
    price: 14,
    needs: ['bun', 'patty', 'cheese'],
    blurb: 'Melty, messy, magnificent.',
  },
  {
    id: 'bacon-egg-bun',
    name: 'Bacon & Egg Bun',
    price: 15,
    needs: ['bun', 'bacon', 'egg'],
    blurb: 'Breakfast, any hour of the day.',
  },
  {
    id: 'onion-melt',
    name: 'Onion Melt',
    price: 13,
    needs: ['bun', 'patty', 'cheese', 'onion'],
    blurb: 'Sweet onion, sharp cheese.',
  },
  {
    id: 'double-stack',
    name: 'Double Stack',
    price: 18,
    needs: ['bun', 'patty', 'patty', 'cheese', 'tomato'],
    blurb: 'Two patties. No regrets.',
  },
];

// Counters the chef walks up to. kind: 'supply' (infinite ingredient),
// 'chop', 'grill', 'plate' (assembly), 'serve' (the pass window), 'bin'.
export const STATIONS = [
  // top row: supplies, under the order board
  { id: 'sup-bun', kind: 'supply', item: 'bun', x: 60, y: 168, w: 96, h: 64, label: 'BUNS' },
  { id: 'sup-patty', kind: 'supply', item: 'patty', x: 176, y: 168, w: 96, h: 64, label: 'PATTIES' },
  { id: 'sup-cheese', kind: 'supply', item: 'cheese', x: 292, y: 168, w: 96, h: 64, label: 'CHEESE' },
  { id: 'sup-tomato', kind: 'supply', item: 'tomato', x: 408, y: 168, w: 96, h: 64, label: 'TOMATO' },
  { id: 'sup-lettuce', kind: 'supply', item: 'lettuce', x: 524, y: 168, w: 96, h: 64, label: 'LETTUCE' },
  { id: 'sup-onion', kind: 'supply', item: 'onion', x: 640, y: 168, w: 96, h: 64, label: 'ONION' },
  { id: 'sup-bacon', kind: 'supply', item: 'bacon', x: 756, y: 168, w: 96, h: 64, label: 'BACON' },
  { id: 'sup-egg', kind: 'supply', item: 'egg', x: 872, y: 168, w: 96, h: 64, label: 'EGGS' },
  // middle: the working stations
  { id: 'chop', kind: 'chop', x: 1000, y: 168, w: 120, h: 64, label: 'CHOP' },
  { id: 'grill', kind: 'grill', x: 1140, y: 168, w: 116, h: 64, label: 'GRILL' },
  // bottom row: assembly, pass, bin
  { id: 'plate', kind: 'plate', x: 60, y: 668, w: 200, h: 64, label: 'ASSEMBLY' },
  { id: 'serve', kind: 'serve', x: 1080, y: 668, w: 176, h: 64, label: 'SERVE' },
  { id: 'bin', kind: 'bin', x: 570, y: 668, w: 140, h: 64, label: 'BIN' },
];

// Difficulty: orders arrive faster and allow less time as the shift goes on.
export function levelFor(elapsedSeconds) {
  if (elapsedSeconds < 45) return 1;
  if (elapsedSeconds < 95) return 2;
  if (elapsedSeconds < 140) return 3;
  return 4;
}

export const LEVEL_TUNING = {
  1: { orderEvery: 16, orderTime: 55, maxOrders: 3 },
  2: { orderEvery: 13, orderTime: 50, maxOrders: 4 },
  3: { orderEvery: 11, orderTime: 45, maxOrders: 4 },
  4: { orderEvery: 9, orderTime: 40, maxOrders: 5 },
};

export const CHOP_HITS = 3; // presses to chop one item
export const GRILL_SECONDS = 6; // seconds on the grill to cook
export const BURN_SECONDS = 12; // seconds on the grill before it burns
export const COMBO_WINDOW = 8; // seconds between serves to keep a combo
export const TIP_PER_SECOND_LEFT = 0.25; // bonus per second left on the order
