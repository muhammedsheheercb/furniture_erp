import { cn } from "@/lib/utils";

const variants = {
  cash: "bg-green-100 text-green-800",
  credit: "bg-amber-100 text-amber-800",
  debit: "bg-blue-100  text-blue-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100   text-red-800",
  info: "bg-indigo-100 text-indigo-800",
  default: "bg-gray-100  text-gray-700",
};

interface BadgeProps {
  label?: string;
  children?: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}

export function Badge({
  label,
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
        variants[variant],
        className,
      )}
    >
      {children || label}
    </span>
  );
}

export default Badge;
