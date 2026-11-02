import { ThreeCanvas } from '@remotion/three';
import { RoundedBox } from '@react-three/drei';
import { random, useCurrentFrame, useVideoConfig } from 'remotion';

// Cadeado 3D com partículas de dados em volta. Tudo animado pelo quadro (sem useFrame).
const DOTS = Array.from({ length: 70 }, (_, i) => {
  const a = random(`a${i}`) * Math.PI * 2, r = 3.2 + random(`r${i}`) * 3.5, y = (random(`y${i}`) - 0.5) * 6;
  return { x: Math.cos(a) * r, y, z: Math.sin(a) * r - 1.5, s: 0.05 + random(`s${i}`) * 0.12, red: i % 3 === 0 };
});
const STEEL = { color: '#e8eef9', metalness: 0.55, roughness: 0.22 };

export function Lock3D({ open = 0, spin = 0, x = 0, y = 0, scale = 1, red = 0 }: { open?: number; spin?: number; x?: number; y?: number; scale?: number; red?: number }) {
  const { width, height } = useVideoConfig();
  const f = useCurrentFrame();
  const body = red > 0.5 ? '#d61f45' : '#1f6fff';
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 9], fov: 38 }} style={{ position: 'absolute', inset: 0 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 6]} intensity={2.4} />
      <pointLight position={[-5, 1, 4]} color="#3ba7ff" intensity={60} />
      <pointLight position={[5, -2, 4]} color="#ff3b5c" intensity={60} />
      <group rotation={[0, f * 0.004, 0]}>
        {DOTS.map((d, i) => (
          <mesh key={i} position={[d.x, d.y + Math.sin(f / 30 + i) * 0.15, d.z]} rotation={[f * 0.02 + i, f * 0.015, 0]}>
            <boxGeometry args={[d.s, d.s, d.s]} />
            <meshStandardMaterial color={d.red ? '#ff3b5c' : '#3ba7ff'} emissive={d.red ? '#ff3b5c' : '#3ba7ff'} emissiveIntensity={0.9} />
          </mesh>
        ))}
      </group>
      <group position={[x, y - 0.4, 0]} rotation={[0.18, spin, 0]} scale={scale}>
        <RoundedBox args={[2.6, 2.1, 1]} radius={0.24} smoothness={6}>
          <meshStandardMaterial color={body} metalness={0.65} roughness={0.25} emissive={body} emissiveIntensity={0.25} />
        </RoundedBox>
        <mesh position={[0, 0.18, 0.51]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 32]} />
          <meshStandardMaterial color="#061022" />
        </mesh>
        <mesh position={[0, -0.22, 0.51]}>
          <boxGeometry args={[0.14, 0.5, 0.04]} />
          <meshStandardMaterial color="#061022" />
        </mesh>
        <group position={[0, 1.05 + open * 0.7, 0]} rotation={[0, open * 0.5, 0]}>
          <mesh>
            <torusGeometry args={[0.8, 0.17, 24, 64, Math.PI]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          <mesh position={[-0.8, -0.4, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.8, 24]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          <mesh position={[0.8, -0.4, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.8, 24]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
        </group>
      </group>
    </ThreeCanvas>
  );
}
