import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  fullPage?: boolean;
}

const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };

export default function Spinner({
  size = "md",
  className,
  fullPage,
}: SpinnerProps) {
  const spinner = (
    <svg
      className={cn("animate-spin text-indigo-600", sizes[size], className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      />
    </svg>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/70 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
