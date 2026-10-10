# Graph Report - LudoCount  (2026-10-10)

## Corpus Check
- 87 files · ~116,811 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 763 nodes · 1555 edges · 42 communities (32 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.63)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0b483195`
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
- ThemeService
- postbuild.mjs
- app.routes.server.ts
- NotFound
- package.json
- audit.models.ts
- @angular/platform-browser
- rxjs
- prettier

## God Nodes (most connected - your core abstractions)
1. `I18n` - 33 edges
2. `SevenWondersMatch` - 30 edges
3. `TtrMatch` - 24 edges
4. `TtrCounter` - 24 edges
5. `GroupTable` - 20 edges
6. `AzulMatch` - 19 edges
7. `MatchHistory` - 19 edges
8. `SwCounter` - 19 edges
9. `prefersReducedMotion()` - 17 edges
10. `Seo` - 15 edges

## Surprising Connections (you probably didn't know these)
- `bootstrap()` --indirect_call--> `App`  [INFERRED]
  src/main.server.ts → src/app/app.ts
- `Row` --inherits--> `DraftPlayer`  [EXTRACTED]
  src/app/shared/ui/group/group-setup.ts → src/app/core/group/group-models.ts
- `SeoData` --references--> `Locale`  [EXTRACTED]
  src/app/core/seo/seo.ts → src/app/core/i18n/i18n.ts
- `localeResolver()` --indirect_call--> `I18n`  [INFERRED]
  src/app/core/i18n/locale.resolver.ts → src/app/core/i18n/i18n.ts
- `AuditGroup` --references--> `AuditEntry`  [EXTRACTED]
  src/app/shared/ui/audit-sheet.ts → src/app/core/models/audit.models.ts

## Import Cycles
- None detected.

## Communities (42 total, 10 thin omitted)

### Community 0 - "azul-match.ts"
Cohesion: 0.06
Nodes (34): AzulMatch, AzulSnapshot, Injectable, AZUL_COLORS, AzulColor, cloneWall(), colOfColor(), countContiguous() (+26 more)

### Community 1 - "TtrMatch"
Cohesion: 0.10
Nodes (4): scrollToTop(), Component, TtrCounter, BonusSpec

### Community 2 - "dependencies"
Cohesion: 0.11
Nodes (19): @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/platform-server, @angular/router, @angular/ssr, motion (+11 more)

### Community 3 - "azul-page.ts"
Cohesion: 0.10
Nodes (8): AuditEntry, SevenWondersMatch, Injectable, withExpansions(), findSwVariant(), AuditGroup, TokenTray, Component

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
Cohesion: 0.11
Nodes (19): @angular/compiler-cli, jsdom, devDependencies, @angular/cli, @angular/compiler-cli, jsdom, postcss, prettier (+11 more)

### Community 8 - "2.2 Caixas grandes"
Cohesion: 0.06
Nodes (32): 1.1 Fluxo da partida, 1.2 Reivindicar rotas, 1.3 Elementos recorrentes (nem toda edição tem), 1.4 Tabela padrão de pontos por rota, 1.5 Bilhetes de destino, 1.6 Bônus de fim de partida (catálogo), 1.7 Fórmula genérica, 1.8 Desempate (+24 more)

### Community 9 - "ludocount"
Cohesion: 0.42
Nodes (3): localizedPath(), Seo, Injectable

### Community 10 - "PARTE 1 — Regras genéricas (núcleo comum)"
Cohesion: 0.14
Nodes (15): alternates(), configSrc, enUrl(), ptUrl(), root, routes, SITE_URL, swSrc (+7 more)

### Community 11 - "App"
Cohesion: 0.09
Nodes (20): App, appConfig, config, serverConfig, azul(), landing(), localizedRoutes(), notFound() (+12 more)

### Community 12 - "Azul — Especificação de Cálculo de Pontos"
Cohesion: 0.20
Nodes (9): 1. Estruturas, 2. Migração para a parede, 3. Pontuação por ligação, 4. Penalidades (linha do chão), 5. Ordem de execução do turno, 6. Casos de teste sugeridos, Azul — Especificação de Cálculo de Pontos, Estado por jogador (+1 more)

### Community 13 - "LudoCount"
Cohesion: 0.33
Nodes (5): Estrutura, LudoCount, Regras, Rodar, Stack

### Community 14 - "Persistence"
Cohesion: 0.06
Nodes (47): BaseExp, DuelExp, EMPTY, emptySheet(), normalizeSheet(), scoreSheet(), SwSheet, SwSnapshot (+39 more)

### Community 16 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, cleanUrls, headers, outputDirectory, $schema, trailingSlash

### Community 17 - "group-models.ts"
Cohesion: 0.06
Nodes (34): BoardRow, DraftPlayer, GroupMatch, GroupMode, GroupPlayer, PLAYER_COLORS, PlayerLimits, SessionRecord (+26 more)

### Community 18 - "ttr-counter.ts"
Cohesion: 0.19
Nodes (12): Choice, ChoiceOption, Component, GroupResults, Component, GroupStandings, Component, PlayerStrip (+4 more)

### Community 19 - "sw-select.ts"
Cohesion: 0.18
Nodes (11): L, SW_VARIANTS, SwExpansion, SwExpansionId, swExpName(), swName(), swNote(), swTag() (+3 more)

### Community 20 - "variant-select.ts"
Cohesion: 0.13
Nodes (12): bonusHint(), bonusLabel(), GLOBETROTTER, L, LONGEST_PATH, RouteTable, STANDARD, TtrVariant (+4 more)

### Community 21 - "TtrMatch"
Cohesion: 0.18
Nodes (3): Injectable, TtrMatch, uid()

### Community 22 - "landing.ts"
Cohesion: 0.19
Nodes (13): Directive, Faq, Novidade, TTR_VARIANTS, variantName(), Reveal, BrandMark, SwMark (+5 more)

### Community 23 - "SwCounter"
Cohesion: 0.13
Nodes (3): scrollToTop(), SwCounter, Component

### Community 24 - "LiveDemo"
Cohesion: 0.22
Nodes (5): HistoryPart, AuditSheet, Component, ConfirmDialog, Component

### Community 25 - "azul-wall.ts"
Cohesion: 0.22
Nodes (9): scripts, build, ng, postbuild, prebuild, seo, start, test (+1 more)

### Community 26 - "AzulMatch"
Cohesion: 0.31
Nodes (3): SwBaseForm, Component, TokenSpec

### Community 30 - "HistoryPanel"
Cohesion: 0.25
Nodes (3): HistoryEntry, HistoryPanel, Component

### Community 31 - "I18n"
Cohesion: 0.22
Nodes (7): DICT, I18n, Locale, LOCALES, Injectable, localeResolver(), SeoData

### Community 34 - "postbuild.mjs"
Cohesion: 0.50
Nodes (3): out, root, src

### Community 35 - "app.routes.server.ts"
Cohesion: 0.53
Nodes (5): Component, TtrLocomotive, TtrRail, TtrTaxi, TtrWagon

### Community 37 - "package.json"
Cohesion: 0.40
Nodes (4): name, packageManager, private, version

### Community 38 - "audit.models.ts"
Cohesion: 0.50
Nodes (3): GameId, PlayerRef, SOLO_PLAYER

## Knowledge Gaps
- **161 isolated node(s):** `$schema`, `version`, `packageManager`, `newProjectRoot`, `projectType` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `I18n` connect `I18n` to `azul-match.ts`, `ttr-match.ts`, `App`, `Persistence`, `group-models.ts`, `ttr-counter.ts`, `sw-select.ts`, `landing.ts`, `LiveDemo`, `HistoryPanel`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `SevenWondersMatch` connect `azul-page.ts` to `group-models.ts`, `ttr-counter.ts`, `sw-select.ts`, `Persistence`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `TtrMatch` connect `TtrMatch` to `TtrMatch`, `ThemeService`, `ttr-match.ts`, `group-models.ts`, `ttr-counter.ts`, `variant-select.ts`, `landing.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `$schema`, `version`, `packageManager` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `azul-match.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.058596491228070174 - nodes in this community are weakly interconnected._
- **Should `TtrMatch` be split into smaller, more focused modules?**
  _Cohesion score 0.10153846153846154 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._