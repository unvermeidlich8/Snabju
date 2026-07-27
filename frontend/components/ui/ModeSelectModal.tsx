'use client';

import { useMode } from '@/providers/ModeProvider';

export function ModeSelectModal() {
  const { modeSelected, setMode } = useMode();

  if (modeSelected) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm bg-white rounded-[24px] p-6" style={{ boxShadow: '0 24px 48px rgba(0,0,0,0.18)' }}>
        <div className="text-center mb-6">
          <div className="text-[22px] font-bold text-ink mb-1.5" style={{ letterSpacing: '-0.5px' }}>Как планируете покупать?</div>
          <div className="text-sm text-muted">Выберите тип покупателя — это определит цены и условия</div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setMode('b2c')}
            className="w-full text-left rounded-[16px] p-4 border-2 cursor-pointer transition-colors"
            style={{ borderColor: '#e7e3da', background: '#faf9f7' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[12px] grid place-items-center shrink-0" style={{ background: '#fff3e0' }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="7" r="3.5" stroke="#ff6a13" strokeWidth="1.6"/>
                  <path d="M4 19c0-3.866 3.134-7 7-7h0c3.866 0 7 3.134 7 7" stroke="#ff6a13" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div className="text-[15px] font-bold text-ink">Физическое лицо</div>
                <div className="text-xs text-muted mt-0.5">Розничные цены, оплата картой</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode('b2b')}
            className="w-full text-left rounded-[16px] p-4 border-2 cursor-pointer"
            style={{ borderColor: '#1a1a1a', background: '#1a1a1a' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[12px] grid place-items-center shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="3" y="9" width="16" height="11" rx="1.5" stroke="white" strokeWidth="1.6"/>
                  <path d="M8 9V7a3 3 0 016 0v2" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M3 13h16" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div className="text-[15px] font-bold text-white">Юридическое лицо / ИП</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Оптовые цены −15%, счёт на организацию</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
