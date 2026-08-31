import React from 'react';

interface VerdictLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export const VerdictLogo: React.FC<VerdictLogoProps> = ({
  size = 24,
  className = '',
  glow = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        filter: glow ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' : undefined,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="verdictShieldGradConsole" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="verdictInnerGradConsole" x1="16" y1="7" x2="16" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {/* Outer Shield Contour */}
      <path
        d="M16 2.5L27 6.5V14.5C27 21.8 22.3 27.8 16 29.5C9.7 27.8 5 21.8 5 14.5V6.5L16 2.5Z"
        fill="#0b1322"
        stroke="url(#verdictShieldGradConsole)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* High-Contrast Bold V-Emblem */}
      <path
        d="M11 10.5L16 21L21 10.5H18.2L16 16.2L13.8 10.5H11Z"
        fill="url(#verdictInnerGradConsole)"
      />

      {/* Apex Core Highlight */}
      <circle cx="16" cy="7.5" r="1.5" fill="#34d399" />
    </svg>
  );
};
