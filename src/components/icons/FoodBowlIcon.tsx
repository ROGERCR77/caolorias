import { cn } from "@/lib/utils";

interface FoodBowlIconProps {
  className?: string;
}

export const FoodBowlIcon = ({ className }: FoodBowlIconProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("w-8 h-8", className)}
  >
    <ellipse cx="32" cy="40" rx="24" ry="10" className="fill-accent" />
    <ellipse cx="32" cy="36" rx="20" ry="8" className="fill-accent-light" />
    <path
      d="M14 36c0-4 8-8 18-8s18 4 18 8"
      className="stroke-accent-dark"
      strokeWidth="2"
    />
    <circle cx="24" cy="34" r="3" className="fill-primary" />
    <circle cx="34" cy="32" r="2.5" className="fill-primary" />
    <circle cx="40" cy="35" r="2" className="fill-primary" />
    <circle cx="28" cy="38" r="2" className="fill-primary/80" />
  </svg>
);
