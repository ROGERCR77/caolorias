import { cn } from "@/lib/utils";

interface ScaleIconProps {
  className?: string;
}

export const ScaleIcon = ({ className }: ScaleIconProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("w-8 h-8", className)}
  >
    <rect x="10" y="38" width="44" height="16" rx="4" className="fill-primary" />
    <rect x="14" y="42" width="36" height="8" rx="2" className="fill-primary-light" />
    <rect x="26" y="44" width="12" height="4" rx="1" className="fill-primary" />
    <ellipse cx="32" cy="32" rx="16" ry="10" className="fill-accent-light" />
    <ellipse cx="32" cy="30" rx="14" ry="8" className="fill-card" />
    <path
      d="M24 28h16M32 24v8"
      className="stroke-primary"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
