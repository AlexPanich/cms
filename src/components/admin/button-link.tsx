import Link from "next/link";
import { Button } from "@/components/ui/button";

type ButtonLinkProps = Omit<React.ComponentProps<typeof Button>, "render" | "nativeButton"> & {
  href: string;
};

// Ссылка, которая выглядит как кнопка (Base UI: render + nativeButton={false}).
export function ButtonLink({ href, ...props }: ButtonLinkProps) {
  return <Button nativeButton={false} render={<Link href={href} />} {...props} />;
}
