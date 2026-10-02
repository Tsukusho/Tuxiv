import Link from "next/link";
import { baseClassName, type Shape, type Variant } from "./Button";

type LinkProps = React.ComponentProps<typeof Link> & {
  variant?: Variant;
  shape?: Shape;
};

export function BaseLink({ variant = "primary", shape, className = "", ...props }: LinkProps) {
  return <Link className={`${baseClassName(variant, shape)} ${className}`} {...props} />;
}
