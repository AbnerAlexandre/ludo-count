# Graph Report - LudoCount  (2026-07-28)

## Corpus Check
- 50 files · ~82,892 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 427 nodes · 656 edges · 17 communities (16 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.61)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bac71349`
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

## God Nodes (most connected - your core abstractions)
1. `AzulMatch` - 19 edges
2. `TtrCounter` - 19 edges
3. `TtrMatch` - 18 edges
4. `I18n` - 17 edges
5. `BonusSpec` - 14 edges
6. `Board Game Score Counter — Build Prompt` - 14 edges
7. `Seo` - 11 edges
8. `options` - 9 edges
9. `AzulPage` - 9 edges
10. `PARTE 1 — Regras genéricas (núcleo comum)` - 9 edges

## Surprising Connections (you probably didn't know these)
- `bootstrap()` --indirect_call--> `App`  [INFERRED]
  src/main.server.ts → src/app/app.ts
- `SeoData` --references--> `Locale`  [EXTRACTED]
  src/app/core/seo/seo.ts → src/app/core/i18n/i18n.ts
- `localeResolver()` --indirect_call--> `I18n`  [INFERRED]
  src/app/core/i18n/locale.resolver.ts → src/app/core/i18n/i18n.ts
- `AuditGroup` --references--> `AuditEntry`  [EXTRACTED]
  src/app/shared/ui/audit-sheet.ts → src/app/core/models/audit.models.ts
- `wallWith()` --calls--> `emptyWall()`  [EXTRACTED]
  src/app/features/azul/scoring/azul-scoring.spec.ts → src/app/features/azul/scoring/azul-scoring.ts

## Import Cycles
- None detected.

## Communities (17 total, 1 thin omitted)

### Community 0 - "azul-match.ts"
Cohesion: 0.07
Nodes (29): AzulMatch, AzulSnapshot, Injectable, Persistence, Injectable, AZUL_COLORS, AzulColor, cloneWall() (+21 more)

### Community 1 - "TtrMatch"
Cohesion: 0.08
Nodes (13): Component, TtrCounter, BonusSpec, TTR_VARIANTS, variantName(), variantNote(), variantTag(), Component (+5 more)

### Community 2 - "dependencies"
Cohesion: 0.08
Nodes (25): @angular/animations, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/platform-browser, @angular/platform-server, @angular/router (+17 more)

### Community 3 - "azul-page.ts"
Cohesion: 0.08
Nodes (13): AuditEntry, GameId, PlayerRef, SOLO_PLAYER, AzulPage, Component, RoundHistory, Component (+5 more)

### Community 4 - "options"
Cohesion: 0.06
Nodes (34): build, serve, test, builder, configurations, defaultConfiguration, packageManager, development (+26 more)

### Community 5 - "ttr-match.ts"
Cohesion: 0.10
Nodes (25): Injectable, TtrMatch, TtrSnapshot, uid(), bonusesTotal(), bonusPoints(), BonusState, buildAudit() (+17 more)

### Community 6 - "Board Game Score Counter — Build Prompt"
Cohesion: 0.09
Nodes (21): Acceptance criteria, Assets, Audit trail (both games), Board Game Score Counter — Build Prompt, Counter, Game: Azul, Game: Ticket to Ride, Goal (+13 more)

### Community 7 - "devDependencies"
Cohesion: 0.06
Nodes (33): @angular/build, @angular/compiler-cli, jsdom, devDependencies, @angular/build, @angular/cli, @angular/compiler-cli, jsdom (+25 more)

### Community 8 - "2.2 Caixas grandes"
Cohesion: 0.06
Nodes (32): 1.1 Fluxo da partida, 1.2 Reivindicar rotas, 1.3 Elementos recorrentes (nem toda edição tem), 1.4 Tabela padrão de pontos por rota, 1.5 Bilhetes de destino, 1.6 Bônus de fim de partida (catálogo), 1.7 Fórmula genérica, 1.8 Desempate (+24 more)

### Community 9 - "ludocount"
Cohesion: 0.10
Nodes (14): DICT, I18n, Locale, LOCALES, localizedPath(), Injectable, localeResolver(), Seo (+6 more)

### Community 10 - "PARTE 1 — Regras genéricas (núcleo comum)"
Cohesion: 0.16
Nodes (13): alternates(), configSrc, enUrl(), ptUrl(), root, routes, SITE_URL, today (+5 more)

### Community 11 - "App"
Cohesion: 0.14
Nodes (13): App, appConfig, config, serverConfig, azul(), landing(), localizedRoutes(), routes (+5 more)

### Community 12 - "Azul — Especificação de Cálculo de Pontos"
Cohesion: 0.20
Nodes (9): 1. Estruturas, 2. Migração para a parede, 3. Pontuação por ligação, 4. Penalidades (linha do chão), 5. Ordem de execução do turno, 6. Casos de teste sugeridos, Azul — Especificação de Cálculo de Pontos, Estado por jogador (+1 more)

### Community 13 - "LudoCount"
Cohesion: 0.33
Nodes (5): Estrutura, LudoCount, Regras, Rodar, Stack

### Community 14 - "Persistence"
Cohesion: 0.20
Nodes (10): options, assets, browser, inlineStyleLanguage, outputMode, prerender, server, styles (+2 more)

### Community 16 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, cleanUrls, headers, outputDirectory, $schema, trailingSlash

## Knowledge Gaps
- **146 isolated node(s):** `$schema`, `version`, `packageManager`, `newProjectRoot`, `projectType` (+141 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `I18n` connect `ludocount` to `azul-match.ts`, `TtrMatch`, `azul-page.ts`, `ttr-match.ts`, `App`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `AzulMatch` connect `azul-match.ts` to `azul-page.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `$schema`, `version`, `packageManager` to the rest of the system?**
  _146 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `azul-match.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06948051948051948 - nodes in this community are weakly interconnected._
- **Should `TtrMatch` be split into smaller, more focused modules?**
  _Cohesion score 0.07665505226480836 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `azul-page.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07526881720430108 - nodes in this community are weakly interconnected._