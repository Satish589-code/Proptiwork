interface Props {
  score: number;
}

export default function ScoreRing({ score }: Props) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const trackColor = "hsl(var(--border))";
  const textColor = "hsl(var(--foreground))";
  const color =
    score >= 70
      ? "hsl(var(--success))"
      : score >= 40
      ? "hsl(var(--warning))"
      : "hsl(var(--destructive))";

  return (
    <svg width="120" height="120">
      <circle
        cx="60"
        cy="60"
        r={radius}
        stroke={trackColor}
        strokeWidth="10"
        fill="transparent"
      />
      <circle
        cx="60"
        cy="60"
        r={radius}
        stroke={color}
        strokeWidth="10"
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        fill={textColor}
        fontSize="20"
        fontWeight="bold"
      >
        {score}%
      </text>
    </svg>
  );
}
