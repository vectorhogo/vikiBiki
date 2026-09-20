import React from 'react';
import { CarItem } from '../data/cars';

interface CarRenderProps {
  car: CarItem;
  width?: number;
  height?: number;
  className?: string;
  showHoverCard?: boolean;
}

export const CarRender: React.FC<CarRenderProps> = ({
  car,
  width = 84, // fits 70-90px rule
  height = 56, // fits 50-70px rule
  className = '',
}) => {
  // If a custom image was uploaded/selected, display it cleanly
  if (car.customImageUrl) {
    return (
      <div
        className={`relative flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110 ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <img
          src={car.customImageUrl}
          alt={car.car_model}
          className="max-w-full max-h-full object-contain filter drop-shadow-md"
        />
      </div>
    );
  }

  // Color palletes for rendering
  const isWhite = car.color === 'white';
  const isGray = car.color === 'gray';
  const isTwoTone = car.color === 'black_white';

  const bodyGradientId = `body-grad-${car.row}`;
  const glassGradientId = `glass-grad-${car.row}`;
  const rimGradientId = `rim-grad-${car.row}`;

  // Body primary color values
  let bodyStart = '#18181b';
  let bodyMid = '#27272a';
  let bodyEnd = '#09090b';
  let highlightColor = 'rgba(255,255,255,0.3)';

  if (isWhite) {
    bodyStart = '#ffffff';
    bodyMid = '#f1f5f9';
    bodyEnd = '#cbd5e1';
    highlightColor = 'rgba(255,255,255,0.9)';
  } else if (isGray) {
    bodyStart = '#64748b';
    bodyMid = '#475569';
    bodyEnd = '#334155';
    highlightColor = 'rgba(255,255,255,0.4)';
  } else if (isTwoTone) {
    // Two tone: White lower body, Black roof and accents
    bodyStart = '#f8fafc';
    bodyMid = '#e2e8f0';
    bodyEnd = '#cbd5e1';
    highlightColor = 'rgba(255,255,255,0.7)';
  }

  // Front 3/4 perspective facing right (as specifically requested in prompt:
  // "Front 3/4 view, facing slightly right")
  return (
    <div
      className={`relative flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110 select-none group cursor-pointer ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
      title={`${car.car_name_fa} (${car.car_model}) - ${car.color_fa}`}
    >
      {/* Subtle floor contact shadow for realistic 3D presence */}
      <div className="absolute -bottom-1 w-[86%] h-[8px] bg-black/35 rounded-[50%] blur-[2px] pointer-events-none" />

      <svg
        viewBox="0 0 160 100"
        className="w-full h-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={bodyGradientId} x1="0%" y1="20%" x2="100%" y2="80%">
            <stop offset="0%" stopColor={bodyStart} />
            <stop offset="45%" stopColor={bodyMid} />
            <stop offset="100%" stopColor={bodyEnd} />
          </linearGradient>

          <linearGradient id={glassGradientId} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id={rimGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Headlight glow */}
          <radialGradient id={`glow-${car.row}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* VEHICLE BODY TYPES BASED ON SPEC */}
        {car.type === 'pickup' && (
          <g transform="translate(4, 8)">
            {/* Pickup Bed & Cabin (KMC SR6 & MVM Kaloot) */}
            {isTwoTone ? (
              // Two-tone roof
              <path
                d="M48 24 L82 22 L112 36 L112 50 L48 50 Z"
                fill="#18181b"
              />
            ) : null}

            {/* Main body shell facing right in 3/4 view */}
            <path
              d="M12 56 L16 42 L48 42 L64 22 L106 20 L132 40 L150 44 L152 64 L138 70 L24 70 Z"
              fill={`url(#${bodyGradientId})`}
              stroke={isWhite ? '#94a3b8' : '#27272a'}
              strokeWidth="1.5"
            />

            {/* Pickup open bed line */}
            <path d="M16 42 L48 42 L48 58 L14 58 Z" fill="#0f172a" fillOpacity="0.7" />
            {car.row === 8 && (
              // Kaloot Roll Bar
              <path d="M46 40 L52 24 L60 24 L56 40" stroke="#94a3b8" strokeWidth="2.5" fill="none" />
            )}

            {/* Windshield & Side Windows */}
            <path
              d="M66 25 L102 24 L126 39 L92 41 Z"
              fill={`url(#${glassGradientId})`}
              stroke="#0f172a"
              strokeWidth="1"
            />
            {/* Window pillars */}
            <line x1="90" y1="24" x2="88" y2="41" stroke={bodyMid} strokeWidth="2.5" />

            {/* Front Headlight (facing right 3/4) */}
            <path
              d="M136 44 L148 45 L150 54 L138 52 Z"
              fill={`url(#glow-${car.row})`}
              stroke="#93c5fd"
              strokeWidth="1"
            />
            {/* Grille */}
            <path d="M142 54 L152 54 L150 64 L140 64 Z" fill="#09090b" stroke="#3f3f46" strokeWidth="1" />
            <line x1="142" y1="58" x2="151" y2="58" stroke="#71717a" strokeWidth="1.5" />

            {/* Body Character Lines */}
            <path d="M48 50 L144 48" stroke={highlightColor} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M20 62 L136 62" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />

            {/* Front Wheel (right side) */}
            <g transform="translate(122, 62)">
              <circle cx="0" cy="0" r="14" fill="#09090b" />
              <circle cx="0" cy="0" r="10" fill={`url(#${rimGradientId})`} />
              <circle cx="0" cy="0" r="4" fill="#0f172a" />
              <line x1="-8" y1="0" x2="8" y2="0" stroke="#e2e8f0" strokeWidth="1.5" />
              <line x1="0" y1="-8" x2="0" y2="8" stroke="#e2e8f0" strokeWidth="1.5" />
            </g>

            {/* Rear Wheel (left side) */}
            <g transform="translate(34, 62)">
              <circle cx="0" cy="0" r="14" fill="#09090b" />
              <circle cx="0" cy="0" r="10" fill={`url(#${rimGradientId})`} />
              <circle cx="0" cy="0" r="4" fill="#0f172a" />
              <line x1="-8" y1="0" x2="8" y2="0" stroke="#e2e8f0" strokeWidth="1.5" />
              <line x1="0" y1="-8" x2="0" y2="8" stroke="#e2e8f0" strokeWidth="1.5" />
            </g>
          </g>
        )}

        {car.type === 'sedan' && (
          <g transform="translate(6, 10)">
            {/* Sleek Aerodynamic Sedan (Arrizo 6 GT / Arrizo 5) */}
            <path
              d="M10 58 L20 46 L46 44 L72 26 L108 26 L130 42 L148 46 L150 62 L136 66 L22 66 Z"
              fill={`url(#${bodyGradientId})`}
              stroke={isWhite ? '#94a3b8' : '#27272a'}
              strokeWidth="1.5"
            />

            {/* Sleek coupe greenhouse */}
            <path
              d="M50 42 L74 29 L104 29 L124 41 L88 42 Z"
              fill={`url(#${glassGradientId})`}
              stroke="#0f172a"
              strokeWidth="1"
            />
            <line x1="86" y1="28" x2="84" y2="42" stroke={bodyMid} strokeWidth="2.5" />

            {/* GT Sport Grille & Aerokit for Arrizo 6 GT */}
            {car.row === 4 && (
              <g>
                <path d="M136 50 L149 48 L148 62 L134 60 Z" fill="#000000" stroke="#ef4444" strokeWidth="0.8" />
                <line x1="140" y1="53" x2="148" y2="53" stroke="#ef4444" strokeWidth="1" />
                <path d="M12 46 L8 44 L8 40 L16 42 Z" fill="#000000" /> {/* Rear ducktail spoiler */}
              </g>
            )}

            {/* Sharp Headlight */}
            <path
              d="M132 45 L148 47 L147 52 L134 50 Z"
              fill={`url(#glow-${car.row})`}
              stroke="#60a5fa"
              strokeWidth="1"
            />

            {/* Sleek light highlight line along shoulder */}
            <path d="M24 46 L144 47" stroke={highlightColor} strokeWidth="1.5" strokeLinecap="round" />

            {/* Front Wheel */}
            <g transform="translate(120, 60)">
              <circle cx="0" cy="0" r="13" fill="#09090b" />
              <circle cx="0" cy="0" r="9" fill={`url(#${rimGradientId})`} />
              <circle cx="0" cy="0" r="3.5" fill="#0f172a" />
              <circle cx="0" cy="0" r="7" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,2" fill="none" />
            </g>

            {/* Rear Wheel */}
            <g transform="translate(36, 60)">
              <circle cx="0" cy="0" r="13" fill="#09090b" />
              <circle cx="0" cy="0" r="9" fill={`url(#${rimGradientId})`} />
              <circle cx="0" cy="0" r="3.5" fill="#0f172a" />
              <circle cx="0" cy="0" r="7" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,2" fill="none" />
            </g>
          </g>
        )}

        {car.type === 'offroad' && (
          <g transform="translate(6, 6)">
            {/* Boxy iconic Suzuki Jimny 5-Door */}
            <path
              d="M12 60 L14 30 L40 28 L98 28 L130 32 L144 46 L146 64 L134 68 L24 68 Z"
              fill={`url(#${bodyGradientId})`}
              stroke={isWhite ? '#94a3b8' : '#27272a'}
              strokeWidth="1.5"
            />

            {/* Upright boxy windows */}
            <rect x="22" y="32" width="24" height="15" rx="2" fill={`url(#glassGradientId})`} />
            <rect x="50" y="32" width="26" height="15" rx="2" fill={`url(#glassGradientId})`} />
            <path d="M80 32 L112 32 L124 43 L80 43 Z" fill={`url(#glassGradientId})`} />

            {/* Round Jimny Headlight */}
            <circle cx="138" cy="50" r="6" fill={`url(#glow-${car.row})`} stroke="#fef08a" strokeWidth="1.5" />

            {/* Slotted Jeep/Jimny 5-slot Grille */}
            <rect x="130" y="46" width="14" height="16" fill="#18181b" rx="2" />
            <line x1="133" y1="48" x2="133" y2="58" stroke="#71717a" strokeWidth="1.5" />
            <line x1="137" y1="48" x2="137" y2="58" stroke="#71717a" strokeWidth="1.5" />
            <line x1="141" y1="48" x2="141" y2="58" stroke="#71717a" strokeWidth="1.5" />

            {/* Rear spare tire mount */}
            <path d="M8 38 Q4 48 8 58" stroke="#09090b" strokeWidth="5" fill="none" strokeLinecap="round" />

            {/* High clearance off-road wheels */}
            <g transform="translate(122, 64)">
              <circle cx="0" cy="0" r="15" fill="#09090b" />
              <circle cx="0" cy="0" r="10" fill={`url(#${rimGradientId})`} />
              <circle cx="0" cy="0" r="4" fill="#0f172a" />
              <path d="M-6 -6 L6 6 M-6 6 L6 -6" stroke="#ffffff" strokeWidth="1.5" />
            </g>

            <g transform="translate(36, 64)">
              <circle cx="0" cy="0" r="15" fill="#09090b" />
              <circle cx="0" cy="0" r="10" fill={`url(#${rimGradientId})`} />
              <circle cx="0" cy="0" r="4" fill="#0f172a" />
              <path d="M-6 -6 L6 6 M-6 6 L6 -6" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          </g>
        )}

        {car.type === 'suv' && (
          <g transform="translate(6, 8)">
            {/* Modern Premium SUV (Extrim VX, Tiggo 8/7, Haval H9, Voyah Free, Lucano L8, Vitara) */}
            <path
              d="M10 60 L14 40 L34 38 L60 22 L112 22 L136 38 L150 44 L152 64 L138 68 L22 68 Z"
              fill={`url(#${bodyGradientId})`}
              stroke={isWhite ? '#94a3b8' : '#27272a'}
              strokeWidth="1.5"
            />

            {/* Roof rails */}
            <path d="M58 20 L114 20" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />

            {/* SUV Glass House */}
            <path
              d="M36 36 L62 25 L108 25 L130 38 L88 39 Z"
              fill={`url(#glassGradientId})`}
              stroke="#0f172a"
              strokeWidth="1"
            />
            {/* Pillars */}
            <line x1="86" y1="24" x2="84" y2="39" stroke={bodyMid} strokeWidth="3" />
            <line x1="58" y1="26" x2="52" y2="37" stroke={bodyMid} strokeWidth="2.5" />

            {/* Distinctive Grille by Model */}
            {car.logo === 'XTRIM' ? (
              // High-tech luxury cross grille for Extrim VX
              <g>
                <path d="M140 48 L152 48 L150 63 L138 63 Z" fill="#09090b" stroke="#dc2626" strokeWidth="1" />
                <line x1="140" y1="54" x2="151" y2="54" stroke="#e2e8f0" strokeWidth="1.5" />
                <line x1="141" y1="58" x2="150" y2="58" stroke="#e2e8f0" strokeWidth="1.5" />
              </g>
            ) : car.car_model.includes('Tiggo 8') ? (
              // Diamond matrix grille for Tiggo 8 Pro Max
              <g>
                <path d="M140 46 L152 46 L150 63 L138 63 Z" fill="#09090b" stroke="#3b82f6" strokeWidth="1" />
                <circle cx="145" cy="54" r="1.5" fill="#60a5fa" />
                <circle cx="148" cy="52" r="1.5" fill="#60a5fa" />
                <circle cx="147" cy="58" r="1.5" fill="#60a5fa" />
              </g>
            ) : car.car_model.includes('Haval') ? (
              // Bold horizontal bars for Haval H9
              <g>
                <path d="M138 46 L152 46 L151 64 L137 64 Z" fill="#18181b" stroke="#71717a" strokeWidth="1.5" />
                <line x1="140" y1="50" x2="151" y2="50" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="139" y1="55" x2="150" y2="55" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="138" y1="60" x2="149" y2="60" stroke="#cbd5e1" strokeWidth="1.5" />
              </g>
            ) : car.car_model.includes('Voya') ? (
              // Voyah Free sleek waterfall LED bar
              <g>
                <path d="M138 45 L152 46 L150 60 L138 59 Z" fill="#082f49" stroke="#06b6d4" strokeWidth="1" />
                <line x1="136" y1="45" x2="151" y2="46" stroke="#22d3ee" strokeWidth="2" />
              </g>
            ) : car.car_model.includes('Lucano') ? (
              // Lucano waterfall vertical slats
              <g>
                <path d="M140 46 L152 46 L150 62 L138 62 Z" fill="#064e3b" fillOpacity="0.4" stroke="#10b981" strokeWidth="1" />
                <line x1="143" y1="48" x2="143" y2="60" stroke="#34d399" strokeWidth="1.5" />
                <line x1="147" y1="48" x2="147" y2="60" stroke="#34d399" strokeWidth="1.5" />
              </g>
            ) : (
              // Vitara / Tiggo 7 standard modern grille
              <g>
                <path d="M140 48 L152 48 L150 62 L138 62 Z" fill="#09090b" stroke="#64748b" strokeWidth="1" />
                <line x1="141" y1="54" x2="150" y2="54" stroke="#94a3b8" strokeWidth="1.5" />
              </g>
            )}

            {/* LED Headlights */}
            <path
              d="M134 42 L149 44 L148 50 L136 48 Z"
              fill={`url(#glow-${car.row})`}
              stroke="#93c5fd"
              strokeWidth="1"
            />

            {/* Upper body dynamic reflection */}
            <path d="M22 42 L142 42" stroke={highlightColor} strokeWidth="1.5" strokeLinecap="round" />

            {/* Front Wheel (right side) */}
            <g transform="translate(122, 62)">
              <circle cx="0" cy="0" r="14" fill="#09090b" />
              <circle cx="0" cy="0" r="10" fill={`url(#${rimGradientId})`} />
              <circle cx="0" cy="0" r="4" fill="#0f172a" />
              <line x1="-8" y1="0" x2="8" y2="0" stroke="#e2e8f0" strokeWidth="1.5" />
              <line x1="0" y1="-8" x2="0" y2="8" stroke="#e2e8f0" strokeWidth="1.5" />
              <line x1="-6" y1="-6" x2="6" y2="6" stroke="#94a3b8" strokeWidth="1" />
              <line x1="-6" y1="6" x2="6" y2="-6" stroke="#94a3b8" strokeWidth="1" />
            </g>

            {/* Rear Wheel (left side) */}
            <g transform="translate(36, 62)">
              <circle cx="0" cy="0" r="14" fill="#09090b" />
              <circle cx="0" cy="0" r="10" fill={`url(#${rimGradientId})`} />
              <circle cx="0" cy="0" r="4" fill="#0f172a" />
              <line x1="-8" y1="0" x2="8" y2="0" stroke="#e2e8f0" strokeWidth="1.5" />
              <line x1="0" y1="-8" x2="0" y2="8" stroke="#e2e8f0" strokeWidth="1.5" />
              <line x1="-6" y1="-6" x2="6" y2="6" stroke="#94a3b8" strokeWidth="1" />
              <line x1="-6" y1="6" x2="6" y2="-6" stroke="#94a3b8" strokeWidth="1" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
