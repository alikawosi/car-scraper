import React from 'react';

export const Logo = ({ className, size = 32 }: { className?: string; size?: number }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="motovotive-arrow-gradient-react" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#151414" />
            <stop offset="60%" stopColor="#D1D1D1" />
            <stop offset="100%" stopColor="#D1D1D1" stopOpacity="0" />
        </linearGradient>

        <pattern
          id="motovotive-white-dot-pattern-react"
          x="0"
          y="0"
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="6" cy="6" r="3" fill="white" />
        </pattern>
        
        <mask id="motovotive-dotted-arrow-mask-react">
          <path d="M 30 40 H 70 L 150 120 L 70 200 H 30 L 110 120 Z" fill="url(#motovotive-white-dot-pattern-react)" />
        </mask>
      </defs>

      <rect
        x="0"
        y="0"
        width="240"
        height="240"
        fill="url(#motovotive-arrow-gradient-react)"
        mask="url(#motovotive-dotted-arrow-mask-react)"
      />

      <path
        d="M 90 40 H 130 L 210 120 L 130 200 H 90 L 170 120 Z"
        fill="#EF4444"
      />
    </svg>
  );
};
