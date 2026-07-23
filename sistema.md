# Board Game Score Counter — Build Prompt

## Goal

Build a client-side web app that calculates and audits scores for board games. The first two games are **Azul** and **Ticket to Ride** (including its map variants).

The app must eliminate the manual arithmetic errors that happen during play sessions — every point must be traceable back to its source.

---

## Stack

- **Angular (latest LTS)** — standalone components, signals for state, the new control flow syntax (`@if`, `@for`), typed reactive forms where forms are needed. No NgModules.
- **SCSS + Tailwind CSS** for layout and design tokens.
- **Inline SVG** components (not `<img>`) so fills and strokes can be themed via `currentColor` and CSS custom properties.
- **Angular Animations API** for route transitions and component enter/leave; a lightweight animation library (GSAP or Motion One) is acceptable for the hero landing if it produces a meaningfully better result.
- No backend, no HTTP calls, no external APIs. Everything runs in the browser.
- State lives in Angular services backed by signals. Persist the active match to `localStorage` so a page refresh does not lose progress.

---

## Scope

- **Single player only.** The app scores the person using it — they enter their own inputs, and that is the whole flow.
- Model the data so that multiple players could be added later without a rewrite, but do not build multiplayer now.
- No accounts, no sync, no sharing.

---

## Rules source

The scoring rules are provided as markdown files in the repo. Read them before implementing any calculation logic — do not rely on general knowledge of these games.

```
regras/
  azul/
    (scoring rules)
    parede-azul-vazia-exemplo.png       # reference: empty wall layout
    parede-azul-preenchida-exemplo.png  # reference: filled wall layout
  ticket-to-ride/
    contagem-ticket-to-ride.md          # core rules + per-variant differences
```

The Ticket to Ride file documents multiple map variants that score differently. Treat the route-point tables and the end-game bonuses as **per-variant configuration data**, never as hardcoded constants.

---

## Assets

```
public/
  azul/               # tile images (one per color), negative-point marker, game logo
  ticket-to-ride/     # game logo, locomotive.svg, train-rail.svg
```

Use these assets in the UI. The Ticket to Ride SVGs should be usable as decorative and functional elements (loaders, dividers, section accents) and must respect the app's color tokens.

---

## UX requirements

### Mobile first

- Design for phone screens first; the phone is the primary device, since the app is used at the table mid-game.
- Tap targets sized for thumbs (minimum 44×44 px), generous spacing, no hover-dependent interactions.
- Scale up cleanly to tablet and desktop — wider layouts, but the same control sizes so buttons stay comfortable. Do not shrink controls on desktop.
- Numeric inputs should use steppers/tap controls rather than requiring keyboard entry wherever possible.

### Landing page

- A visually striking hero section that establishes the app's identity.
- Polished, deliberate animations — entrance transitions, staggered reveals, motion on the game-selection cards.
- Navigating from the landing to a game counter must feel like a continuous animated transition, not a hard page swap.
- Respect `prefers-reduced-motion`.

---

## Game: Azul

### Wall rendering

Render the 5×5 wall as an interactive SVG or CSS grid, matching the layout and color positions shown in the reference images (`parede-azul-vazia-exemplo.png`, `parede-azul-preenchida-exemplo.png`).

Wall color positions follow the formula `color(row, col) = COLORS[(col - row) mod 5]` with `COLORS = [blue, yellow, red, black, white]`.

### Round tracking

- The player marks which tiles moved to the wall in the current round; the app computes the points using the adjacency rules from the rules file.
- Floor-line penalties are entered per round and applied after wall scoring.
- **Each placed tile displays a small round-number badge in its top-right corner** — small but clearly legible — indicating which round that tile entered that position.

### Round history

- A navigable history of rounds. The player can step back and forth through rounds and see, for each one: the points scored, the floor penalty applied, the running total, and which tiles were placed on the wall that round.
- Navigating the history highlights the tiles placed in the selected round on the wall itself.
- The history is **cleared when the player finishes a match and starts a new one**.

---

## Game: Ticket to Ride

### Variant selection

After navigating to Ticket to Ride, the player must first choose which map/edition they are playing. Only after selecting a variant does the counter start.

The variant selection determines:
- The route-length → points table
- Which end-game bonuses apply
- Which variant-specific mechanics appear in the counter (stations, terrain cards, tolls, regions, shares, etc.)

The counter UI must show **only** the inputs relevant to the selected variant. A variant without stations must not show a stations field.

### Counter

- Route entry: the player records claimed routes by length; the app applies the variant's point table.
- Destination tickets: completed tickets add their value, uncompleted tickets subtract it.
- Variant-specific bonuses as configured.
- The final score **can be negative**. Do not clamp to zero.

---

## Audit trail (both games)

The player must be able to open a breakdown of the current match and see the origin of every point in the total — each entry showing what produced it, when, and how much.

Examples of what an entry looks like:
- Azul: "Round 3 — tile at row 2, col 4: +5 (horizontal 3 + vertical 2)"
- Azul: "Round 3 — floor line, 2 tiles: −2"
- Ticket to Ride: "Route of 6 cars: +15"
- Ticket to Ride: "Ticket not completed: −11"

The audit view is read-only and reflects the same data the totals are computed from — it must never be a separately maintained list that can drift from the score.

---

## Match lifecycle (both games)

- Starting a new match while one is in progress must show a **confirmation dialog** warning that the current score and history will be erased.
- The dialog requires explicit confirmation. Cancelling leaves the match untouched.
- This applies to every game in the app.

---

## Suggested structure

```
src/app/
  core/
    models/              # shared score/audit types
    services/            # match state, persistence, audit log
  shared/
    ui/                  # buttons, steppers, dialogs, animated shell
    svg/                 # inline SVG components
  features/
    landing/
    azul/
      wall/
      round-history/
      scoring/           # pure functions, no Angular deps
    ticket-to-ride/
      variant-select/
      counter/
      scoring/           # pure functions, variant config data
```

Keep all scoring math in **pure, framework-free functions**. Components read from services; services call the pure functions. This keeps the rules unit-testable in isolation.

---

## Acceptance criteria

1. Azul scoring matches the rules file, including the double-count on horizontal + vertical intersections, the row-1-to-row-5 processing order, and the zero floor on negative totals.
2. Ticket to Ride scoring matches the selected variant's table and bonuses, and allows negative totals.
3. Every point in either game is traceable in the audit view.
4. Azul tiles show a legible round-number badge and the round history is navigable.
5. Starting a new match always prompts for confirmation and clears history on confirm.
6. The app is fully usable one-handed on a phone and comfortable on desktop.
7. Scoring functions are covered by unit tests, including the edge cases listed in the rules files.

---

## Non-goals

- Multiplayer, accounts, or any server component.
- Tracking the game state itself (which routes are available, which tiles are in factories). The app scores what the player reports; it does not simulate the game.
- Games beyond Azul and Ticket to Ride, though adding a third game later should not require restructuring.