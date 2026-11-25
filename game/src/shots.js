// shots.js — deterministic staged states for screenshots. The game reads
// ?shot=<name>&seed=<n>: each shot builds the same world every time, frozen
// in place, so the screenshots are reproducible renders of the real game.

import { RECIPES } from './config.js';
import { createWorld, startShift } from './world.js';

function findRecipe(id) {
  return RECIPES.find((r) => r.id === id);
}

function fakeOrder(world, recipeId, timeLeft, total) {
  const recipe = findRecipe(recipeId);
  world.orders.push({
    id: world.nextOrderId,
    recipe,
    timeLeft,
    total,
    born: world.elapsed,
  });
  world.nextOrderId += 1;
}

export function buildShot(name, seed) {
  const world = createWorld(seed);
  startShift(world);
  // Freeze the clock where the shot wants it; the main loop never advances
  // a shot world, so timers and animations hold still.
  world.shot = true;

  if (name === 'start') {
    world.screen = 'title';
    // A lively kitchen behind the title: two orders already on the board.
    fakeOrder(world, 'classic-burger', 48, 55);
    fakeOrder(world, 'garden-salad', 30, 55);
    world.chef.x = 640;
    world.chef.y = 470;
    return world;
  }

  if (name === 'play') {
    world.elapsed = 52;
    world.shiftLeft = 128;
    world.level = 2;
    world.score = 34;
    world.served = 3;
    world.combo = 2;
    world.comboTimer = 5;
    fakeOrder(world, 'cheese-burger', 38, 50);
    fakeOrder(world, 'garden-salad', 22, 50);
    fakeOrder(world, 'bacon-egg-bun', 9, 45); // urgent, red timer
    // Ingredients on the counters, one dish mid-assembly, one item chopping.
    world.chef.x = 880;
    world.chef.y = 300;
    world.chef.face = 'up';
    world.carry = [{ id: 'tomato', ready: false }];
    world.plate = [{ id: 'bun', ready: true }, { id: 'patty', ready: true }];
    world.chop = { item: 'lettuce', hits: 2 };
    world.grill = [{ item: 'bacon', t: 4.2 }];
    world.nearest = null;
    world.hint = 'WASD / arrows to move — E or click to use a counter';
    return world;
  }

  if (name === 'serve') {
    world.elapsed = 118;
    world.shiftLeft = 62;
    world.level = 3;
    world.score = 86;
    world.served = 7;
    world.combo = 3;
    world.comboTimer = 6;
    fakeOrder(world, 'classic-burger', 26, 45);
    fakeOrder(world, 'onion-melt', 15, 45);
    // A finished Classic Burger on the plate, chef at the pass window.
    world.plate = [
      { id: 'bun', ready: true },
      { id: 'patty', ready: true },
      { id: 'lettuce', ready: true },
    ];
    world.chef.x = 1150;
    world.chef.y = 620;
    world.chef.face = 'down';
    world.nearest = null;
    world.hint = 'E: SERVE! This plate matches an order';
    return world;
  }

  if (name === 'end') {
    world.screen = 'over';
    world.score = 142;
    world.served = 12;
    world.missed = 2;
    world.bestCombo = 4;
    world.shiftLeft = 0;
    world.elapsed = 180;
    return world;
  }

  // Unknown shot name: plain title.
  world.screen = 'title';
  return world;
}
