import type { ReactNode } from 'react';

interface BtnProps {
  kind?: 'primary' | 'ghost' | 'quiet' | 'outline';
  children: ReactNode;
  onClick?: () => void;
  full?: boolean;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export function Btn({ kind = 'primary', children, onClick, full, icon, size = 'md', type = 'button', disabled }: BtnProps) {
  const h = size === 'lg' ? 'h-[52px]' : size === 'sm' ? 'h-9' : 'h-11';
  const fs = size === 'lg' ? 'text-base' : size === 'sm' ? 'text-[13px]' : 'text-[15px]';
  const px = size === 'lg' ? 'px-[22px]' : size === 'sm' ? 'px-3' : 'px-4';

  const variants = {
    primary: 'bg-ink text-white border-transparent',
    ghost:   'bg-transparent text-ink border-[1.5px] border-ink',
    quiet:   'bg-brand text-ink border-transparent',
    outline: 'bg-white text-ink border border-divider',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl cursor-pointer
        font-semibold font-sans border
        ${h} ${fs} ${px}
        ${full ? 'w-full' : ''}
        ${variants[kind]}
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {icon}{children}
    </button>
  );
}
