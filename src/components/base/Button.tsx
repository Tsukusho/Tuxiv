const variants = {
  primary: "bg-primary text-white hover:bg-primary-hover font-semibold",
  secondary: "bg-secondary text-white hover:bg-secondary-hover font-semibold",
  danger: "bg-destructive text-white hover:bg-destructive-hover font-semibold",
  none: "text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium",
} as const;

const shapes = {
  round: "px-6 py-2.5 rounded-full hover:-translate-y-px",
  static: "px-8 py-2 rounded-md border",
  base: "px-8 py-4 rounded-lg shadow-lg hover:-translate-y-px",
  none: "",
} as const;
export type Variant = keyof typeof variants;
export type Shape = keyof typeof shapes;

const base =
  "inline-flex items-center justify-center transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed";

export const baseClassName = (variant: Variant = "primary", shape: Shape = "base") =>
  `${base} ${variants[variant]} ${shapes[shape]}`;

export type ButtonProps = React.ComponentProps<"button"> & {
  variant?: Variant;
  shape?: Shape;
};

export function BaseButton({ variant = "primary", shape, className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={`${baseClassName(variant, shape)} ${className}`} {...props} />;
}
