/**
 * Ticket to Ride — per-edition configuration data.
 *
 * Per the rules file (`regras/ticket-to-ride/contagem-ticket-to-ride.md`) the
 * route tables and end-game bonuses are DATA, never hardcoded constants. Each
 * variant declares its own route table, which route modifiers exist, and which
 * bonus inputs the counter must show. A variant without stations simply does not
 * list a stations bonus, so the UI never renders that field.
 */

/** length (in cars) → points */
export type RouteTable = Record<number, number>;

/**
 * A player-reported bonus input. The app does not simulate the board, so bonuses
 * are things the player tells us about at the end of the match.
 */
export interface BonusSpec {
  id: string;
  label: string;
  /**
   * - `toggle`  : yes/no award worth a fixed `value` (e.g. Longest Path +10)
   * - `counter` : an integer count multiplied by `unit` (e.g. Europe unbuilt
   *               stations ×4, Legendary Asia mountain cars ×2)
   * - `numeric` : a directly-entered signed value within [min,max]
   *               (e.g. Japan bullet-train ranking, India Grand Tour up to +40)
   */
  kind: 'toggle' | 'counter' | 'numeric';
  value?: number; // toggle
  unit?: number; // counter (points per unit, may be negative)
  min?: number; // counter/numeric
  max?: number; // counter/numeric
  step?: number; // numeric stepper size
  hint?: string;
  /** English overrides (fall back to the pt fields when absent). */
  labelEn?: string;
  hintEn?: string;
}

/** Fallback logo, used by editions that don't ship their own art. */
export const TTR_GENERIC_LOGO = 'ticket-to-ride/ticket-to-ride-logo.png';

export interface TtrVariant {
  id: string;
  name: string;
  /** short region/era tag shown on the card */
  tag: string;
  /**
   * Path (under public/) to this edition's logo. Omitted when no matching art
   * exists — the selection list then shows no logo for that edition, and the
   * counter header falls back to TTR_GENERIC_LOGO.
   */
  logo?: string;
  playersMin: number;
  playersMax: number;
  cars: number;
  routeTable: RouteTable;
  /**
   * Optional terrain-card doubling (Heart of Africa). When present, the counter
   * offers a per-route "terreno (×2)" toggle that swaps in these doubled points.
   */
  terrainTable?: RouteTable;
  bonuses: BonusSpec[];
  /** one-line flavor of the exclusive mechanic, shown in the UI */
  note: string;
  /** English overrides (fall back to the pt fields when absent). */
  nameEn?: string;
  tagEn?: string;
  noteEn?: string;
}

type L = 'pt' | 'en';
export const variantName = (v: TtrVariant, l: L) => (l === 'en' && v.nameEn) || v.name;
export const variantTag = (v: TtrVariant, l: L) => (l === 'en' && v.tagEn) || v.tag;
export const variantNote = (v: TtrVariant, l: L) => (l === 'en' && v.noteEn) || v.note;
export const bonusLabel = (b: BonusSpec, l: L) => (l === 'en' && b.labelEn) || b.label;
export const bonusHint = (b: BonusSpec, l: L) => (l === 'en' && b.hintEn) || b.hint;

const STANDARD: RouteTable = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 10, 6: 15 };

const LONGEST_PATH: BonusSpec = {
  id: 'longest',
  label: 'Caminho mais longo',
  labelEn: 'Longest path',
  kind: 'toggle',
  value: 10,
  hint: 'Maior caminho contínuo em vagões (+10)',
  hintEn: 'Longest continuous path in cars (+10)',
};
const GLOBETROTTER: BonusSpec = {
  id: 'globetrotter',
  label: 'Globetrotter',
  labelEn: 'Globetrotter',
  kind: 'toggle',
  value: 10,
  hint: 'Mais bilhetes de destino completos (+10)',
  hintEn: 'Most completed destination tickets (+10)',
};

export const TTR_VARIANTS: TtrVariant[] = [
  {
    id: 'usa',
    name: 'EUA',
    nameEn: 'USA',
    tag: 'Clássico · 2004',
    tagEn: 'Classic · 2004',
    logo: TTR_GENERIC_LOGO, // o logo genérico é o da versão EUA
    playersMin: 2,
    playersMax: 5,
    cars: 45,
    routeTable: STANDARD,
    bonuses: [LONGEST_PATH],
    note: 'A caixa base — tabela de referência, sem túneis nem estações.',
    noteEn: 'The base box — the reference table, with no tunnels or stations.',
  },
  {
    id: 'europa',
    name: 'Europa',
    nameEn: 'Europe',
    tag: '2005',
    tagEn: '2005',
    logo: 'ticket-to-ride/ticket-europe.webp',
    playersMin: 2,
    playersMax: 5,
    cars: 45,
    routeTable: { 1: 1, 2: 2, 3: 4, 4: 7, 6: 15, 8: 21 }, // não existe rota de 5
    bonuses: [
      {
        id: 'stations',
        label: 'Estações não construídas',
        labelEn: 'Unbuilt stations',
        kind: 'counter',
        unit: 4,
        min: 0,
        max: 3,
        hint: 'Cada estação que sobrou vale +4 (máx. 3)',
        hintEn: 'Each leftover station is worth +4 (max. 3)',
      },
      { ...LONGEST_PATH, label: 'European Express', labelEn: 'European Express' },
    ],
    note: 'Túneis, ferries e 3 estações. Rotas de 6 e 8; sem rota de 5.',
    noteEn: 'Tunnels, ferries and 3 stations. Routes of 6 and 8; no route of 5.',
  },
  {
    id: 'nordic',
    name: 'Nordic Countries',
    tag: '2007 · 2–3 jog.',
    tagEn: '2007 · 2–3 players',
    logo: 'ticket-to-ride/ticket-nordic.webp',
    playersMin: 2,
    playersMax: 3,
    cars: 40,
    routeTable: { 1: 1, 2: 2, 3: 4, 4: 7, 5: 10, 6: 15, 9: 27 },
    bonuses: [GLOBETROTTER],
    note: 'Rota de 9 vagões (+27). Sem restrição de locomotiva; sem caminho mais longo.',
    noteEn: 'A route of 9 cars (+27). No locomotive restriction; no longest path.',
  },
  {
    id: 'marklin',
    name: 'Märklin',
    tag: 'Alemanha · 2006',
    tagEn: 'Germany · 2006',
    playersMin: 2,
    playersMax: 5,
    cars: 45,
    routeTable: { 1: 1, 2: 2, 3: 4, 4: 7, 5: 10, 6: 15, 7: 18 },
    bonuses: [
      { ...GLOBETROTTER, label: 'Mais bilhetes completos', labelEn: 'Most completed tickets' },
      {
        id: 'goods',
        label: 'Fichas de mercadoria',
        labelEn: 'Goods tokens',
        kind: 'numeric',
        min: 0,
        max: 200,
        step: 1,
        hint: 'Soma direta das fichas coletadas pelos passageiros',
        hintEn: 'Direct sum of the tokens collected by the passengers',
      },
    ],
    note: 'Passageiros e mercadorias; rotas de 7 vagões (+18). Sem caminho mais longo.',
    noteEn: 'Passengers and goods; routes of 7 cars (+18). No longest path.',
  },
  {
    id: 'switzerland',
    name: 'Switzerland',
    tag: '2–3 jog.',
    tagEn: '2–3 players',
    playersMin: 2,
    playersMax: 3,
    cars: 45,
    routeTable: STANDARD,
    bonuses: [LONGEST_PATH],
    note: 'Bilhetes de cidade→país; locomotivas só em túneis.',
    noteEn: 'City→country tickets; locomotives only in tunnels.',
  },
  {
    id: 'india',
    name: 'India',
    tag: 'Map Collection 2',
    logo: 'ticket-to-ride/ticket-india.webp',
    playersMin: 2,
    playersMax: 4,
    cars: 45,
    routeTable: STANDARD,
    bonuses: [
      LONGEST_PATH,
      {
        id: 'grandtour',
        label: 'Grand Tour / Mandala',
        labelEn: 'Grand Tour / Mandala',
        kind: 'numeric',
        min: 0,
        max: 40,
        step: 5,
        hint: 'Bilhetes feitos por dois caminhos: 2×+5, depois 3×+10 (máx. +40)',
        hintEn: 'Tickets made via two paths: 2×+5, then 3×+10 (max. +40)',
      },
    ],
    note: 'Mandala: bilhetes completados por circuito rendem bônus extra.',
    noteEn: 'Mandala: tickets completed by a loop earn an extra bonus.',
  },
  {
    id: 'africa',
    name: 'Heart of Africa',
    tag: 'Map Collection 3',
    logo: 'ticket-to-ride/ticket-heartafrica.webp',
    playersMin: 2,
    playersMax: 5,
    cars: 45,
    routeTable: STANDARD,
    terrainTable: { 1: 2, 2: 4, 3: 8, 4: 14, 5: 20, 6: 30 },
    bonuses: [GLOBETROTTER],
    note: 'Cartas de terreno dobram os pontos de uma rota — marque "terreno" ao registrar.',
    noteEn: 'Terrain cards double a route’s points — toggle "terrain" when logging it.',
  },
  {
    id: 'nederland',
    name: 'Nederland',
    tag: 'Map Collection 4',
    logo: 'ticket-to-ride/ticket-nederland.webp',
    playersMin: 2,
    playersMax: 5,
    cars: 45,
    routeTable: STANDARD,
    bonuses: [
      {
        id: 'money',
        label: 'Ranking de moedas',
        labelEn: 'Money ranking',
        kind: 'numeric',
        min: 0,
        max: 55,
        step: 5,
        hint: 'Bônus final por posição no ranking de moedas (até +55)',
        hintEn: 'Final bonus by position in the money ranking (up to +55)',
      },
      {
        id: 'loans',
        label: 'Cartas de empréstimo',
        labelEn: 'Loan cards',
        kind: 'counter',
        unit: -5,
        min: 0,
        max: 10,
        hint: 'Cada empréstimo vale −5, sem quitação',
        hintEn: 'Each loan is worth −5, with no payoff',
      },
    ],
    note: 'Pedágios e empréstimos. Sem caminho mais longo nem Globetrotter.',
    noteEn: 'Tolls and loans. No longest path and no Globetrotter.',
  },
  {
    id: 'pennsylvania',
    name: 'Pennsylvania',
    tag: 'Map Collection 5',
    playersMin: 2,
    playersMax: 5,
    cars: 45,
    routeTable: STANDARD,
    bonuses: [
      GLOBETROTTER,
      {
        id: 'shares',
        label: 'Maiorias acionárias',
        labelEn: 'Share majorities',
        kind: 'numeric',
        min: 0,
        max: 100,
        step: 1,
        hint: 'Pontos das companhias conforme a maioria de ações',
        hintEn: 'Company points based on share majorities',
      },
    ],
    note: 'Ações de companhias ferroviárias pagam por maioria no fim.',
    noteEn: 'Railway company shares pay out by majority at the end.',
  },
  {
    id: 'legendary-asia',
    name: 'Legendary Asia',
    tag: 'Map Collection 1',
    logo: 'ticket-to-ride/ticket-asia.webp',
    playersMin: 2,
    playersMax: 6,
    cars: 45,
    routeTable: STANDARD,
    bonuses: [
      {
        id: 'mountain',
        label: 'Vagões na reserva de montanha',
        labelEn: 'Cars in the mountain reserve',
        kind: 'counter',
        unit: 2,
        min: 0,
        max: 20,
        hint: 'Cada vagão devolvido às rotas de montanha vale +2',
        hintEn: 'Each car returned to the mountain routes is worth +2',
      },
      {
        id: 'explorer',
        label: 'Explorer',
        labelEn: 'Explorer',
        kind: 'toggle',
        value: 10,
        hint: 'Mais cidades numa única rede (+10)',
        hintEn: 'Most cities in a single network (+10)',
      },
    ],
    note: 'Rotas de montanha (X) devolvem vagões à reserva, que pontua no fim.',
    noteEn: 'Mountain routes (X) return cars to the reserve, which scores at the end.',
  },
  {
    id: 'japan',
    name: 'Japan',
    tag: 'Map Collection 7',
    logo: 'ticket-to-ride/ticket-japan.webp',
    playersMin: 2,
    playersMax: 5,
    cars: 45,
    routeTable: STANDARD,
    bonuses: [
      {
        id: 'bullet',
        label: 'Ranking do Trem-Bala',
        labelEn: 'Bullet Train ranking',
        kind: 'numeric',
        min: -20,
        max: 20,
        step: 1,
        hint: 'Rede compartilhada — quem não contribui recebe pontos negativos',
        hintEn: 'Shared network — those who don’t contribute get negative points',
      },
    ],
    note: 'Rede de Trem-Bala compartilhada; o ranking final pode ser negativo.',
    noteEn: 'Shared Bullet Train network; the final ranking can be negative.',
  },
  {
    id: 'italy',
    name: 'Italy',
    tag: 'Map Collection 7',
    playersMin: 2,
    playersMax: 5,
    cars: 45,
    routeTable: STANDARD,
    bonuses: [
      {
        id: 'regions',
        label: 'Bônus de regiões',
        labelEn: 'Region bonus',
        kind: 'numeric',
        min: 0,
        max: 100,
        step: 1,
        hint: 'Pontos pela quantidade de regiões distintas conectadas',
        hintEn: 'Points for the number of distinct regions connected',
      },
    ],
    note: 'Sem Globetrotter nem caminho mais longo — o que conta são as regiões.',
    noteEn: 'No Globetrotter and no longest path — what counts are the regions.',
  },
  {
    id: 'france',
    name: 'France',
    tag: 'Map Collection 6',
    logo: 'ticket-to-ride/ticket-france.webp',
    playersMin: 2,
    playersMax: 5,
    cars: 45,
    routeTable: STANDARD,
    bonuses: [LONGEST_PATH, GLOBETROTTER],
    note: 'Cores das rotas definidas em jogo; caminho mais longo e Globetrotter.',
    noteEn: 'Route colors decided during play; longest path and Globetrotter.',
  },
];

export function findVariant(id: string): TtrVariant | undefined {
  return TTR_VARIANTS.find((v) => v.id === id);
}
