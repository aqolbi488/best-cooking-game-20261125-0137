# Sizzle & Serve — a tiny kitchen rush

![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)
![rank](https://make.fun/badge/best-cooking-game-20261125-0137/aqolbi488/best-cooking-game-20261125-0137/rank.svg)
![reward](https://make.fun/badge/best-cooking-game-20261125-0137/aqolbi488/best-cooking-game-20261125-0137/reward.svg)

A complete little cooking game: orders land on the board, you run the kitchen.
Fetch ingredients from the counters, chop the veg, grill the patties, build
each dish on the assembly plate and ring the bell to serve before the order
timer runs out. Serve fast to keep a combo going; the lunch rush only gets
busier as the 3-minute shift goes on.

## How to play

- **Move:** WASD or arrow keys (mouse clicks work on counters too)
- **Use a counter:** E or click — pick up, chop, grill, plate, serve, bin
- **Mute:** M — **Restart:** R (or Enter on the game-over screen)

Six recipes to learn, each a different route through the kitchen:

- **Garden Salad** — lettuce + tomato ($8)
- **Classic Burger** — bun + patty + lettuce ($12)
- **Cheese Burger** — bun + patty + cheese ($14)
- **Bacon & Egg Bun** — bun + bacon + egg ($15)
- **Onion Melt** — bun + patty + cheese + onion ($13)
- **Double Stack** — bun + patty + patty + cheese + tomato ($18)

Chop veg on the chopping board (3 hits), grill patties, bacon and eggs on
the grill (ready in 6 seconds — burnt after 12), and only prepared food goes
on a plate. A plate only serves when it matches an order exactly, so plan
your route: two hands, one plate, and a board full of hungry timers.

## How to run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. The game is plain
static files under `game/` — no build step, no network request, all art and
sound drawn and synthesised in code.

## Files

- `game/index.html` — the page, loads `game/src/main.js`
- `game/src/config.js` — kitchen layout, ingredients, recipes, difficulty
- `game/src/world.js` — game state and every rule: orders, stations, scoring
- `game/src/render.js` — all canvas drawing: kitchen, board, chef, food
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesised Web Audio sounds, no audio files
- `game/src/shots.js` — deterministic staged states for the screenshots
- `game/src/main.js` — the loop and the title / playing / game-over machine
- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to `/output`
  and writes `dossier.json`
- `screenshots/` — real renders of the game in the browser

Built for the make.fun best cooking game bounty:
https://make.fun/?ref=msc0ap6f
