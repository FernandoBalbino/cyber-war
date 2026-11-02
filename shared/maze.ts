// Labirinto da "missão senha forte". O mesmo código gera o labirinto no navegador e no servidor
// a partir da semente: o aluno joga localmente e só manda o caminho no final, e o servidor confere.
export const MW = 13, MH = 9;
const N = 1, E = 2, S = 4, W = 8;
export const WALL = { N, E, S, W };
export const MOVES = { U: N, R: E, D: S, L: W } as const;
export type Move = keyof typeof MOVES;
export const PIECES = ['len', 'upper', 'digit', 'symbol'] as const; // items[i] é a peça PIECES[i]
export type Maze = { seed: number; cells: number[]; start: number; chest: number; items: number[]; traps: number[] };

const DIRS: [number, number, number, number][] = [[N, 0, -1, S], [E, 1, 0, W], [S, 0, 1, N], [W, -1, 0, E]];

export const step = (c: number, d: number) => (d === N ? c - MW : d === S ? c + MW : d === E ? c + 1 : c - 1);
const around = (cells: number[], c: number) => DIRS.filter(([d]) => cells[c] & d).map(([d]) => step(c, d));

// mulberry32: gerador simples e determinístico
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeMaze(seed: number): Maze {
  const r = rng(seed);
  const mix = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const cells: number[] = new Array(MW * MH).fill(0);
  const seen = new Uint8Array(MW * MH);
  const stack = [0];
  seen[0] = 1;
  while (stack.length) {
    const c = stack[stack.length - 1], x = c % MW, y = Math.floor(c / MW);
    const open = DIRS.filter(([, dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx >= 0 && ny >= 0 && nx < MW && ny < MH && !seen[ny * MW + nx];
    });
    if (!open.length) { stack.pop(); continue; }
    const [d, dx, dy, back] = open[Math.floor(r() * open.length)];
    const n = (y + dy) * MW + x + dx;
    cells[c] |= d; cells[n] |= back; seen[n] = 1;
    stack.push(n);
  }
  const dist: number[] = new Array(MW * MH).fill(-1), parent: number[] = new Array(MW * MH).fill(-1);
  const order = [0];
  dist[0] = 0;
  for (let i = 0; i < order.length; i++) {
    for (const n of around(cells, order[i])) if (dist[n] < 0) { dist[n] = dist[order[i]] + 1; parent[n] = order[i]; order.push(n); }
  }
  const chest = order[order.length - 1]; // o ponto mais distante da largada
  const dead = order.filter((c) => c !== 0 && c !== chest && around(cells, c).length === 1);
  const far = dead.filter((c) => dist[c] > 6);
  const pool = mix(far.length >= 4 ? far : dead.length >= 4 ? dead : order.filter((c) => c !== 0 && c !== chest));
  const items = pool.slice(0, 4);
  // armadilhas só em desvios: o caminho até as peças e o baú nunca passa por elas
  const need = new Set<number>();
  for (const t of [...items, chest]) for (let c = t; c !== -1; c = parent[c]) need.add(c);
  const traps = mix(order.filter((c) => !need.has(c) && around(cells, c).some((n) => need.has(n)))).slice(0, 7);
  return { seed, cells, start: 0, chest, items, traps };
}

// Repete o caminho do aluno. Válido só se pega as 4 peças e termina no baú.
export function play(m: Maze, path: string): boolean {
  let pos = m.start;
  const got = new Set<number>();
  for (let i = 0; i < path.length; i++) {
    const d = MOVES[path[i] as Move];
    if (!d || !(m.cells[pos] & d)) return false;
    pos = step(pos, d);
    if (m.traps.includes(pos)) pos = m.start;
    if (m.items.includes(pos)) got.add(pos);
    if (pos === m.chest && got.size === m.items.length) return i === path.length - 1;
  }
  return false;
}

// Menor caminho válido (pega as 4 peças, foge das armadilhas). Usado pelos testes e pelos bots.
export function solve(m: Maze): string {
  const full = (1 << m.items.length) - 1, start = m.start * 16;
  const prev = new Map<number, [number, Move]>([[start, [-1, 'U']]]);
  const q = [start];
  for (let i = 0; i < q.length; i++) {
    const s = q[i], pos = s >> 4, got = s & 15;
    if (pos === m.chest && got === full) {
      let path = '';
      for (let c = s; c !== start; c = prev.get(c)![0]) path = prev.get(c)![1] + path;
      return path;
    }
    for (const mv of Object.keys(MOVES) as Move[]) {
      if (!(m.cells[pos] & MOVES[mv])) continue;
      const np = step(pos, MOVES[mv]);
      if (m.traps.includes(np)) continue;
      const k = m.items.indexOf(np), ns = np * 16 + (k >= 0 ? got | (1 << k) : got);
      if (!prev.has(ns)) { prev.set(ns, [s, mv]); q.push(ns); }
    }
  }
  return '';
}
