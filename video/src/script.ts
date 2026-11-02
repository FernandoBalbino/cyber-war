// Roteiro da narração. As marcas [excited], [whispers]... dão entonação no ElevenLabs v4.
// `cues`: nome -> trecho do texto; o gerador grava o segundo em que cada trecho é falado,
// e as cenas usam isso para animar exatamente na palavra. "a|b" aceita qualquer das formas.
export type Scene = { id: string; text: string; cues: Record<string, string> };

export const SCENES: Scene[] = [
  {
    id: 's1',
    text: '[excited] Atenção, agentes! Bem-vindos ao CYBER WAR! Hoje, esta sala vira uma central de operações... e a arma mais importante aqui dentro... [whispers] é a senha.',
    cues: { title: 'CYBER', ops: 'central', weapon: 'arma', pw: 'senha' },
  },
  {
    id: 's2',
    text: 'A turma vai ser dividida em duas equipes. De um lado, os Defensores: a equipe azul. A missão deles é proteger as próprias senhas. Do outro lado, os Invasores: a equipe vermelha. Eles querem descobrir essas senhas. [excited] Quem será que vence?',
    cues: { split: 'duas', def: 'Defensores', inv: 'Invasores', vs: 'Quem' },
  },
  {
    id: 's3',
    text: 'Quando a partida começa, o sistema cria um banco com cem senhas. São palavras simples, do dia a dia: gatos, porta, janela... algumas com um número ou um símbolo no final. Cada defensor recebe uma dessas senhas, em segredo. [whispers] A senha dele fica escondida no meio das outras. E ninguém sabe qual é de quem.',
    cues: { bank: 'banco|cem senhas|100', words: 'gatos', extra: 'algumas', secret: 'Cada', hide: 'escondida', who: 'ninguém' },
  },
  {
    id: 's4',
    text: 'Os invasores enxergam o banco inteiro. Para atacar é simples: escolhe um defensor... escolhe uma senha... e ataca! Mas atenção: cada invasor só pode tentar uma vez por minuto. Errou? A senha fica riscada só para aquele defensor, e ninguém da equipe perde tempo com ela de novo. Acertou? [excited] A tela de todo mundo mostra: DEFENSOR DESCOBERTO! E o invasor ganha cem pontos.',
    cues: { see: 'enxergam', pickDef: 'escolhe um defensor', pickPw: 'escolhe uma senha', attack: 'e ataca', minute: 'minuto', miss: 'Errou', team: 'ninguém', hit: 'Acertou', vig: 'DEFENSOR', points: 'cem pontos|100' },
  },
  {
    id: 's5',
    text: '[curious] Mas chutar no escuro é difícil, né? Por isso os invasores têm ferramentas de análise. O Comprimento revela quantos caracteres tem a senha do alvo. A Composição conta se ela tem número, letra maiúscula ou símbolo. O Rastrear mostra se o defensor já trocou a senha. E o Expandir banco, que só pode ser usado uma vez por equipe, coloca mais vinte senhas no banco... mas revela uma letra da senha de um defensor. Cada pista apaga as senhas que não combinam. É assim que um atacante de verdade trabalha: analisando, não chutando. E quem ataca seguindo as pistas ganha mais dez pontos.',
    cues: { tools: 'ferramentas', len: 'Comprimento', comp: 'Composição', track: 'Rastrear', expand: 'Expandir', letter: 'revela uma letra', filter: 'Cada pista', analyze: 'analisando', ten: 'dez pontos|10' },
  },
  {
    id: 's6',
    text: 'E os defensores? Eles não ficam parados, não! Sempre que alguém ataca, o defensor recebe um alerta com o nome do invasor... e tem só quatro segundos para bloquear. Bloqueou? [excited] Mais vinte e cinco pontos! Ele também pode trocar uma letra da senha, uma única vez na partida, e bagunçar as pistas dos invasores. Enquanto isso, ele joga a Missão Senha Forte: um labirinto onde pega as peças de uma senha forte... comprimento, maiúscula, número e símbolo... foge das armadilhas de phishing... e abre um baú com um bloqueio extra ou vinte pontos. E de vez em quando aparecem desafios sobre LGPD e segurança. Cada acerto vale quinze pontos.',
    cues: { alert: 'alerta', four: 'quatro segundos|4 segundos', blocked: 'Bloqueou', change: 'trocar uma letra', maze: 'Missão', pieces: 'comprimento,', trap: 'phishing', chest: 'baú', quiz: 'desafios', quizPts: 'quinze|15' },
  },
  {
    id: 's7',
    text: '[excited] E fiquem ligados: a qualquer momento pode acontecer um evento surpresa! Um vazamento de dados... um ataque de força bruta... um firewall ativado... ou um desafio relâmpago para todo mundo.',
    cues: { ev: 'evento', leak: 'vazamento', brute: 'força bruta', fw: 'firewall', quiz: 'desafio' },
  },
  {
    id: 's8',
    text: 'Bora ver uma partida? Valendo! O Leo, da equipe vermelha, usa o Comprimento na Bia: seis caracteres. O banco já fica bem menor. A Malu ataca a Bia com janela... [laughs] errou! Riscada. Agora o Theo tenta de novo... mas a Bia recebe o alerta e bloqueia na hora! Mais vinte e cinco para a equipe azul. Enquanto isso, o Caio troca uma letra: o O de gatos vira um zero. [whispers] As pistas antigas já não servem. Mas o Leo usa a Composição no Davi: tem número. Ele junta as pistas... e ataca com porta sete. [excited] DEFENSOR DESCOBERTO! O Davi caiu, e o Leo ganha cem pontos.',
    cues: { go: 'Valendo', len: 'Comprimento', six: 'seis|6', smaller: 'menor', malu: 'Malu', miss: 'errou', theo: 'Theo|Teo|Téo', block: 'bloqueia', plus: 'vinte e cinco|25', caio: 'Caio', zero: 'zero', old: 'pistas antigas', comp: 'Composição', num: 'tem número', join: 'junta', attack: 'porta sete|porta 7|porta7', hit: 'DEFENSOR', pts: 'cem pontos|100' },
  },
  {
    id: 's9',
    text: 'Quando o tempo acaba, todo defensor que não foi descoberto ganha mais cem pontos. A partida também termina se todos os defensores forem descobertos. Os pontos de cada aluno somam para a sua equipe... e vence a equipe com mais pontos. Depois, as equipes trocam de lado: quem defendeu, agora ataca!',
    cues: { time: 'tempo', survive: 'cem pontos|100', allDown: 'todos', sum: 'somam', win: 'vence', swap: 'trocam' },
  },
  {
    id: 's10',
    text: 'Percebeu? Palavras simples caem rápido. Senha forte é longa, misturada... e só sua. [excited] Agora é com vocês. Preparados? Então... que comece a guerra!',
    cues: { simple: 'Palavras', strong: 'Senha forte', mixed: 'misturada', yours: 'só sua', ready: 'Preparados', go: 'guerra' },
  },
];
