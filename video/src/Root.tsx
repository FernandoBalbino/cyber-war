import { Composition } from 'remotion';
import { CyberWarVideo } from './Video';
import { FPS, TOTAL } from './timing';

export const RemotionRoot: React.FC = () => (
  <Composition id="CyberWar" component={CyberWarVideo} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
);
