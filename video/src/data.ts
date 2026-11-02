// Banco de senhas de exemplo (fixo, para o vídeo ser sempre igual).
export const BANK = [
  'cavalo', 'Praia', 'mesas', 'tigre', 'arroz', 'foguete', 'Brasil', 'pente', 'cinema', 'robos',
  'corvo', 'balde', 'lapis5', 'museu', 'tucano', 'quarto', 'zebra', 'festa!', 'piano', 'limao',
  'sapos', 'c@nela', 'dados', 'Tomate', 'banana', 'escola', 'moto12', 'pipoca', 'ondas', 'Fadas',
  'leite', 'ninja', 'porta7', 'oculos', 'gatos', 'porta', 'janela', 'trens', 'pirata', 'cocos1',
  'barco', 'peixe', 'galaxia', 'chuva', 'Coruja', 'raios', 'vento', 'pastel', 'samba', 'heroi',
  'bolas', 'cubo#', 'flores', 'navio', 'domingo', 'mapas', 'amigo', 'Pedra', 'hotel', 'lagoa',
  'camisa', 'sonho', 'pato12', 'verao', 'patins', 'tesouro', 'magia', 'ilhas', 'cajus', 'regua',
  'panela', 'leoes9', 'xadrez', 'cartas', 'aviao', 'Coroa', 'frevo', 'pizza', 'corrida', 'livro',
  'escudo', 'garfo', 'teclado', 'surfe', 'molho', 'pinguim', 'Vulcao', 'nuvem', 'raposa', 'dragao',
  'sorvete', 'ponte', 'pombo', 'caneta', 'g@to', 'lontra', 'mouse', 'Fones', 'canoa', 'tapete',
];
export const SECRET = { Bia: 'pirata', Caio: 'gatos', Davi: 'porta7' } as const;
export const hasDigit = (w: string) => /\d/.test(w);
export const hasSym = (w: string) => /[^a-zA-Z0-9à-ú]/.test(w);
