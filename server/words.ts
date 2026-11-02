// Palavras simples do dia a dia (sem acento). Senhas fictícias, geradas só para o jogo.
const RAW = `
gatos cavalo coelho tigre leoes zebra girafa macaco patos sapos tucano arara pombo corvo raposa lobos ursos
baleia polvo tubarao camelo formiga abelha aranha cobra jacare panda pinguim coruja galinha vacas ovelha
porcos peixe gaivota hamster canario lagarto tatus morcego minhoca esquilo lontra focas cisne pavao gazela
porta janela cadeira mesas camas panela garfo colher prato copos toalha espelho escada telhado tapete
relogio chave caneta lapis caderno mochila tesoura regua livro quadro cortina balde pente escova garrafa
chinelo sapato camisa bermuda meias bones oculos celular teclado monitor mouse cabos fones tablet modem
telas botao placa chips disco memoria arquivo pasta
banana laranja morango abacaxi limao manga pizza bolos pastel coxinha arroz feijao farofa queijo sorvete
pipoca batata cenoura tomate salada sucos leite pudim goiaba cajus cocos mamao peras ameixa azeite tapioca
cuscuz torrada
praia areia ondas nuvem chuva trovao raios vento arvore flores folhas pedra vulcao lagoa riacho estrela
planeta cometa galaxia oceano deserto ilhas cidade escola parque museu igreja mercado padaria cinema teatro
hotel ponte estrada avenida fazenda jardim quintal varanda cozinha quarto salas
futebol bolas goleiro torcida corrida skate surfe xadrez volei tenis natacao karate dados cartas piano violao
bateria flauta musica samba forro frevo festa balao pipas robos foguete aviao navio barco trens carro motos
onibus patins
amigo amiga familia irmao primo vizinho sorriso alegria sonho magia heroi ninja pirata dragao castelo
tesouro mapas bussola coroa espada escudo rainha fadas zumbi astro verao inverno outono domingo sabado
janeiro agosto outubro brasil recife manaus natal sertao
`;

export const WORDS = [...new Set(RAW.split(/\s+/).filter((w) => w.length >= 5 && w.length <= 7))];

const LEET: Record<string, string> = { a: '@', o: '0', e: '3', i: '1', s: '$' };
const rnd = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(a: readonly T[]): T => a[rnd(a.length)];
export const shuffle = <T,>(a: T[]): T[] => {
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// Variações que pessoas reais fazem: maiúscula no início, número no fim, troca a->@ etc.
function variant(w: string): string {
  const r = Math.random();
  if (r < 0.5) return w;
  if (r < 0.65) return w[0].toUpperCase() + w.slice(1);
  if (r < 0.85) {
    const room = 7 - w.length;
    if (room <= 0) return w;
    return w + (room >= 2 && Math.random() < 0.5 ? String(10 + rnd(90)) : String(rnd(10)));
  }
  if (r < 0.95) {
    const spots = [...w].map((c, i) => (c in LEET ? i : -1)).filter((i) => i >= 0);
    if (!spots.length) return w;
    const i = pick(spots);
    return w.slice(0, i) + LEET[w[i]] + w.slice(i + 1);
  }
  return w.length < 7 ? w + pick(['!', '#', '*']) : w;
}

// `used` guarda as palavras-base já sorteadas na rodada (evita "gatos" e "Gatos1" juntos).
export function makeBank(n: number, used: Set<string>): string[] {
  const bases = shuffle(WORDS.filter((w) => !used.has(w))).slice(0, n);
  if (bases.length < n) throw new Error('Lista de palavras pequena demais');
  bases.forEach((b) => used.add(b));
  return bases.map(variant);
}

// Troca de um caractere, igual ao que um defensor faz (usada para camuflar a troca real).
export function mutate(w: string): string {
  for (;;) {
    const i = rnd(w.length);
    const c = w[i];
    const r = Math.random();
    const n = r < 0.4 && LEET[c.toLowerCase()] ? LEET[c.toLowerCase()]
      : r < 0.7 && /[a-z]/i.test(c) ? (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase())
      : String.fromCharCode(97 + rnd(26));
    if (n !== c) return w.slice(0, i) + n + w.slice(i + 1);
  }
}
