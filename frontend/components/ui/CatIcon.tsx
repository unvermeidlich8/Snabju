interface CatIconProps {
  kind: string;
  color?: string;
  size?: number;
}

export function CatIcon({ kind, color = '#1a1a1a', size = 22 }: CatIconProps) {
  const s = { stroke: color, strokeWidth: 1.6, fill: 'none' as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (kind) {
    case 'wool': return (
      <svg width={size} height={size} viewBox="0 0 22 22">
        <path d="M3 7c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" {...s}/>
        <path d="M3 12c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" {...s}/>
        <path d="M3 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" {...s}/>
      </svg>
    );
    case 'block': return (
      <svg width={size} height={size} viewBox="0 0 22 22">
        <rect x="3" y="4" width="16" height="14" rx="1.5" {...s}/>
        <path d="M3 11h16M11 4v14" {...s}/>
      </svg>
    );
    case 'xps': return (
      <svg width={size} height={size} viewBox="0 0 22 22">
        <rect x="3" y="6" width="16" height="10" rx="1" {...s}/>
        <path d="M3 9h16M3 13h16" {...s}/>
      </svg>
    );
    case 'can': return (
      <svg width={size} height={size} viewBox="0 0 22 22">
        <rect x="6" y="6" width="10" height="14" rx="1.5" {...s}/>
        <rect x="9" y="2" width="4" height="4" rx="0.7" {...s}/>
        <path d="M9 11h4" {...s}/>
      </svg>
    );
    case 'tube': return (
      <svg width={size} height={size} viewBox="0 0 22 22">
        <path d="M5 8h12v10a2 2 0 01-2 2H7a2 2 0 01-2-2V8z" {...s}/>
        <path d="M9 8V4h4v4M11 4l3-2" {...s}/>
      </svg>
    );
    case 'roll': return (
      <svg width={size} height={size} viewBox="0 0 22 22">
        <ellipse cx="11" cy="7" rx="7" ry="3" {...s}/>
        <path d="M4 7v8c0 1.7 3.1 3 7 3s7-1.3 7-3V7" {...s}/>
      </svg>
    );
    case 'sheet': return (
      <svg width={size} height={size} viewBox="0 0 22 22">
        <path d="M4 5l14-1v15L4 20z" {...s}/>
        <path d="M4 10l14-1M4 15l14-1" {...s}/>
      </svg>
    );
    case 'tool': return (
      <svg width={size} height={size} viewBox="0 0 22 22">
        <path d="M14 3l5 5-3 3-5-5zM11 6l-7 7v5h5l7-7" {...s}/>
      </svg>
    );
    default: return null;
  }
}
