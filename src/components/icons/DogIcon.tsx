import { cn } from "@/lib/utils";

interface DogIconProps {
  className?: string;
}

export const DogIcon = ({ className }: DogIconProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("w-8 h-8", className)}
  >
    <circle cx="32" cy="32" r="28" className="fill-primary/10" />
    <path
      d="M20 22c-2 0-4 1-4 4v6c0 2 1 3 3 3h2v12c0 2 2 4 4 4h14c2 0 4-2 4-4V35h2c2 0 3-1 3-3v-6c0-3-2-4-4-4h-4l-2-4c-1-2-3-3-6-3s-5 1-6 3l-2 4h-4z"
      className="fill-primary"
    />
    <circle cx="26" cy="28" r="2" className="fill-primary-foreground" />
    <circle cx="38" cy="28" r="2" className="fill-primary-foreground" />
    <ellipse cx="32" cy="34" rx="3" ry="2" className="fill-accent" />
    <path
      d="M29 38c0 0 1.5 2 3 2s3-2 3-2"
      className="stroke-primary-foreground"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);
