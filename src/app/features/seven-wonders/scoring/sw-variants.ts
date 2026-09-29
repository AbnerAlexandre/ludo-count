/**
 * 7 Wonders — versões e expansões suportadas (dados, não código).
 *
 * Fontes das regras de pontuação: manuais oficiais (Repos Production) e
 * resumos do UltraBoardGames / Board Game Arena. Onde o valor exato não pôde
 * ser confirmado, o app pede o número ao jogador em vez de supor.
 */

export type SwVariantId = 'base' | 'duel' | 'architects';
export type SwExpansionId = 'leaders' | 'cities' | 'armada' | 'babel' | 'edifice' | 'pantheon' | 'agora';

export interface SwExpansion {
  id: SwExpansionId;
  name: string;
  nameEn: string;
}

export interface SwVariant {
  id: SwVariantId;
  name: string;
  nameEn: string;
  tag: string;
  tagEn: string;
  note: string;
  noteEn: string;
  expansions: SwExpansion[];
}

export const SW_VARIANTS: SwVariant[] = [
  {
    id: 'base',
    name: '7 Wonders',
    nameEn: '7 Wonders',
    tag: '1ª e 2ª edição · 3–7 jogadores',
    tagEn: '1st & 2nd edition · 3–7 players',
    note: 'Militar, tesouro, maravilha, cartas azuis, amarelas, guildas e ciência — com as expansões Leaders, Cities, Armada, Babel e Edifice.',
    noteEn: 'Military, treasury, wonder, blue, yellow, guilds and science — with the Leaders, Cities, Armada, Babel and Edifice expansions.',
    expansions: [
      { id: 'leaders', name: 'Leaders', nameEn: 'Leaders' },
      { id: 'cities', name: 'Cities', nameEn: 'Cities' },
      { id: 'armada', name: 'Armada', nameEn: 'Armada' },
      { id: 'babel', name: 'Babel', nameEn: 'Babel' },
      { id: 'edifice', name: 'Edifice', nameEn: 'Edifice' },
    ],
  },
  {
    id: 'duel',
    name: '7 Wonders Duel',
    nameEn: '7 Wonders Duel',
    tag: '2 jogadores',
    tagEn: '2 players',
    note: 'Vitória civil por pontos, com trilha militar, fichas de progresso e as vitórias imediatas por supremacia — com Pantheon e Agora.',
    noteEn: 'Civilian victory by points, with the military track, progress tokens and instant supremacy wins — with Pantheon and Agora.',
    expansions: [
      { id: 'pantheon', name: 'Pantheon', nameEn: 'Pantheon' },
      { id: 'agora', name: 'Agora', nameEn: 'Agora' },
    ],
  },
  {
    id: 'architects',
    name: '7 Wonders Architects',
    nameEn: '7 Wonders Architects',
    tag: '2–7 jogadores',
    tagEn: '2–7 players',
    note: 'Etapas da maravilha, cartas azuis, fichas de vitória militar, o gato e as fichas de progresso que dão pontos.',
    noteEn: 'Wonder stages, blue cards, military victory tokens, the cat and the progress tokens that score points.',
    expansions: [],
  },
];

export function findSwVariant(id: string): SwVariant | undefined {
  return SW_VARIANTS.find((v) => v.id === id);
}

type L = 'pt' | 'en';
export const swName = (v: SwVariant, l: L) => (l === 'en' ? v.nameEn : v.name);
export const swTag = (v: SwVariant, l: L) => (l === 'en' ? v.tagEn : v.tag);
export const swNote = (v: SwVariant, l: L) => (l === 'en' ? v.noteEn : v.note);
export const swExpName = (e: SwExpansion, l: L) => (l === 'en' ? e.nameEn : e.name);
