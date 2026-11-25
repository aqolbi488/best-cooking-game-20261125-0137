// main.js — the game loop and the screen machine: title, playing, game over.
// It owns the canvas, the clock and the input; the world owns the rules and
// the renderer owns the pixels.

import { SHIFT_SECONDS, VIEW } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { buildShot } from './shots.js';
import { createWorld, endShift, startShift, updateWorld } from './world.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');

const audio = createAudio();
const input = createInput(canvas);

let world;
let frozen = false;
if (shotName) {
  world = buildShot(shotName, seed);
  frozen = true;
} else {
  world = createWorld(seed);
}

// Debug handle for automated play-testing only: the game itself never reads it.
window.__sizzle = { get world() { return world; }, get frozen() { return frozen; } };

let last = performance.now();
let t = 0;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  t += dt;

  if (!frozen) {
    if (world.screen === 'title') {
      if (input.justPressed('act') || input.mouseClicked()) {
        audio.unlock();
        audio.play('start');
        startShift(world);
      }
    } else if (world.screen === 'playing') {
      const ordersBefore = world.orders.length;
      const result = updateWorld(world, dt, input);
      if (result && result !== 'none' && result !== 'far') audio.play(result);
      if (world.orders.length > ordersBefore) audio.play('order');
      if (world.missed > 0 && world.flash && world.flash.text.includes('walked out')) {
        // one sad note per missed order is enough; the flash text says it
      }
      if (input.justPressed('mute')) {
        world.muted = !world.muted;
        audio.setMuted(world.muted);
      }
      if (world.shiftLeft <= 0 || world.elapsed >= SHIFT_SECONDS) endShift(world);
    } else if (world.screen === 'over') {
      if (input.justPressed('restart') || input.justPressed('act')) {
        world = createWorld(seed);
        startShift(world);
      }
    }
    input.endFrame();
  }

  render(ctx, world, t);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
