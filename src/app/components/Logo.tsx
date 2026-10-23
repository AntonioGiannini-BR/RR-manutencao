export function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Circle */}
      <circle cx="50" cy="50" r="48" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
      
      {/* Airplane Body */}
      <path
        d="M50 30 L50 70"
        stroke="#3b82f6"
        strokeWidth="4"
        strokeLinecap="round"
      />
      
      {/* Wings */}
      <path
        d="M25 45 L75 45"
        stroke="#3b82f6"
        strokeWidth="4"
        strokeLinecap="round"
      />
      
      {/* Tail */}
      <path
        d="M40 65 L50 70 L60 65"
        stroke="#3b82f6"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Nose */}
      <circle cx="50" cy="30" r="3" fill="#60a5fa" />
      
      {/* RR Letters */}
      <text
        x="50"
        y="55"
        fontFamily="Arial, sans-serif"
        fontSize="18"
        fontWeight="bold"
        fill="#60a5fa"
        textAnchor="middle"
      >
        RR
      </text>
    </svg>
  );
}
