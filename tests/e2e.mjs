// Teste local de ponta a ponta + prints. Rode o servidor com tempos curtos e o site buildado:
//   CW_SPEED=12 node server/index.ts      (recarga de 5 s, eventos a cada 5–15 s)
//   npx vite preview --port 4173
//   PW_CHANNEL=msedge node tests/e2e.mjs
import { chromium } from 'playwright';
import { io } from 'socket.io-client';
import { mkdirSync } from 'node:fs';
import { MOVES, makeMaze, solve, step } from '../shared/maze.ts';

const SITE = process.argv[2] ?? 'http://localhost:4173/';
const SERVER = process.argv[3] ?? 'http://localhost:3001';
const OUT = 'docs/prints';
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL }); // ex.: PW_CHANNEL=msedge
const vp = { width: 1366, height: 680 }; // Chromebook comum, descontando a barra do navegador
async function open(name) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${name}: ${m.text()}`));
  page.on('dialog', (d) => d.accept());
  return page;
}
const shot = (page, file) => page.screenshot({ path: `${OUT}/${file}.png` });

function bot(name) {
  const s = io(SERVER, { transports: ['websocket'] });
  const st = { me: null, bank: [], board: null, players: [] };
  s.on('view', (v) => Object.assign(st, v));
  const call = (ev, d = {}) => new Promise((r) => s.emit(ev, d, r));
  return { name, s, st, call };
}

// ---- professor cria a sala, alunos entram ----
const prof = await open('prof');
await prof.goto(SITE + '#prof');
await prof.click('text=Criar sala');
await prof.waitForSelector('.big-code');
const code = (await prof.locator('.big-code').innerText()).replace(/\s/g, '');
console.log('sala', code);

async function join(name, av) {
  const p = await open(name);
  await p.goto(`${SITE}?sala=${code}`);
  await p.fill('input[placeholder="Como quer aparecer"]', name);
  await p.click(`.av-pick >> nth=${av}`);
  await p.click('button:has-text("Entrar")');
  await p.waitForSelector('.lobby');
  return p;
}
const ana = await join('Ana', 0);
const bruno = await join('Bruno', 5);
const names = ['Carla', 'Davi', 'Enzo', 'Fabi', 'Gabi', 'Heitor'];
const bots = names.map(bot);
await sleep(400);
for (const [i, b] of bots.entries()) { const r = await b.call('join', { code, name: b.name, av: (i * 3 + 2) % 16 }); if (!r.ok) throw new Error(r.err); }
await sleep(600);

// ---- professor monta as equipes à mão (por fileira) e ajusta o tempo ----
const pick = (n, t) => prof.click(`.pcard:has-text("${n}") .team-pick button.${t}`);
await prof.click('.minutes button[aria-label="Mais 5 minutos"]');
await sleep(250);
await prof.click('.minutes button[aria-label="Menos 5 minutos"]');
await pick('Ana', 'def'); await pick('Bruno', 'inv'); await pick('Carla', 'def');
await sleep(500);
await prof.hover('.pcard:has-text("Davi") .team-pick button.inv');
await shot(prof, '30-professor-montando-equipes');
for (const n of ['Davi', 'Enzo']) await pick(n, 'def');
for (const n of ['Fabi', 'Gabi', 'Heitor']) await pick(n, 'inv');
await prof.mouse.move(5, 5);
await sleep(600);
await shot(prof, '31-professor-equipes-prontas');
await shot(ana, '32-aluno-equipe-definida');

await prof.click('button:has-text("Iniciar partida")');
await ana.waitForSelector('.maze-panel');
await bruno.waitForSelector('.bank-grid');
await sleep(1000);
await shot(ana, '33-defensor-preparacao-labirinto');

// dicas das ferramentas
for (const [i, t] of ['Expandir banco', 'Comprimento', 'Composição', 'Rastrear'].entries()) {
  await bruno.hover(`button.tool:has-text("${t}")`);
  await sleep(450);
  await shot(bruno, `3${4 + i}-dica-${t.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}`);
}
await bruno.mouse.move(5, 5);
await ana.hover('button:has-text("Trocar 1 letra")');
await sleep(450);
await shot(ana, '38-dica-trocar-letra');
await ana.mouse.move(5, 5);

// senhas reais (o professor pode ver) — só para guiar os robôs
await prof.click('button:has-text("Mostrar senhas")');
await sleep(300);
const secret = {};
for (const c of await prof.locator('.dcard').all()) secret[await c.locator('.dcard-name').innerText()] = await c.locator('.dcard-sub').innerText();
await prof.click('button:has-text("Esconder senhas")');
await prof.click('button:has-text("Começar agora")');
await sleep(800);
const realWords = new Set(Object.values(secret));
const byName = (st, n) => st.players.find((p) => p.name === n);
const invBots = bots.filter((b) => b.st.me?.team === 'inv');
const target = 'Carla';

async function wave(defName, n = 99) {
  for (const b of invBots.slice(0, n)) {
    const d = byName(b.st, defName);
    const struck = new Set(b.st.board?.strikes[d.id] ?? []);
    const opts = b.st.bank.filter(([id, w]) => !struck.has(id) && !realWords.has(w));
    const r = await b.call('attempt', { def: d.id, entry: opts[Math.floor(Math.random() * opts.length)][0] });
    if (!r.ok) console.log('bot', b.name, r.err);
  }
}
async function quietQuiz(p) { // responde desafio aberto para não cobrir os prints
  if (await p.locator('.quiz-opts button:not([disabled])').count()) { await p.click('.quiz-opts button >> nth=0'); await sleep(4300); }
}

// ---- labirinto da Ana ----
await quietQuiz(ana);
await ana.click('.maze-start button:has-text("Jogar")');
await ana.waitForSelector('.maze');
await sleep(500);
await shot(ana, '39-labirinto-inicio');
const m = makeMaze(Number(await ana.getAttribute('.maze', 'data-seed')));
const keyOf = { U: 'ArrowUp', D: 'ArrowDown', L: 'ArrowLeft', R: 'ArrowRight' };
const press = async (path, after) => {
  for (let i = 0; i < path.length; i++) { await ana.keyboard.press(keyOf[path[i]]); await sleep(110); await after?.(i); }
};
// 1) cai de propósito no phishing mais perto
const prev = new Map([[m.start, null]]);
const q = [m.start];
let trapRoute = '';
for (let i = 0; i < q.length && !trapRoute; i++) {
  const c = q[i];
  for (const mv of Object.keys(MOVES)) {
    if (!(m.cells[c] & MOVES[mv])) continue;
    const n = step(c, MOVES[mv]);
    if (m.traps.includes(n)) {
      let r = mv;
      for (let x = c; prev.get(x); x = prev.get(x)[0]) r = prev.get(x)[1] + r;
      trapRoute = r;
      break;
    }
    if (!prev.has(n)) { prev.set(n, [c, mv]); q.push(n); }
  }
}
await press(trapRoute.slice(0, -1));
await sleep(500);
await ana.keyboard.press(keyOf[trapRoute.at(-1)]);
await sleep(180);
await shot(ana, '40-labirinto-phishing');
await sleep(900);
// 2) caminho até o baú; print no meio e um ataque chegando enquanto joga
const route = solve(m);
const second = (() => { let got = 0, pos = m.start; for (let i = 0; i < route.length; i++) { pos = step(pos, MOVES[route[i]]); if (m.items.includes(pos) && ++got === 2) return i; } return 10; })();
await press(route, async (i) => {
  if (i === second) { await sleep(400); await shot(ana, '41-labirinto-meio'); }
  if (i === second + 3) {
    await quietQuiz(ana);
    await wave('Ana', 1);
    await sleep(1200);
    await shot(ana, '42-labirinto-sob-ataque');
    await ana.keyboard.press('Space');
    await sleep(700);
  }
});
await ana.waitForSelector('.chest-open');
await sleep(800);
await shot(ana, '43-bau-aberto');
await ana.click('.chest-choices button:has-text("+1 bloqueio")');
await sleep(900);
await shot(ana, '44-bau-premio');

// ---- evento surpresa automático ----
await bruno.waitForSelector('.toast.big', { state: 'detached', timeout: 8000 }).catch(() => {});
await bruno.waitForSelector('.toast.big', { timeout: 40_000 });
await sleep(600);
await shot(bruno, '45-evento-surpresa');

// ---- invasores trabalham e Bruno quebra a senha da Carla ----
await invBots[0].call('tool', { kind: 'len', def: byName(invBots[0].st, target).id });
for (let i = 0; i < 3; i++) { await wave(target); await sleep(5600); }
await bruno.click(`.dcard:has-text("${target}")`);
await bruno.fill('.search input', secret[target].toLowerCase());
await sleep(200);
await bruno.click(`.bank-grid .chip:text-is("${secret[target]}")`);
await bruno.fill('.search input', '');
await bruno.waitForSelector('button.attack:not([disabled])', { timeout: 15_000 });
await bruno.click('button.attack');
await ana.waitForSelector('.vig', { timeout: 10_000 });
await sleep(1100);
await shot(ana, '46-vinheta-no-labirinto');
await sleep(2400);
await shot(bruno, '47-invasor-depois-do-acerto');
await shot(prof, '48-professor-ao-vivo');
await prof.click('button:has-text("+2 min")');
await sleep(500);
await shot(prof, '49-professor-mais-2-min');

await prof.click('button:has-text("Encerrar")');
await ana.waitForSelector('.winner');
await sleep(1500);
await shot(prof, '50-resultado-professor');
await prof.click('button:has-text("Montar equipes")');
await prof.waitForSelector('.team-pick');
await sleep(800);
await shot(prof, '51-professor-remontar-equipes');

console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros no console');
for (const b of bots) b.s.close();
await browser.close();
process.exit(errors.length ? 1 : 0);
