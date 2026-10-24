# Graph Report - LudoCount  (2026-10-24)

## Corpus Check
- 104 files · ~156,254 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 984 nodes · 2099 edges · 56 communities (46 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.62)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `410506da`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- azul-match.ts
- TtrMatch
- dependencies
- azul-page.ts
- options
- ttr-match.ts
- Board Game Score Counter — Build Prompt
- devDependencies
- 2.2 Caixas grandes
- ludocount
- PARTE 1 — Regras genéricas (núcleo comum)
- App
- Azul — Especificação de Cálculo de Pontos
- LudoCount
- Persistence
- Stepper
- vercel.json
- group-models.ts
- ttr-counter.ts
- sw-select.ts
- variant-select.ts
- TtrMatch
- landing.ts
- SwCounter
- LiveDemo
- azul-wall.ts
- AzulMatch
- AzulPage
- azul-page.ts
- GroupSetup
- HistoryPanel
- I18n
- Landing
- sintra-page.ts
- postbuild.mjs
- app.routes.server.ts
- NotFound
- package.json
- audit.models.ts
- sw-match.ts
- rxjs
- pavilion-board.ts
- SwCounter
- group-models.ts
- PavilionPage
- i18n.ts
- AzulPavilionMatch
- MatchHistory
- ranking.ts
- GroupSetup
- Seo
- history-panel.ts
- SwDuelForm
- .start
- SwArchitectsForm
- @angular/platform-browser

## God Nodes (most connected - your core abstractions)
1. `I18n` - 42 edges
2. `SevenWondersMatch` - 30 edges
3. `TtrMatch` - 24 edges
4. `TtrCounter` - 24 edges
5. `MatchHistory` - 22 edges
6. `GroupTable` - 20 edges
7. `AzulMatch` - 19 edges
8. `SwCounter` - 19 edges
9. `Seo` - 18 edges
10. `AzulGardenMatch` - 17 edges

## Surprising Connections (you probably didn't know these)
- `bootstrap()` --indirect_call--> `App`  [INFERRED]
  src/main.server.ts → src/app/app.ts
- `Row` --inherits--> `DraftPlayer`  [EXTRACTED]
  src/app/shared/ui/group/group-setup.ts → src/app/core/group/group-models.ts
- `GroupTableConfig` --references--> `MatchHistory`  [EXTRACTED]
  src/app/core/group/group-table.ts → src/app/core/services/match-history.ts
- `SeoData` --references--> `Locale`  [EXTRACTED]
  src/app/core/seo/seo.ts → src/app/core/i18n/i18n.ts
- `localeResolver()` --indirect_call--> `I18n`  [INFERRED]
  src/app/core/i18n/locale.resolver.ts → src/app/core/i18n/i18n.ts

## Import Cycles
- None detected.

## Communities (56 total, 10 thin omitted)

### Community 0 - "azul-match.ts"
Cohesion: 0.05
Nodes (36): AzulMatch, AzulSnapshot, Injectable, AZUL_COLORS, AzulColor, cloneWall(), colOfColor(), countContiguous() (+28 more)

### Community 1 - "TtrMatch"
Cohesion: 0.10
Nodes (4): scrollToTop(), Component, TtrCounter, BonusSpec

### Community 2 - "dependencies"
Cohesion: 0.11
Nodes (19): @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/platform-server, @angular/router, @angular/ssr, motion (+11 more)

### Community 3 - "azul-page.ts"
Cohesion: 0.23
Nodes (15): BonusState, PavilionSnapshot, chainSize(), cloneBoard(), PAVILION_COLORS, PAVILION_NUMBER_BONUS, PAVILION_STAR_BONUS, PAVILION_STARS (+7 more)

### Community 4 - "options"
Cohesion: 0.05
Nodes (44): build, serve, test, builder, configurations, defaultConfiguration, options, packageManager (+36 more)

### Community 5 - "ttr-match.ts"
Cohesion: 0.25
Nodes (16): BreakdownRow, EMPTY, TtrSheet, TtrSnapshot, bonusesTotal(), bonusPoints(), BonusState, buildAudit() (+8 more)

### Community 6 - "Board Game Score Counter — Build Prompt"
Cohesion: 0.09
Nodes (21): Acceptance criteria, Assets, Audit trail (both games), Board Game Score Counter — Build Prompt, Counter, Game: Azul, Game: Ticket to Ride, Goal (+13 more)

### Community 7 - "devDependencies"
Cohesion: 0.10
Nodes (21): @angular/build, @angular/compiler-cli, jsdom, devDependencies, @angular/build, @angular/cli, @angular/compiler-cli, jsdom (+13 more)

### Community 8 - "2.2 Caixas grandes"
Cohesion: 0.06
Nodes (32): 1.1 Fluxo da partida, 1.2 Reivindicar rotas, 1.3 Elementos recorrentes (nem toda edição tem), 1.4 Tabela padrão de pontos por rota, 1.5 Bilhetes de destino, 1.6 Bônus de fim de partida (catálogo), 1.7 Fórmula genérica, 1.8 Desempate (+24 more)

### Community 9 - "ludocount"
Cohesion: 0.07
Nodes (42): AzulGardenMatch, GardenSnapshot, Injectable, WheelMemory, CELLS, GardenBoard, GardenBrush, RING (+34 more)

### Community 10 - "PARTE 1 — Regras genéricas (núcleo comum)"
Cohesion: 0.14
Nodes (15): alternates(), configSrc, enUrl(), ptUrl(), root, routes, SITE_URL, swSrc (+7 more)

### Community 11 - "App"
Cohesion: 0.09
Nodes (23): App, appConfig, config, serverConfig, azul(), garden(), landing(), localizedRoutes() (+15 more)

### Community 12 - "Azul — Especificação de Cálculo de Pontos"
Cohesion: 0.20
Nodes (9): 1. Estruturas, 2. Migração para a parede, 3. Pontuação por ligação, 4. Penalidades (linha do chão), 5. Ordem de execução do turno, 6. Casos de teste sugeridos, Azul — Especificação de Cálculo de Pontos, Estado por jogador (+1 more)

### Community 13 - "LudoCount"
Cohesion: 0.33
Nodes (5): Estrutura, LudoCount, Regras, Rodar, Stack

### Community 14 - "Persistence"
Cohesion: 0.21
Nodes (18): scoreSheet(), evaluate(), ScienceInput, ScienceResult, scienceScore(), architectsProgress(), DUEL_MILITARY_ZONES, duelProgress() (+10 more)

### Community 16 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, cleanUrls, headers, outputDirectory, $schema, trailingSlash

### Community 18 - "ttr-counter.ts"
Cohesion: 0.23
Nodes (9): GroupResults, Component, GroupStandings, Component, PlayerStrip, StripPlayer, Component, SessionBoard (+1 more)

### Community 19 - "sw-select.ts"
Cohesion: 0.18
Nodes (11): L, SW_VARIANTS, SwExpansion, SwExpansionId, swExpName(), swName(), swNote(), swTag() (+3 more)

### Community 20 - "variant-select.ts"
Cohesion: 0.11
Nodes (14): bonusHint(), bonusLabel(), findVariant(), GLOBETROTTER, L, LONGEST_PATH, RouteTable, STANDARD (+6 more)

### Community 21 - "TtrMatch"
Cohesion: 0.15
Nodes (4): emptySheet(), Injectable, TtrMatch, uid()

### Community 22 - "landing.ts"
Cohesion: 0.10
Nodes (16): AzulSintraMatch, SintraEvent, SintraSnapshot, Injectable, emptyWindows(), leftoverPoints(), ornamentBonus(), scoreWindow() (+8 more)

### Community 23 - "SwCounter"
Cohesion: 0.15
Nodes (6): AuditEntry, SevenWondersMatch, swPlayerLimits(), Injectable, withExpansions(), AuditGroup

### Community 24 - "LiveDemo"
Cohesion: 0.25
Nodes (7): candidates, chrome, chromePath, pageSocketUrl(), profile, root, sleep()

### Community 25 - "azul-wall.ts"
Cohesion: 0.20
Nodes (10): scripts, build, ng, postbuild, prebuild, seo, start, test (+2 more)

### Community 26 - "AzulMatch"
Cohesion: 0.21
Nodes (6): SwBaseForm, Component, BABEL_TOWER_VP, MilitaryToken, NavalToken, TokenSpec

### Community 27 - "AzulPage"
Cohesion: 0.09
Nodes (5): AzulPage, Component, azulVersionName(), SintraPage, Component

### Community 29 - "GroupSetup"
Cohesion: 0.18
Nodes (6): SwCat, Component, NumField, Component, Switch, Component

### Community 30 - "HistoryPanel"
Cohesion: 0.18
Nodes (8): GroupTableConfig, HISTORY_GAMES, HistoryGame, HistoryPlayer, pushCapped(), uid(), Persistence, Injectable

### Community 31 - "I18n"
Cohesion: 0.12
Nodes (24): at(), BOARD_EXTENT, bonus(), BONUS_SPACES, BONUS_TILES, BonusKind, edgeKeys(), mid() (+16 more)

### Community 33 - "sintra-page.ts"
Cohesion: 0.15
Nodes (13): HistoryPart, AZUL_VERSIONS, AzulVersion, AzulVersionId, AzulVersions, Component, AuditSheet, Component (+5 more)

### Community 34 - "postbuild.mjs"
Cohesion: 0.50
Nodes (3): out, root, src

### Community 35 - "app.routes.server.ts"
Cohesion: 0.53
Nodes (5): Component, TtrLocomotive, TtrRail, TtrTaxi, TtrWagon

### Community 36 - "NotFound"
Cohesion: 0.17
Nodes (13): Directive, Faq, Novidade, NotFound, Component, variantName(), Reveal, BrandMark (+5 more)

### Community 37 - "package.json"
Cohesion: 0.40
Nodes (4): name, packageManager, private, version

### Community 38 - "audit.models.ts"
Cohesion: 0.50
Nodes (3): GameId, PlayerRef, SOLO_PLAYER

### Community 39 - "sw-match.ts"
Cohesion: 0.13
Nodes (17): BaseExp, DuelExp, EMPTY, emptySheet(), normalizeSheet(), SwSheet, SwSnapshot, DUEL_TEMPLE_VP (+9 more)

### Community 41 - "pavilion-board.ts"
Cohesion: 0.25
Nodes (4): BonusSpace, Bonus, PavilionBoard, Component

### Community 42 - "SwCounter"
Cohesion: 0.13
Nodes (3): scrollToTop(), SwCounter, Component

### Community 43 - "group-models.ts"
Cohesion: 0.26
Nodes (10): DraftPlayer, GroupMatch, GroupMode, GroupPlayer, PLAYER_COLORS, PlayerLimits, SessionRecord, SessionResult (+2 more)

### Community 44 - "PavilionPage"
Cohesion: 0.20
Nodes (3): PavilionPage, Component, PavilionColor

### Community 45 - "i18n.ts"
Cohesion: 0.20
Nodes (7): DICT, I18n, Locale, LOCALES, Injectable, localeResolver(), SeoData

### Community 46 - "AzulPavilionMatch"
Cohesion: 0.23
Nodes (4): AzulPavilionMatch, Injectable, emptyBoard(), PavilionStar

### Community 47 - "MatchHistory"
Cohesion: 0.33
Nodes (3): listKey(), MatchHistory, Injectable

### Community 48 - "ranking.ts"
Cohesion: 0.38
Nodes (8): BoardRow, byRules(), Ranked, RankItem, rankStandings(), sessionBoard(), tieDiff(), tieIndex()

### Community 50 - "Seo"
Cohesion: 0.42
Nodes (3): localizedPath(), Seo, Injectable

### Community 51 - "history-panel.ts"
Cohesion: 0.25
Nodes (3): HistoryEntry, HistoryPanel, Component

## Knowledge Gaps
- **184 isolated node(s):** `$schema`, `version`, `packageManager`, `newProjectRoot`, `projectType` (+179 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `I18n` connect `i18n.ts` to `azul-match.ts`, `sintra-page.ts`, `azul-page.ts`, `NotFound`, `ttr-match.ts`, `sw-match.ts`, `ludocount`, `App`, `group-models.ts`, `ttr-counter.ts`, `sw-select.ts`, `history-panel.ts`, `landing.ts`, `AzulMatch`, `GroupSetup`, `I18n`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `SevenWondersMatch` connect `SwCounter` to `sw-match.ts`, `group-models.ts`, `ttr-counter.ts`, `sw-select.ts`, `AzulMatch`, `GroupSetup`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `MatchHistory` connect `MatchHistory` to `sintra-page.ts`, `ttr-match.ts`, `sw-match.ts`, `ludocount`, `group-models.ts`, `ttr-counter.ts`, `history-panel.ts`, `HistoryPanel`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `$schema`, `version`, `packageManager` to the rest of the system?**
  _184 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `azul-match.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05401234567901234 - nodes in this community are weakly interconnected._
- **Should `TtrMatch` be split into smaller, more focused modules?**
  _Cohesion score 0.10153846153846154 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._