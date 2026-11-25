// world.js — the whole game state and every rule in it: the chef, the orders,
// the stations, the plate, the score. Rendering never lives here; this module
// only decides what is true, and the renderer draws it.

import {
  BURN_SECONDS, CARRY_MAX, CHOP_HITS, COMBO_WINDOW, GRILL_SECONDS,
  INGREDIENTS, KITCHEN, LEVEL_TUNING, RECIPES, SHIFT_SECONDS, STATIONS,
  TIP_PER_SECOND_LEFT, levelFor,
} from './config.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRecipe(random, level) {
  // Early on the board stays gentle: salads and simple burgers first.
  const pool = level === 1
    ? RECIPES.filter((r) => r.needs.length <= 3)
    : RECIPES;
  return pool[Math.floor(random() * pool.length)];
}

export function createWorld(seed) {
  const random = mulberry32(seed);
  return {
    seed,
    random,
    screen: 'title', // title | playing | over
    elapsed: 0,
    shiftLeft: SHIFT_SECONDS,
    score: 0,
    served: 0,
    missed: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    level: 1,
    orderTimer: 8, // first order arrives quickly
    nextOrderId: 1,
    orders: [],
    chef: { x: 640, y: 460, r: 22, face: 'down', moving: false, bob: 0 },
    carry: [], // ingredient ids in hand, at most CARRY_MAX
    plate: [], // prepared ingredient ids on the assembly plate
    chop: { item: null, hits: 0 }, // one item on the chopping board
    grill: [], // { item, t } slots on the grill, at most 2
    grillSlots: 2,
    flash: null, // { text, color, t } floating feedback
    servedFlash: null,
    muted: false,
    // per-frame interaction hints, recomputed by update()
    nearest: null,
    hint: '',
  };
}

export function startShift(world) {
  world.screen = 'playing';
  world.elapsed = 0;
  world.shiftLeft = SHIFT_SECONDS;
  world.score = 0;
  world.served = 0;
  world.missed = 0;
  world.combo = 0;
  world.comboTimer = 0;
  world.bestCombo = 0;
  world.level = 1;
  world.orderTimer = 8;
  world.orders = [];
  world.carry = [];
  world.plate = [];
  world.chop = { item: null, hits: 0 };
  world.grill = [];
  world.flash = null;
  world.servedFlash = null;
  world.chef.x = 640;
  world.chef.y = 460;
}

function stationAt(world, x, y) {
  for (const s of STATIONS) {
    if (x >= s.x - 14 && x <= s.x + s.w + 14 && y >= s.y - 14 && y <= s.y + s.h + 14) return s;
  }
  return null;
}

export function nearestStation(world) {
  const { x, y } = world.chef;
  let best = null;
  let bestDist = 78;
  for (const s of STATIONS) {
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    const d = Math.hypot(x - cx, y - cy);
    if (d < bestDist) { bestDist = d; best = s; }
  }
  return best;
}

function setFlash(world, text, color) {
  world.flash = { text, color, t: 1.4 };
}

function spawnOrder(world) {
  const tuning = LEVEL_TUNING[world.level];
  if (world.orders.length >= tuning.maxOrders) return;
  const recipe = pickRecipe(world.random, world.level);
  world.orders.push({
    id: world.nextOrderId,
    recipe,
    timeLeft: tuning.orderTime,
    total: tuning.orderTime,
    born: world.elapsed,
  });
  world.nextOrderId += 1;
}

function plateMatchesOrder(plate, recipe) {
  const have = plate.map((e) => e.id).sort().join(',');
  const want = [...recipe.needs].sort().join(',');
  return have === want;
}

function matchingOrder(world) {
  return world.orders.find((o) => plateMatchesOrder(world.plate, o.recipe));
}

export function servePlate(world) {
  const order = matchingOrder(world);
  if (!order) {
    setFlash(world, 'No order wants this plate!', '#d64545');
    return false;
  }
  const timeBonus = Math.round(order.timeLeft * TIP_PER_SECOND_LEFT);
  const comboBonus = world.combo * 2;
  const earned = order.recipe.price + timeBonus + comboBonus;
  world.score += earned;
  world.served += 1;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.comboTimer = COMBO_WINDOW;
  world.orders = world.orders.filter((o) => o.id !== order.id);
  world.plate = [];
  world.servedFlash = {
    text: `+${earned}  ${order.recipe.name} served!${world.combo > 1 ? `  Combo x${world.combo}` : ''}`,
    color: '#3d9b4f',
    t: 1.8,
  };
  return true;
}

// One interaction at a station: pick up, chop, grill, assemble, serve, bin.
export function interact(world) {
  const station = world.nearest;
  if (!station) return 'none';
  const carry = world.carry;

  if (station.kind === 'supply') {
    if (carry.length >= CARRY_MAX) {
      setFlash(world, 'Hands full! Serve or bin something.', '#d64545');
      return 'full';
    }
    // Bun and cheese need no prep: they are ready the moment you pick them up.
    carry.push({ id: station.item, ready: !INGREDIENTS[station.item].needs });
    return 'pickup';
  }

  if (station.kind === 'chop') {
    if (world.chop.item) {
      world.chop.hits += 1;
      if (world.chop.hits >= CHOP_HITS) {
        const done = world.chop.item;
        world.chop = { item: null, hits: 0 };
        if (carry.length >= CARRY_MAX) {
          setFlash(world, 'Hands full — chopped item dropped!', '#d64545');
          return 'chop-done';
        }
        carry.push({ id: done, ready: true });
        return 'chop-done';
      }
      return 'chop';
    }
    const idx = carry.findIndex((e) => !e.ready && INGREDIENTS[e.id].needs === 'chop');
    if (idx === -1) {
      setFlash(world, 'Bring something to chop: tomato, lettuce or onion.', '#d64545');
      return 'noop';
    }
    world.chop = { item: carry.splice(idx, 1)[0].id, hits: 0 };
    return 'chop-start';
  }

  if (station.kind === 'grill') {
    const cooked = world.grill.find((g) => g.t >= GRILL_SECONDS);
    const grillableIdx = carry.findIndex((e) => !e.ready && INGREDIENTS[e.id].needs === 'grill');
    const hasRoom = world.grill.length < world.grillSlots;
    // A cooked item comes off first when there is nothing new to put on.
    if (cooked && (grillableIdx === -1 || !hasRoom)) {
      if (carry.length >= CARRY_MAX) {
        setFlash(world, 'Hands full!', '#d64545');
        return 'full';
      }
      world.grill = world.grill.filter((g) => g !== cooked);
      carry.push({ id: cooked.item, ready: true });
      return 'grill-take';
    }
    if (hasRoom && grillableIdx !== -1) {
      world.grill.push({ item: carry.splice(grillableIdx, 1)[0].id, t: 0 });
      return 'grill-start';
    }
    if (!hasRoom) {
      setFlash(world, 'Grill is full — wait for it to cook.', '#d64545');
      return 'noop';
    }
    setFlash(world, 'Bring something to grill: patty, bacon or egg.', '#d64545');
    return 'noop';
  }

  if (station.kind === 'plate') {
    if (carry.length === 0) {
      setFlash(world, 'Nothing to plate — pick up an ingredient.', '#d64545');
      return 'noop';
    }
    // Only prepared food goes on a plate: raw items that still need a station
    // are refused, so a plate can never hold an unservable dish.
    const ready = carry.findIndex((e) => e.ready);
    if (ready === -1) {
      setFlash(world, 'That still needs the chop board or grill first!', '#d64545');
      return 'noop';
    }
    world.plate.push(carry.splice(ready, 1)[0]);
    return 'plate';
  }

  if (station.kind === 'serve') {
    if (world.plate.length === 0) {
      setFlash(world, 'The plate is empty — assemble a dish first!', '#d64545');
      return 'noop';
    }
    return servePlate(world) ? 'serve' : 'serve-fail';
  }

  if (station.kind === 'bin') {
    if (carry.length === 0 && world.plate.length === 0) {
      setFlash(world, 'Nothing to throw away.', '#d64545');
      return 'noop';
    }
    carry.length = 0;
    world.plate = [];
    setFlash(world, 'Cleared!', '#6b5d4f');
    return 'bin';
  }
  return 'none';
}

function collideChef(world) {
  const c = world.chef;
  const k = KITCHEN;
  c.x = Math.max(k.floorLeft + c.r, Math.min(k.floorRight - c.r, c.x));
  c.y = Math.max(k.floorTop + c.r, Math.min(k.floorBottom - c.r, c.y));
  // Counters are solid: push the chef out of any station rectangle.
  for (const s of STATIONS) {
    const nx = Math.max(s.x, Math.min(c.x, s.x + s.w));
    const ny = Math.max(s.y, Math.min(c.y, s.y + s.h));
    const dx = c.x - nx;
    const dy = c.y - ny;
    const d2 = dx * dx + dy * dy;
    if (d2 < c.r * c.r) {
      const d = Math.sqrt(d2) || 0.001;
      c.x = nx + (dx / d) * c.r;
      c.y = ny + (dy / d) * c.r;
    }
  }
}

export function updateWorld(world, dt, input) {
  if (world.screen !== 'playing') return;
  world.elapsed += dt;
  world.shiftLeft = Math.max(0, SHIFT_SECONDS - world.elapsed);
  world.level = levelFor(world.elapsed);

  if (world.flash) {
    world.flash.t -= dt;
    if (world.flash.t <= 0) world.flash = null;
  }
  if (world.servedFlash) {
    world.servedFlash.t -= dt;
    if (world.servedFlash.t <= 0) world.servedFlash = null;
  }
  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }

  // Orders arrive on a schedule that quickens with the level.
  world.orderTimer -= dt;
  if (world.orderTimer <= 0) {
    spawnOrder(world);
    world.orderTimer = LEVEL_TUNING[world.level].orderEvery;
  }
  for (const order of world.orders) order.timeLeft -= dt;
  const expired = world.orders.filter((o) => o.timeLeft <= 0);
  if (expired.length > 0) {
    world.orders = world.orders.filter((o) => o.timeLeft > 0);
    world.missed += expired.length;
    world.combo = 0;
    setFlash(world, expired.length > 1 ? `${expired.length} orders walked out!` : 'An order walked out!', '#d64545');
  }

  // The grill cooks in real time.
  for (const slot of world.grill) slot.t += dt;

  // Move the chef.
  const move = input.moveVector();
  const speed = 265;
  world.chef.moving = move.x !== 0 || move.y !== 0;
  if (world.chef.moving) {
    world.chef.x += move.x * speed * dt;
    world.chef.y += move.y * speed * dt;
    world.chef.bob += dt * 11;
    world.chef.face = Math.abs(move.x) > Math.abs(move.y)
      ? (move.x > 0 ? 'right' : 'left')
      : (move.y > 0 ? 'down' : 'up');
  }
  collideChef(world);

  world.nearest = nearestStation(world);
  world.hint = hintFor(world);

  // Mouse: clicking a station walks the intent there — the click acts on the
  // station nearest the chef, so a click is a shortcut for the E key.
  if (input.mouseClicked()) {
    const clicked = stationAt(world, input.mousePosition().x, input.mousePosition().y);
    if (clicked && world.nearest === clicked) {
      return interact(world);
    }
    if (clicked) {
      // Clicking a far station just nudges the hint; the chef must walk over.
      setFlash(world, `Walk to the ${clicked.label} counter first!`, '#6b5d4f');
      return 'far';
    }
  }
  if (input.justPressed('act')) return interact(world);
  return 'none';
}

function hintFor(world) {
  const s = world.nearest;
  if (!s) return 'WASD / arrows to move — E or click to use a counter';
  switch (s.kind) {
    case 'supply': return `E: pick up ${INGREDIENTS[s.item].name}`;
    case 'chop': return world.chop.item
      ? `E: chop! (${world.chop.hits}/${CHOP_HITS})`
      : 'E: place something to chop';
    case 'grill': {
      const cooked = world.grill.find((g) => g.t >= GRILL_SECONDS);
      if (world.grill.length >= world.grillSlots) {
        return cooked ? 'E: take the cooked item off' : 'Grill is full — let it cook';
      }
      return 'E: put something on the grill';
    }
    case 'plate': return 'E: add a prepared item to the plate';
    case 'serve': return matchingOrder(world) ? 'E: SERVE! This plate matches an order' : 'E: serve (plate must match an order)';
    case 'bin': return 'E: throw away hands + plate';
    default: return '';
  }
}

export function endShift(world) {
  world.screen = 'over';
}
