// Teste local de ponta a ponta + prints. Precisa do servidor (npm start) e do site (npx vite preview) rodando.
// Uso: node tests/e2e.mjs [urlDoSite] [urlDoServidor]
import { chromium } from 'playwright';
import { io } from 'socket.io-client';
import { mkdirSync } from 'node:fs';

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

// ---- robôs: alunos simulados via socket ----
function bot(name, av) {
  const s = io(SERVER, { transports: ['websocket'] });
  const st = { me: null, bank: [], board: null, players: [] };
  s.on('view', (v) => Object.assign(st, v));
  const call = (ev, d = {}) => new Promise((r) => s.emit(ev, d, r));
  s.on('fx', (f) => {
    if (f.t === 'alert' && st.me?.team === 'def' && name === BLOCKER) setTimeout(() => call('block'), 900);
  });
  // defensores robôs respondem os desafios (nem sempre certo)
  setInterval(() => {
    const q = st.me?.quiz;
    if (q && !q.done) { q.done = true; setTimeout(() => call('answer', { id: q.id, choice: Math.floor(Math.random() * q.opts.length) }), 1500); }
  }, 500);
  return { name, s, st, call };
}
let BLOCKER = '';

const prof = await open('prof');
await prof.goto(SITE + '#prof');
await prof.waitForSelector('text=Criar sala');
await shot(prof, '01-professor-inicio');
await prof.click('text=Criar sala');
await prof.waitForSelector('.big-code');
const code = (await prof.locator('.big-code').innerText()).replace(/\s/g, '');
console.log('sala', code);

const ana = await open('ana');
await ana.goto(`${SITE}?sala=${code}`);
await ana.fill('input[placeholder="Como quer aparecer"]', 'Ana');
await ana.click('.av-pick >> nth=0');
await shot(ana, '02-aluno-entrada');
await ana.click('button:has-text("Entrar")');
await ana.waitForSelector('.lobby');

const bruno = await open('bruno');
await bruno.goto(`${SITE}?sala=${code}`);
await bruno.fill('input[placeholder="Como quer aparecer"]', 'Bruno');
await bruno.click('.av-pick >> nth=5');
await bruno.click('button:has-text("Entrar")');
await bruno.waitForSelector('.lobby');

const names = ['Carla', 'Davi', 'Enzo', 'Fabi', 'Gabi', 'Heitor'];
const bots = names.map((n, i) => bot(n, (i * 3 + 2) % 16));
await sleep(500);
for (const b of bots) { const r = await b.call('join', { code, name: b.name, av: names.indexOf(b.name) * 3 % 16 + 1 }); if (!r.ok) throw new Error(r.err); }
await sleep(800);
await shot(ana, '03-aluno-sala-de-espera');
await shot(prof, '04-professor-sala');

// sorteia até Ana defender e Bruno invadir (só para os prints)
for (let i = 0; i < 30; i++) {
  await prof.click('button:has-text("Sortear equipes")');
  await sleep(350);
  const a = await ana.locator('.role-reveal').innerText().catch(() => '');
  const b = await bruno.locator('.role-reveal').innerText().catch(() => '');
  if (/defensor/i.test(a) && /invasor/i.test(b)) break;
}
await sleep(700);
await shot(ana, '05-aluno-equipe-sorteada');
await shot(prof, '06-professor-equipes');

await prof.click('button:has-text("Iniciar partida")');
await ana.waitForSelector('.pw-panel');
await bruno.waitForSelector('.bank-grid');
await sleep(1200);
await shot(ana, '07-defensor-preparacao');
await shot(bruno, '08-invasor-banco-preparacao');

// senhas reais (o professor pode ver) — usadas só para guiar os robôs
await prof.click('button:has-text("Mostrar senhas")');
await sleep(300);
const secret = {};
for (const c of await prof.locator('.dcard').all()) {
  const n = await c.locator('.dcard-name').innerText();
  secret[n] = await c.locator('.dcard-sub').innerText();
}
await shot(prof, '09-professor-preparacao');
await prof.click('button:has-text("Esconder senhas")');
await prof.click('button:has-text("Começar agora")');
await sleep(800);

const byName = (st, n) => st.players.find((p) => p.name === n);
const invBots = bots.filter((b) => b.st.me?.team === 'inv');
const defBots = bots.filter((b) => b.st.me?.team === 'def');
BLOCKER = defBots[1]?.name ?? '';
const target = defBots[0].name; // alvo principal da equipe vermelha
console.log('def', defBots.map((b) => b.name), 'inv', invBots.map((b) => b.name), 'alvo', target);
const realWords = new Set(Object.values(secret));

async function wave(defName, n = 99) {
  for (const b of invBots.slice(0, n)) {
    const d = byName(b.st, defName);
    const struck = new Set(b.st.board?.strikes[d.id] ?? []);
    const opts = b.st.bank.filter(([id, w]) => !struck.has(id) && !realWords.has(w));
    const [id] = opts[Math.floor(Math.random() * opts.length)];
    await b.call('attempt', { def: d.id, entry: id });
  }
}

// ondas de ataque contra o alvo + ferramentas
await invBots[0].call('tool', { kind: 'len', def: byName(invBots[0].st, target).id });
await invBots[1]?.call('tool', { kind: 'comp', def: byName(invBots[1].st, target).id });
for (let i = 0; i < 4; i++) {
  await wave(target);
  await sleep(4600);
  await prof.click('button:has-text("Força bruta")');
  await sleep(300);
}

// Ana sob ataque: alerta com botão de bloquear
await wave('Ana', 1);
await sleep(1400);
await shot(ana, '10-defensor-sob-ataque');
await ana.click('button:has-text("Bloquear")');
await sleep(900);
await shot(ana, '11-defensor-bloqueou');

// Bruno escolhe o alvo, usa ferramentas e vê o banco riscado
await bruno.click(`.dcard:has-text("${target}")`);
await bruno.click('button.tool:has-text("Rastrear")');
await sleep(500);
for (const c of await bruno.locator('.bank-grid .chip:not(.struck):not(.nofit):not(.found)').all()) {
  if (!realWords.has(await c.innerText())) { await c.click(); break; }
}
await sleep(300);
await shot(bruno, '12-invasor-mirando');
await bruno.click('button:has-text("Atacar")');
await sleep(1500);
await shot(bruno, '13-invasor-quebrando');
await sleep(3500);
await shot(bruno, '14-invasor-errou-riscada');

// Ana troca um caractere
await ana.click('button:has-text("Trocar 1 caractere")');
await ana.click('.tile >> nth=1');
await ana.fill('.edit-row input', '@');
await shot(ana, '15-defensor-trocando');
await ana.click('.edit-row button:has-text("Trocar")');
await sleep(600);

// desafio LGPD para todos
await prof.click('button:has-text("Desafio LGPD")');
await ana.waitForSelector('.quiz');
await sleep(600);
await shot(ana, '16-defensor-desafio');
await ana.click('.quiz-opts button >> nth=0');
await sleep(700);
await shot(ana, '17-defensor-desafio-resposta');
await bruno.click('.quiz-opts button >> nth=1').catch(() => {});

// Bruno quebra a senha do alvo: vinheta para todos
await prof.click('button:has-text("Força bruta")');
await sleep(400);
await bruno.fill('.search input', secret[target].toLowerCase());
await sleep(200);
await bruno.click(`.bank-grid .chip:text-is("${secret[target]}")`);
await bruno.fill('.search input', '');
await bruno.click('button:has-text("Atacar")');
await ana.waitForSelector('.vig', { timeout: 8000 });
await sleep(1100);
await shot(ana, '18-vinheta-defensor-descoberto');
await shot(prof, '19-vinheta-professor');
await sleep(2600);
await shot(bruno, '20-invasor-depois-do-acerto');
await shot(prof, '21-professor-ao-vivo');
await shot(ana, '22-defensor-ao-vivo');

// mais uma senha cai (robô) para o resultado ficar interessante
await prof.click('button:has-text("Força bruta")');
await sleep(300);
const d2 = defBots[2] ?? defBots[1];
const e2 = invBots[0].st.bank.find(([, w]) => w === secret[d2.name]);
await invBots[0].call('attempt', { def: byName(invBots[0].st, d2.name).id, entry: e2[0] });
await sleep(7500);

await prof.click('button:has-text("Encerrar")');
await ana.waitForSelector('.winner');
await sleep(1500);
await shot(ana, '23-resultado-aluno');
await shot(bruno, '24-resultado-invasor');
await shot(prof, '25-resultado-professor');
await ana.setViewportSize({ width: 1366, height: 1100 });
await sleep(400);
await shot(ana, '26-resultado-completo');

// segunda rodada com equipes invertidas
await prof.click('button:has-text("Inverter equipes e jogar")');
await ana.setViewportSize(vp);
await ana.waitForSelector('.bank-grid');
await sleep(1000);
await shot(ana, '27-rodada2-ana-invasora');

// tela pequena (celular)
const phone = await open('phone');
await phone.setViewportSize({ width: 390, height: 844 });
await phone.goto(SITE);
await sleep(800);
await shot(phone, '28-celular-entrada');

console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros no console');
for (const b of bots) b.s.close();
await browser.close();
process.exit(errors.length ? 1 : 0);
