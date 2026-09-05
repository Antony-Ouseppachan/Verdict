import React from 'react';

interface VerdictLogoProps {
  size?: number;
  className?: string;
  showGlow?: boolean;
}

export const VerdictLogo: React.FC<VerdictLogoProps> = ({
  size = 32,
  className = '',
  showGlow = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="verdictGreenGrad" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="verdictVGrad" x1="16" y1="7" x2="16" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        {showGlow && (
          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>

      {/* Outer Shield Outline */}
      <path
        d="M16 2.5L27 6.5V14.5C27 21.8 22.3 27.8 16 29.5C9.7 27.8 5 21.8 5 14.5V6.5L16 2.5Z"
        fill="#04080D"
        stroke="url(#verdictGreenGrad)"
        strokeWidth="2.2"
        strokeLinejoin="round"
        filter={showGlow ? 'url(#logoGlow)' : undefined}
      />

      {/* Top Dot Above V */}
      <circle
        cx="16"
        cy="7.8"
        r="1.8"
        fill="#34D399"
      />

      {/* Stylized V Logo Mark */}
      <path
        d="M10.5 11.2L16 22.2L21.5 11.2H18.4L16 16.8L13.6 11.2H10.5Z"
        fill="url(#verdictVGrad)"
      />
    </svg>
  );
};
