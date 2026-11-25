// render.js — everything the player sees, drawn on one canvas: the kitchen,
// the order board, the stations, the chef and the food. It reads the world
// and never changes it.

import {
  BURN_SECONDS, CHOP_HITS, COLORS, GRILL_SECONDS, INGREDIENTS, KITCHEN,
  RECIPES, SHIFT_SECONDS, STATIONS,
} from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

// Draw one ingredient as a little piece of food, centred at (x, y), size s.
export function drawIngredient(ctx, id, x, y, s) {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(x, y);
  const r = s / 2;
  switch (ing.shape) {
    case 'bun':
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.ellipse(0, -r * 0.15, r, r * 0.62, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = ing.dark;
      ctx.fillRect(-r, -r * 0.18, r * 2, r * 0.22);
      ctx.fillStyle = '#fdf3d0';
      ctx.beginPath(); ctx.ellipse(0, r * 0.12, r * 0.92, r * 0.3, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#fff';
      for (const [sx, sy] of [[-0.4, -0.45], [0.1, -0.6], [0.45, -0.4]]) {
        ctx.beginPath(); ctx.ellipse(sx * r, sy * r, r * 0.09, r * 0.06, 0, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case 'patty':
      ctx.fillStyle = ing.color;
      roundRect(ctx, -r, -r * 0.42, r * 2, r * 0.84, r * 0.3);
      ctx.fill();
      ctx.fillStyle = ing.dark;
      for (const [sx, sy] of [[-0.45, -0.1], [0.1, 0.15], [0.5, -0.15]]) {
        ctx.beginPath(); ctx.arc(sx * r, sy * r, r * 0.08, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case 'cheese':
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.moveTo(-r, r * 0.5); ctx.lineTo(0, -r * 0.6); ctx.lineTo(r, r * 0.5); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = ing.dark;
      ctx.beginPath(); ctx.arc(-r * 0.15, r * 0.05, r * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.3, r * 0.28, r * 0.08, 0, Math.PI * 2); ctx.fill();
      break;
    case 'tomato':
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ing.dark;
      ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5fb84e';
      ctx.beginPath(); ctx.ellipse(0, -r * 0.82, r * 0.3, r * 0.14, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case 'lettuce':
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.ellipse(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.5, r * 0.34, a, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.strokeStyle = ing.dark;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2); ctx.stroke();
      break;
    case 'onion':
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = ing.dark;
      ctx.lineWidth = 2;
      for (const rr of [0.6, 0.38]) { ctx.beginPath(); ctx.arc(0, 0, r * rr, 0, Math.PI * 2); ctx.stroke(); }
      break;
    case 'bacon':
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.moveTo(-r, -r * 0.3);
      ctx.bezierCurveTo(-r * 0.4, -r * 0.8, r * 0.3, -r * 0.8, r, -r * 0.3);
      ctx.bezierCurveTo(r * 0.5, r * 0.1, -r * 0.4, r * 0.1, -r, -r * 0.3);
      ctx.fill();
      ctx.fillStyle = '#f2d5a0';
      ctx.fillRect(-r * 0.7, -r * 0.28, r * 1.4, r * 0.16);
      break;
    case 'egg':
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.8, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f6c945';
      ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.42, 0, Math.PI * 2); ctx.fill();
      break;
    default:
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawPlate(ctx, items, x, y, s) {
  ctx.fillStyle = '#f8f4ec';
  ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.32, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9bda6';
  ctx.lineWidth = 2;
  ctx.stroke();
  items.forEach((entry, i) => {
    drawIngredient(ctx, entry.id, x + (i - (items.length - 1) / 2) * s * 0.55, y - s * 0.18, s * 0.72);
  });
}

function drawStation(ctx, station, world, t) {
  const { x, y, w, h } = station;
  const active = world.nearest === station;
  // counter body
  ctx.fillStyle = COLORS.counterSide;
  roundRect(ctx, x, y + 8, w, h, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  roundRect(ctx, x, y, w, h - 4, 8);
  ctx.fill();
  if (active) {
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 4;
    roundRect(ctx, x - 3, y - 3, w + 6, h + 2, 10);
    ctx.stroke();
  }
  text(ctx, station.label, x + w / 2, y + h - 10, 13, COLORS.textSoft, 'center');

  const cx = x + w / 2;
  const cy = y + h / 2 - 8;
  if (station.kind === 'supply') {
    drawIngredient(ctx, station.item, cx, cy, 34);
  } else if (station.kind === 'chop') {
    // chopping board + knife
    ctx.fillStyle = '#d9b98a';
    roundRect(ctx, cx - 34, cy - 16, 68, 32, 6);
    ctx.fill();
    if (world.chop.item) {
      drawIngredient(ctx, world.chop.item, cx, cy, 26);
      const p = world.chop.hits / CHOP_HITS;
      ctx.fillStyle = '#ddd';
      roundRect(ctx, cx - 26, cy - 26, 52, 6, 3);
      ctx.fill();
      ctx.fillStyle = COLORS.good;
      roundRect(ctx, cx - 26, cy - 26, 52 * p, 6, 3);
      ctx.fill();
    } else {
      ctx.fillStyle = '#8a8f96';
      ctx.save();
      ctx.translate(cx + 18, cy - 6);
      ctx.rotate(-0.5);
      ctx.fillRect(-14, -3, 28, 6);
      ctx.restore();
    }
  } else if (station.kind === 'grill') {
    ctx.fillStyle = '#3a3a3a';
    roundRect(ctx, cx - 44, cy - 18, 88, 36, 6);
    ctx.fill();
    ctx.strokeStyle = '#6b6b6b';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * 16, cy - 16); ctx.lineTo(cx + i * 16, cy + 16); ctx.stroke();
    }
    world.grill.forEach((slot, i) => {
      const gx = cx - 22 + i * 44;
      const cooked = slot.t / GRILL_SECONDS;
      if (slot.t >= BURN_SECONDS) {
        drawIngredient(ctx, slot.item, gx, cy, 26);
        text(ctx, 'BURNT!', gx, cy - 22, 11, COLORS.bad, 'center');
      } else {
        drawIngredient(ctx, slot.item, gx, cy, 26);
        const p = Math.min(1, cooked);
        ctx.fillStyle = '#ddd';
        roundRect(ctx, gx - 16, cy - 26, 32, 5, 2);
        ctx.fill();
        ctx.fillStyle = p >= 1 ? COLORS.good : COLORS.accentSoft;
        roundRect(ctx, gx - 16, cy - 26, 32 * p, 5, 2);
        ctx.fill();
      }
    });
    if (world.grill.length === 0) {
      // little flames under an empty grill, just for warmth
      ctx.fillStyle = '#f2a541';
      for (let i = 0; i < 3; i++) {
        const fx = cx - 24 + i * 24;
        const fl = 8 + Math.sin(t * 6 + i * 2) * 3;
        ctx.beginPath();
        ctx.moveTo(fx - 5, cy + 12); ctx.quadraticCurveTo(fx, cy + 12 - fl, fx + 5, cy + 12);
        ctx.closePath(); ctx.fill();
      }
    }
  } else if (station.kind === 'plate') {
    drawPlate(ctx, world.plate, cx, cy + 4, 30);
  } else if (station.kind === 'serve') {
    // the pass window: a bell and a warm glow
    ctx.fillStyle = '#f2a541';
    roundRect(ctx, cx - 52, cy - 20, 104, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#e8b25c';
    ctx.beginPath(); ctx.arc(cx, cy - 2, 12, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx - 2, cy - 16, 4, 6);
  } else if (station.kind === 'bin') {
    ctx.fillStyle = '#5a6b7a';
    roundRect(ctx, cx - 22, cy - 14, 44, 28, 5);
    ctx.fill();
    ctx.fillStyle = '#3d4a56';
    ctx.fillRect(cx - 26, cy - 18, 52, 8);
  }
}

function drawChef(ctx, world, t) {
  const c = world.chef;
  const bob = c.moving ? Math.sin(c.bob) * 2 : Math.sin(t * 2) * 1;
  const x = c.x;
  const y = c.y + bob;
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(c.x, c.y + 20, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  // body: apron
  ctx.fillStyle = '#fdf6e3';
  roundRect(ctx, x - 15, y - 6, 30, 30, 10);
  ctx.fill();
  ctx.fillStyle = '#e4572e';
  ctx.fillRect(x - 15, y + 8, 30, 5);
  // head
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(x, y - 16, 13, 0, Math.PI * 2); ctx.fill();
  // chef hat
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x - 8, y - 26, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 8, y - 26, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - 30, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - 12, y - 28, 24, 6);
  // eyes face the walking direction
  const look = c.face === 'left' ? -4 : c.face === 'right' ? 4 : 0;
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath(); ctx.arc(x - 5 + look, y - 16, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 5 + look, y - 16, 1.8, 0, Math.PI * 2); ctx.fill();
  // carried ingredients float above the hands
  world.carry.forEach((entry, i) => {
    drawIngredient(ctx, entry.id, x + (i === 0 ? -20 : 20), y - 2, 22);
  });
}

function drawOrderBoard(ctx, world) {
  const b = KITCHEN.board;
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.strokeStyle = COLORS.wallTrim;
  ctx.lineWidth = 3;
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.stroke();
  text(ctx, 'ORDER BOARD', b.x + 16, b.y + 26, 15, COLORS.boardChalk, 'left', '800');
  text(ctx, `SCORE ${world.score}`, b.x + b.w - 16, b.y + 26, 15, COLORS.accentSoft, 'right', '800');
  if (world.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch rush is coming…', b.x + 16, b.y + 70, 17, '#b9ab98');
  }
  world.orders.forEach((order, i) => {
    const ox = b.x + 16 + i * 300;
    const oy = b.y + 38;
    const ow = 284;
    const oh = 74;
    const urgent = order.timeLeft < 12;
    ctx.fillStyle = urgent && Math.floor(order.timeLeft * 2) % 2 === 0 ? '#4a2a26' : '#3d3833';
    roundRect(ctx, ox, oy, ow, oh, 8);
    ctx.fill();
    text(ctx, order.recipe.name, ox + 12, oy + 22, 16, COLORS.boardChalk);
    text(ctx, `$${order.recipe.price}`, ox + ow - 12, oy + 22, 16, COLORS.accentSoft, 'right');
    order.recipe.needs.forEach((id, j) => {
      drawIngredient(ctx, id, ox + 24 + j * 34, oy + 46, 26);
    });
    const p = Math.max(0, order.timeLeft / order.total);
    ctx.fillStyle = '#555';
    roundRect(ctx, ox + 12, oy + oh - 12, ow - 24, 6, 3);
    ctx.fill();
    ctx.fillStyle = urgent ? COLORS.bad : p > 0.5 ? COLORS.good : COLORS.accentSoft;
    roundRect(ctx, ox + 12, oy + oh - 12, (ow - 24) * p, 6, 3);
    ctx.fill();
    text(ctx, `${Math.ceil(order.timeLeft)}s`, ox + ow - 12, oy + oh - 20, 12, urgent ? COLORS.bad : '#b9ab98', 'right');
  });
}

function drawHud(ctx, world) {
  const y = 762;
  const mins = Math.floor(world.shiftLeft / 60);
  const secs = Math.floor(world.shiftLeft % 60);
  const shift = `${mins}:${String(secs).padStart(2, '0')}`;
  const urgent = world.shiftLeft < 30;
  text(ctx, `SHIFT ${shift}`, 24, y, 18, urgent ? COLORS.bad : COLORS.text, 'left', '800');
  text(ctx, `LEVEL ${world.level}`, 170, y, 18, COLORS.text, 'left', '800');
  text(ctx, `SERVED ${world.served}   MISSED ${world.missed}`, 300, y, 18, COLORS.text, 'left', '800');
  if (world.combo > 1) {
    text(ctx, `COMBO x${world.combo}`, 610, y, 20, COLORS.accent, 'left', '800');
  }
  text(ctx, world.hint, 1280 - 24, y, 15, COLORS.textSoft, 'right');
}

function drawKitchen(ctx, world, t) {
  // floor tiles
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, 1280, 800);
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  for (let x = 24; x < 1280; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 150); ctx.lineTo(x, 800); ctx.stroke();
  }
  for (let y = 150; y < 800; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1280, y); ctx.stroke();
  }
  // wall strip at the very bottom, below the HUD line
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 772, 1280, 28);
  ctx.fillStyle = COLORS.wallTrim;
  ctx.fillRect(0, 772, 1280, 5);

  // a rug and a potted plant, so the middle of the kitchen is not bare floor
  ctx.fillStyle = '#c65b4e';
  ctx.beginPath(); ctx.ellipse(640, 480, 150, 46, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8cfa8';
  ctx.beginPath(); ctx.ellipse(640, 480, 128, 34, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c65b4e';
  ctx.beginPath(); ctx.ellipse(640, 480, 106, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b98a5a';
  ctx.fillRect(1216, 300, 28, 34);
  ctx.fillStyle = '#5fb84e';
  ctx.beginPath(); ctx.arc(1230, 292, 18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(1216, 300, 12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(1244, 300, 12, 0, Math.PI * 2); ctx.fill();

  drawOrderBoard(ctx, world);
  for (const station of STATIONS) drawStation(ctx, station, world, t);
  drawChef(ctx, world, t);
  drawHud(ctx, world);

  if (world.servedFlash) {
    ctx.globalAlpha = Math.min(1, world.servedFlash.t);
    text(ctx, world.servedFlash.text, 640, 300, 34, world.servedFlash.color, 'center', '800');
    ctx.globalAlpha = 1;
  }
  if (world.flash) {
    ctx.globalAlpha = Math.min(1, world.flash.t);
    text(ctx, world.flash.text, 640, 340, 22, world.flash.color, 'center', '800');
    ctx.globalAlpha = 1;
  }
}

function drawTitle(ctx, world, t) {
  drawKitchen(ctx, world, t);
  ctx.fillStyle = 'rgba(30, 20, 12, 0.72)';
  ctx.fillRect(0, 0, 1280, 800);
  text(ctx, 'SIZZLE & SERVE', 640, 240, 72, '#fdf6e3', 'center', '800');
  text(ctx, 'a tiny kitchen rush', 640, 285, 26, COLORS.accentSoft, 'center');
  text(ctx, 'Orders land on the board. Fetch ingredients, chop and grill them,', 640, 380, 22, '#fdf6e3', 'center');
  text(ctx, 'build the dish on the assembly plate and ring the bell to serve.', 640, 412, 22, '#fdf6e3', 'center');
  text(ctx, 'WASD / arrows to move  •  E or click to use a counter  •  M to mute', 640, 470, 20, '#b9ab98', 'center');
  const pulse = 0.65 + Math.sin(t * 4) * 0.35;
  ctx.globalAlpha = pulse;
  text(ctx, 'Press ENTER or click to start the shift', 640, 540, 26, '#fff', 'center', '800');
  ctx.globalAlpha = 1;
  text(ctx, 'Recipes: Garden Salad • Classic Burger • Cheese Burger • Bacon & Egg Bun • Onion Melt • Double Stack', 640, 620, 16, '#b9ab98', 'center');
}

function drawGameOver(ctx, world) {
  drawKitchen(ctx, world, 0);
  ctx.fillStyle = 'rgba(30, 20, 12, 0.78)';
  ctx.fillRect(0, 0, 1280, 800);
  text(ctx, 'SHIFT OVER!', 640, 220, 64, '#fdf6e3', 'center', '800');
  text(ctx, `You served ${world.served} dishes and earned $${world.score}`, 640, 290, 28, COLORS.accentSoft, 'center');
  text(ctx, `Best combo x${world.bestCombo}   •   ${world.missed} order${world.missed === 1 ? '' : 's'} walked out`, 640, 335, 22, '#fdf6e3', 'center');
  const verdict = world.score >= 150 ? 'Head chef material. The kitchen is yours.'
    : world.score >= 80 ? 'A solid shift — the regulars will be back.'
    : 'A quiet shift. Tomorrow, sharper knives.';
  text(ctx, verdict, 640, 390, 22, '#b9ab98', 'center');
  text(ctx, 'Press R to cook another shift', 640, 470, 26, '#fff', 'center', '800');
}

export function render(ctx, world, t) {
  ctx.clearRect(0, 0, 1280, 800);
  if (world.screen === 'title') drawTitle(ctx, world, t);
  else if (world.screen === 'over') drawGameOver(ctx, world);
  else drawKitchen(ctx, world, t);
}

// The recipe list, for the title screen and the README. Kept in render so the
// game never imports a DOM helper for it.
export function recipeList() {
  return RECIPES.map((r) => `${r.name} — ${r.needs.map((id) => INGREDIENTS[id].name).join(' + ')} ($${r.price})`);
}
