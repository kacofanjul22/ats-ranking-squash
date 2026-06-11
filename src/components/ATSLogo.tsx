interface LogoProps {
  size?: number;
  className?: string;
}

export function ATSLogo({ size = 44, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={Math.round(size * 106 / 90)}
      viewBox="0 0 90 106"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield background */}
      <path
        d="M4 4 H86 V68 Q86 100 45 102 Q4 100 4 68 Z"
        fill="#161616"
        stroke="#E8521A"
        strokeWidth="3.5"
      />
      {/* Cross horizontal */}
      <rect x="4" y="40" width="82" height="16" fill="#E8521A" />
      {/* Cross vertical */}
      <rect x="39" y="4" width="12" height="96" fill="#E8521A" />
      {/* A letter */}
      <text
        x="14"
        y="82"
        fontFamily="Arial Black, sans-serif"
        fontWeight="900"
        fontSize="28"
        fill="#f2ede8"
      >
        A
      </text>
      {/* S letter */}
      <text
        x="56"
        y="82"
        fontFamily="Arial Black, sans-serif"
        fontWeight="900"
        fontSize="28"
        fill="#f2ede8"
      >
        S
      </text>
      {/* Player figure */}
      <circle cx="54" cy="14" r="4" fill="#f2ede8" />
      <line x1="54" y1="18" x2="50" y2="30" stroke="#f2ede8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="30" x2="43" y2="38" stroke="#f2ede8" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="30" x2="58" y2="38" stroke="#f2ede8" strokeWidth="2" strokeLinecap="round" />
      <line x1="54" y1="18" x2="64" y2="22" stroke="#f2ede8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="30" cy="18" r="3" fill="#f2ede8" />
    </svg>
  );
}
