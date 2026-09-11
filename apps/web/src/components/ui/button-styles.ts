export type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "btn-shine relative inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-gold-soft via-gold to-gold-dim bg-[length:200%_auto] bg-left text-ink hover:bg-right shadow-[0_10px_30px_-10px_rgba(201,162,75,0.65)] hover:shadow-[0_12px_36px_-6px_rgba(201,162,75,0.8)]",
  outline:
    "border border-white/15 text-paper hover:border-gold/70 hover:text-gold hover:bg-gold/[0.06]",
  ghost: "text-paper/75 hover:text-gold hover:bg-white/[0.06]",
  danger: "border border-white/15 text-paper/70 hover:border-red-400/70 hover:text-red-400 hover:bg-red-400/5",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = ""
) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}
