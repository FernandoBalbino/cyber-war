// Separado de ui.tsx porque /slide não pode importar net.ts (que conecta no servidor).
export function Logo({ big }: { big?: boolean }) {
  return (
    <div className={`logo ${big ? 'big' : ''}`} aria-label="Cyber War">
      <span className="logo-a">CYBER</span><span className="logo-b">WAR</span>
    </div>
  );
}
