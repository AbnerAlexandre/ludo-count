# Graph Report - LudoCount  (2026-07-23)

## Corpus Check
- 39 files · ~34,573 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 328 nodes · 461 edges · 16 communities (14 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3c39ecc7`
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

## God Nodes (most connected - your core abstractions)
1. `AzulMatch` - 18 edges
2. `TtrMatch` - 16 edges
3. `Board Game Score Counter — Build Prompt` - 14 edges
4. `TtrCounter` - 11 edges
5. `BonusSpec` - 11 edges
6. `PARTE 1 — Regras genéricas (núcleo comum)` - 9 edges
7. `RoundHistory` - 8 edges
8. `wallColor()` - 8 edges
9. `scoreRound()` - 8 edges
10. `AzulWall` - 8 edges

## Surprising Connections (you probably didn't know these)
- `AuditGroup` --references--> `AuditEntry`  [EXTRACTED]
  src/app/shared/ui/audit-sheet.ts → src/app/core/models/audit.models.ts
- `wallWith()` --calls--> `emptyWall()`  [EXTRACTED]
  src/app/features/azul/scoring/azul-scoring.spec.ts → src/app/features/azul/scoring/azul-scoring.ts
- `Cell` --references--> `AzulColor`  [EXTRACTED]
  src/app/features/azul/wall/azul-wall.ts → src/app/features/azul/scoring/azul-scoring.ts
- `AzulSnapshot` --references--> `RoundResult`  [EXTRACTED]
  src/app/core/services/azul-match.ts → src/app/features/azul/scoring/azul-scoring.ts
- `AzulSnapshot` --references--> `Wall`  [EXTRACTED]
  src/app/core/services/azul-match.ts → src/app/features/azul/scoring/azul-scoring.ts

## Import Cycles
- None detected.

## Communities (16 total, 2 thin omitted)

### Community 0 - "azul-match.ts"
Cohesion: 0.08
Nodes (25): AzulMatch, AzulSnapshot, Injectable, AZUL_COLORS, AzulColor, cloneWall(), colOfColor(), countContiguous() (+17 more)

### Community 1 - "TtrMatch"
Cohesion: 0.08
Nodes (13): Injectable, TtrMatch, uid(), Landing, Component, Component, TtrCounter, BonusSpec (+5 more)

### Community 2 - "dependencies"
Cohesion: 0.06
Nodes (31): @angular/animations, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/platform-browser, @angular/router, gsap (+23 more)

### Community 3 - "azul-page.ts"
Cohesion: 0.08
Nodes (13): AuditEntry, GameId, PlayerRef, SOLO_PLAYER, AzulPage, Component, RoundHistory, Component (+5 more)

### Community 4 - "options"
Cohesion: 0.08
Nodes (27): build, serve, test, builder, configurations, defaultConfiguration, options, development (+19 more)

### Community 5 - "ttr-match.ts"
Cohesion: 0.17
Nodes (19): TtrSnapshot, bonusesTotal(), bonusPoints(), BonusState, buildAudit(), ClaimedRoute, routePoints(), routesTotal() (+11 more)

### Community 6 - "Board Game Score Counter — Build Prompt"
Cohesion: 0.09
Nodes (21): Acceptance criteria, Assets, Audit trail (both games), Board Game Score Counter — Build Prompt, Counter, Game: Azul, Game: Ticket to Ride, Goal (+13 more)

### Community 7 - "devDependencies"
Cohesion: 0.10
Nodes (21): @angular/build, @angular/compiler-cli, jsdom, devDependencies, @angular/build, @angular/cli, @angular/compiler-cli, jsdom (+13 more)

### Community 8 - "2.2 Caixas grandes"
Cohesion: 0.10
Nodes (21): 2.1 Quadro comparativo, 2.2 Caixas grandes, 2.3 Map Collections (exigem caixa base), 2.4 Séries curtas de cidade, 2.5 Versões infantis, 3. Recomendações de modelagem, EUA — original (2004), Europa (2005) (+13 more)

### Community 9 - "ludocount"
Cohesion: 0.13
Nodes (14): packageManager, cli, prefix, projectType, root, schematics, sourceRoot, newProjectRoot (+6 more)

### Community 10 - "PARTE 1 — Regras genéricas (núcleo comum)"
Cohesion: 0.17
Nodes (11): 1.1 Fluxo da partida, 1.2 Reivindicar rotas, 1.3 Elementos recorrentes (nem toda edição tem), 1.4 Tabela padrão de pontos por rota, 1.5 Bilhetes de destino, 1.6 Bônus de fim de partida (catálogo), 1.7 Fórmula genérica, 1.8 Desempate (+3 more)

### Community 11 - "App"
Cohesion: 0.29
Nodes (4): App, appConfig, routes, Component

### Community 12 - "Azul — Especificação de Cálculo de Pontos"
Cohesion: 0.20
Nodes (9): 1. Estruturas, 2. Migração para a parede, 3. Pontuação por ligação, 4. Penalidades (linha do chão), 5. Ordem de execução do turno, 6. Casos de teste sugeridos, Azul — Especificação de Cálculo de Pontos, Estado por jogador (+1 more)

### Community 13 - "LudoCount"
Cohesion: 0.33
Nodes (5): Estrutura, LudoCount, Regras, Rodar, Stack

## Knowledge Gaps
- **118 isolated node(s):** `$schema`, `version`, `packageManager`, `newProjectRoot`, `projectType` (+113 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AzulMatch` connect `azul-match.ts` to `azul-page.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `TtrMatch` connect `TtrMatch` to `ttr-match.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Persistence` connect `Persistence` to `azul-match.ts`, `ttr-match.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `$schema`, `version`, `packageManager` to the rest of the system?**
  _118 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `azul-match.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08421985815602837 - nodes in this community are weakly interconnected._
- **Should `TtrMatch` be split into smaller, more focused modules?**
  _Cohesion score 0.07681365576102418 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._