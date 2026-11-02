import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Room, Oops } from './game.ts';
import { WORDS, makeBank } from './words.ts';
import { makeMaze, play, solve } from '../shared/maze.ts';
import type { Fx, View } from '../shared/types.ts';

function setup(n = 4) {
  const sent: { sid: string; ev: string; data: View | Fx }[] = [];
  const r = new Room('TEST', (sid, ev, data) => sent.push({ sid, ev, data }));
  const ps = Array.from({ length: n }, (_, i) => r.join(`Aluno${i}`, i, `s${i}`));
  r.start();
  r.goLive();
  const defs = r.list('def'), invs = r.list('inv');
  return { r, sent, defs, invs };
}

test('banco: 100 senhas únicas, 5 a 7 caracteres', () => {
  assert.ok(WORDS.length >= 140, `poucas palavras: ${WORDS.length}`);
  const b = makeBank(100, new Set());
  assert.equal(new Set(b).size, 100);
  for (const w of b) assert.ok(w.length >= 5 && w.length <= 7, w);
});

test('equipes equilibradas e senhas secretas', () => {
  const { r, defs, invs } = setup(5);
  assert.ok(Math.abs(defs.length - invs.length) <= 1);
  for (const d of defs) assert.ok(r.bank.some((e) => e.id === d.entry));
  const v = r.view(invs[0], new Set(['bank', 'board', 'players']), true);
  assert.equal(v.secrets, undefined);
  assert.equal(v.me?.pw, undefined);
  assert.ok(!JSON.stringify(v).includes('"entry":' + defs[0].entry + ','), 'vínculo não pode vazar');
});

test('erro risca a senha só para aquele defensor e bloqueia repetição', () => {
  const { r, defs, invs } = setup(4);
  const [d, d2] = defs, [a, b] = invs;
  const wrong = r.bank.find((e) => e.id !== d.entry)!;
  r.attempt(a, d.id, wrong.id);
  assert.throws(() => r.attempt(a, d.id, wrong.id), Oops); // cooldown / em andamento
  r.resolve(r.pending[0], false);
  assert.ok(r.strikes.get(d.id)!.has(wrong.id));
  assert.equal(r.strikes.get(d2.id)?.has(wrong.id) ?? false, false);
  assert.throws(() => r.attempt(b, d.id, wrong.id), /já foi testada/);
  assert.throws(() => r.attempt(a, d.id, r.bank[0].id), /Aguarde/);
});

test('acerto dá 100 pontos, mostra vinheta e encerra quando todos caem', () => {
  const { r, sent, defs, invs } = setup(2);
  const [d] = defs, [a] = invs;
  r.attempt(a, d.id, d.entry!);
  r.resolve(r.pending[0], false);
  assert.equal(d.downBy, a.id);
  assert.ok(a.score >= 100);
  assert.ok(sent.some((s) => s.ev === 'fx' && (s.data as Fx).t === 'vignette'));
  assert.equal(r.phase, 'end');
  assert.equal(r.results?.hits, 1);
});

test('pista certa dá +10', () => {
  const { r, defs, invs } = setup(2);
  const [d] = defs, [a] = invs;
  r.tool(a, 'len', d.id);
  const w = r.pw(d);
  const other = r.bank.find((e) => e.id !== d.entry && e.w.length === w.length)!;
  r.attempt(a, d.id, other.id);
  r.resolve(r.pending[0], false);
  assert.equal(a.score, 10);
});

test('troca de letra atualiza banco e invalida tentativa em andamento', () => {
  const { r, defs, invs } = setup(2);
  const [d] = defs, [a] = invs;
  const old = r.pw(d);
  r.attempt(a, d.id, d.entry!);
  const ch = old[0] === 'x' ? 'y' : 'x';
  r.change(d, 0, ch);
  assert.equal(r.pw(d), ch + old.slice(1));
  assert.ok(!r.bank.some((e) => e.w === old));
  assert.equal(r.bank.length, 100);
  r.resolve(r.pending[0], false);
  assert.equal(d.downBy, null);
  assert.throws(() => r.change(d, 1, 'z'), /já trocou/);
});

test('bloqueio anula o ataque e dá 25', () => {
  const { r, defs, invs } = setup(2);
  const [d] = defs, [a] = invs;
  r.attempt(a, d.id, d.entry!);
  r.block(d);
  assert.equal(d.downBy, null);
  assert.equal(d.score, 25);
  assert.equal(d.blocks, 0);
  assert.equal(r.pending.length, 0);
});

test('fim por tempo dá 100 a quem sobreviveu', () => {
  const { r, defs } = setup(4);
  r.finish();
  for (const d of defs) assert.equal(d.score, 100);
  assert.equal(r.results?.winner, 'def');
});

test('labirinto: só vale o caminho que pega as 4 peças e termina no baú', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const m = makeMaze(seed * 7919);
    assert.equal(m.items.length, 4);
    assert.ok(m.traps.length >= 3, `poucas armadilhas na semente ${seed}`);
    const path = solve(m);
    assert.ok(path.length > 10, `sem solução na semente ${seed}`);
    assert.ok(play(m, path));
    assert.equal(play(m, path + 'U'), false);
    assert.equal(play(m, path.slice(0, -1)), false);
    assert.equal(play(m, 'U' + path), false); // bate na parede de cima
  }
});

test('baú do labirinto: servidor confere caminho, tempo e limite de bloqueios', () => {
  const { r, defs } = setup(2);
  const [d] = defs;
  const { id, seed } = r.mazeStart(d);
  const path = solve(makeMaze(seed));
  assert.throws(() => r.mazeDone(d, id, path, 'block'), /Rápido demais/);
  d.maze!.at -= 120_000;
  assert.throws(() => r.mazeDone(d, id, path.slice(1), 'block'), /inválido/);
  d.blocks = 3;
  assert.deepEqual(r.mazeDone(d, id, path, 'block'), { reward: 'points' }); // já está no máximo
  assert.equal(d.score, 20);
  assert.throws(() => r.mazeStart(d), /Novo labirinto/);
});

test('professor monta equipes, muda o tempo e dá +2 min', () => {
  const sent: unknown[] = [];
  const r = new Room('T2', () => sent.push(1));
  const [a, b, c] = ['Ana', 'Bia', 'Caio'].map((n, i) => r.join(n, i, `s${i}`));
  r.setTeam(a.id, 'inv'); r.setTeam(b.id, 'inv');
  assert.throws(() => r.setMinutes(1), /entre 3 e 60/);
  r.setMinutes(20);
  r.start();
  assert.equal(a.team, 'inv'); assert.equal(b.team, 'inv'); assert.equal(c.team, 'def');
  r.goLive();
  const end = r.endsAt;
  assert.ok(Math.abs(end - Date.now() - 20 * 60_000) < 1000);
  r.extend();
  assert.equal(r.endsAt, end + 120_000);
  r.event('firewall'); r.event('firewall'); r.event('firewall');
  assert.equal(c.blocks, 3);
  r.finish(); r.toLobby();
  r.setTeam(a.id, 'def'); r.setTeam(c.id, 'def'); r.setTeam(b.id, 'def');
  assert.throws(() => r.start(), /duas equipes/);
});
