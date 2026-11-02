import { createRoot } from 'react-dom/client';
import './styles.css';

// /slide abre só a apresentação (sem conectar no servidor do jogo, para não gastar o Render).
const root = createRoot(document.getElementById('root')!);
if (/\/slide\/?$/.test(location.pathname) || location.hash === '#slide') {
  import('./Slides.tsx').then(({ Slides }) => root.render(<Slides />));
} else {
  import('./App.tsx').then(({ App }) => root.render(<App />));
}
