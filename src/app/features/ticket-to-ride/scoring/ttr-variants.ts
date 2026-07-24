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
}

const STANDARD: RouteTable = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 10, 6: 15 };

const LONGEST_PATH: BonusSpec = {
  id: 'longest',
  label: 'Caminho mais longo',
  kind: 'toggle',
  value: 10,
  hint: 'Maior caminho contínuo em vagões (+10)',
};
const GLOBETROTTER: BonusSpec = {
  id: 'globetrotter',
  label: 'Globetrotter',
  kind: 'toggle',
  value: 10,
  hint: 'Mais bilhetes de destino completos (+10)',
};

export const TTR_VARIANTS: TtrVariant[] = [
  {
    id: 'usa',
    name: 'EUA',
    tag: 'Clássico · 2004',
    logo: TTR_GENERIC_LOGO, // o logo genérico é o da versão EUA
    playersMin: 2,
    playersMax: 5,
    cars: 45,
    routeTable: STANDARD,
    bonuses: [LONGEST_PATH],
    note: 'A caixa base — tabela de referência, sem túneis nem estações.',
  },
  {
    id: 'europa',
    name: 'Europa',
    tag: '2005',
    logo: 'ticket-to-ride/ticket-europe.webp',
    playersMin: 2,
    playersMax: 5,
    cars: 45,
    routeTable: { 1: 1, 2: 2, 3: 4, 4: 7, 6: 15, 8: 21 }, // não existe rota de 5
    bonuses: [
      {
        id: 'stations',
        label: 'Estações não construídas',
        kind: 'counter',
        unit: 4,
        min: 0,
        max: 3,
        hint: 'Cada estação que sobrou vale +4 (máx. 3)',
      },
      { ...LONGEST_PATH, label: 'European Express' },
    ],
    note: 'Túneis, ferries e 3 estações. Rotas de 6 e 8; sem rota de 5.',
  },
  {
    id: 'nordic',
    name: 'Nordic Countries',
    tag: '2007 · 2–3 jog.',
    logo: 'ticket-to-ride/ticket-nordic.webp',
    playersMin: 2,
    playersMax: 3,
    cars: 40,
    routeTable: { 1: 1, 2: 2, 3: 4, 4: 7, 5: 10, 6: 15, 9: 27 },
    bonuses: [GLOBETROTTER],
    note: 'Rota de 9 vagões (+27). Sem restrição de locomotiva; sem caminho mais longo.',
  },
  {
    id: 'marklin',
    name: 'Märklin',
    tag: 'Alemanha · 2006',
    playersMin: 2,
    playersMax: 5,
    cars: 45,
    routeTable: { 1: 1, 2: 2, 3: 4, 4: 7, 5: 10, 6: 15, 7: 18 },
    bonuses: [
      { ...GLOBETROTTER, label: 'Mais bilhetes completos' },
      {
        id: 'goods',
        label: 'Fichas de mercadoria',
        kind: 'numeric',
        min: 0,
        max: 200,
        step: 1,
        hint: 'Soma direta das fichas coletadas pelos passageiros',
      },
    ],
    note: 'Passageiros e mercadorias; rotas de 7 vagões (+18). Sem caminho mais longo.',
  },
  {
    id: 'switzerland',
    name: 'Switzerland',
    tag: '2–3 jog.',
    playersMin: 2,
    playersMax: 3,
    cars: 45,
    routeTable: STANDARD,
    bonuses: [LONGEST_PATH],
    note: 'Bilhetes de cidade→país; locomotivas só em túneis.',
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
        kind: 'numeric',
        min: 0,
        max: 40,
        step: 5,
        hint: 'Bilhetes feitos por dois caminhos: 2×+5, depois 3×+10 (máx. +40)',
      },
    ],
    note: 'Mandala: bilhetes completados por circuito rendem bônus extra.',
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
        kind: 'numeric',
        min: 0,
        max: 55,
        step: 5,
        hint: 'Bônus final por posição no ranking de moedas (até +55)',
      },
      {
        id: 'loans',
        label: 'Cartas de empréstimo',
        kind: 'counter',
        unit: -5,
        min: 0,
        max: 10,
        hint: 'Cada empréstimo vale −5, sem quitação',
      },
    ],
    note: 'Pedágios e empréstimos. Sem caminho mais longo nem Globetrotter.',
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
        kind: 'numeric',
        min: 0,
        max: 100,
        step: 1,
        hint: 'Pontos das companhias conforme a maioria de ações',
      },
    ],
    note: 'Ações de companhias ferroviárias pagam por maioria no fim.',
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
        kind: 'counter',
        unit: 2,
        min: 0,
        max: 20,
        hint: 'Cada vagão devolvido às rotas de montanha vale +2',
      },
      { id: 'explorer', label: 'Explorer', kind: 'toggle', value: 10, hint: 'Mais cidades numa única rede (+10)' },
    ],
    note: 'Rotas de montanha (X) devolvem vagões à reserva, que pontua no fim.',
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
        kind: 'numeric',
        min: -20,
        max: 20,
        step: 1,
        hint: 'Rede compartilhada — quem não contribui recebe pontos negativos',
      },
    ],
    note: 'Rede de Trem-Bala compartilhada; o ranking final pode ser negativo.',
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
        kind: 'numeric',
        min: 0,
        max: 100,
        step: 1,
        hint: 'Pontos pela quantidade de regiões distintas conectadas',
      },
    ],
    note: 'Sem Globetrotter nem caminho mais longo — o que conta são as regiões.',
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
  },
];

export function findVariant(id: string): TtrVariant | undefined {
  return TTR_VARIANTS.find((v) => v.id === id);
}
