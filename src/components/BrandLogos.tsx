import React from 'react';

interface BrandBadgeProps {
  brand: string;
  className?: string;
  size?: number;
}

export const BrandBadge: React.FC<BrandBadgeProps> = ({ brand, className = '', size = 38 }) => {
  const norm = brand.trim().toUpperCase();

  switch (norm) {
    case 'KMC':
      return (
        <div
          className={`flex items-center justify-center rounded-lg bg-neutral-900 border border-amber-500/30 p-1 shadow-sm ${className}`}
          style={{ width: size, height: size }}
          title="KMC - Kerman Motor"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full text-amber-400">
            <defs>
              <linearGradient id="kmcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
            <rect x="5" y="15" width="90" height="70" rx="14" fill="#18181b" stroke="url(#kmcGrad)" strokeWidth="4" />
            <text x="50" y="58" fill="url(#kmcGrad)" fontSize="26" fontWeight="900" textAnchor="middle" letterSpacing="1" fontFamily="sans-serif">
              KMC
            </text>
          </svg>
        </div>
      );

    case 'XTRIM':
      return (
        <div
          className={`flex items-center justify-center rounded-lg bg-slate-950 border border-red-500/40 p-1 shadow-sm ${className}`}
          style={{ width: size, height: size }}
          title="XTRIM (Exeed)"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="xtrimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#b91c1c" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="#09090b" stroke="url(#xtrimGrad)" strokeWidth="4" />
            <path d="M28 32 L72 68 M72 32 L28 68" stroke="url(#xtrimGrad)" strokeWidth="9" strokeLinecap="round" />
            <circle cx="50" cy="50" r="10" fill="#ffffff" />
          </svg>
        </div>
      );

    case 'CHERY':
      return (
        <div
          className={`flex items-center justify-center rounded-lg bg-neutral-900 border border-rose-500/30 p-1 shadow-sm ${className}`}
          style={{ width: size, height: size }}
          title="Chery"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <ellipse cx="50" cy="50" rx="44" ry="34" fill="none" stroke="#e11d48" strokeWidth="6" />
            <path d="M30 62 L50 26 L70 62" fill="none" stroke="#f43f5e" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="38" y1="50" x2="62" y2="50" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'MVM':
      return (
        <div
          className={`flex items-center justify-center rounded-lg bg-neutral-900 border border-blue-500/30 p-1 shadow-sm ${className}`}
          style={{ width: size, height: size }}
          title="MVM (Modiran Khodro)"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect x="6" y="20" width="88" height="60" rx="12" fill="#0f172a" stroke="#3b82f6" strokeWidth="4" />
            <text x="50" y="58" fill="#60a5fa" fontSize="23" fontWeight="900" textAnchor="middle" letterSpacing="1" fontFamily="sans-serif">
              MVM
            </text>
          </svg>
        </div>
      );

    case 'SUZUKI':
      return (
        <div
          className={`flex items-center justify-center rounded-lg bg-neutral-900 border border-red-600/40 p-1 shadow-sm ${className}`}
          style={{ width: size, height: size }}
          title="Suzuki"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect x="8" y="8" width="84" height="84" rx="14" fill="#18181b" stroke="#dc2626" strokeWidth="3" />
            <path
              d="M74 24 L26 24 L26 44 L60 52 L26 58 L26 76 L74 76 L74 56 L40 48 L74 42 Z"
              fill="#ef4444"
            />
          </svg>
        </div>
      );

    case 'HAVAL':
      return (
        <div
          className={`flex items-center justify-center rounded-lg bg-neutral-900 border border-zinc-500/40 p-1 shadow-sm ${className}`}
          style={{ width: size, height: size }}
          title="Haval - Great Wall Motors"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect x="4" y="24" width="92" height="52" rx="8" fill="#1c1917" stroke="#e2e8f0" strokeWidth="3" />
            <text x="50" y="58" fill="#ffffff" fontSize="18" fontWeight="900" textAnchor="middle" letterSpacing="1" fontFamily="sans-serif">
              HAVAL
            </text>
          </svg>
        </div>
      );

    case 'VOYA':
    case 'VOYAH':
      return (
        <div
          className={`flex items-center justify-center rounded-lg bg-neutral-900 border border-cyan-500/40 p-1 shadow-sm ${className}`}
          style={{ width: size, height: size }}
          title="Voyah Luxury EV"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="42" fill="#0c4a6e" fillOpacity="0.3" stroke="#06b6d4" strokeWidth="3" />
            <path d="M26 36 L50 72 L74 36 L62 36 L50 56 L38 36 Z" fill="#22d3ee" />
            <circle cx="50" cy="32" r="5" fill="#a5f3fc" />
          </svg>
        </div>
      );

    case 'LUCANO':
      return (
        <div
          className={`flex items-center justify-center rounded-lg bg-neutral-900 border border-emerald-500/40 p-1 shadow-sm ${className}`}
          style={{ width: size, height: size }}
          title="Lucano (Jaecoo)"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect x="6" y="20" width="88" height="60" rx="10" fill="#064e3b" fillOpacity="0.4" stroke="#10b981" strokeWidth="3" />
            <text x="50" y="58" fill="#34d399" fontSize="17" fontWeight="900" textAnchor="middle" letterSpacing="1" fontFamily="sans-serif">
              LUCANO
            </text>
          </svg>
        </div>
      );

    default:
      return (
        <div
          className={`flex items-center justify-center rounded-lg bg-neutral-900 border border-neutral-700 text-white font-bold text-xs p-1 ${className}`}
          style={{ width: size, height: size }}
        >
          {brand}
        </div>
      );
  }
};
