import type { VariantProps } from "class-variance-authority";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonLinkProps = React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;

// Ссылка, которая выглядит как кнопка. Не через Base UI Button с nativeButton={false}:
// тот добавляет role="button", и скринридеры объявляют ссылку кнопкой.
export function ButtonLink({ className, variant, size, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
