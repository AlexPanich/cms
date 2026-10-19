import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-3 py-16 text-center">
      <h1 className="text-2xl font-semibold">Страница не найдена</h1>
      <p className="text-muted-foreground">
        Возможно, её удалили или адрес набран с ошибкой. Попробуйте{" "}
        <Link href="/search" className="underline underline-offset-4">
          поиск
        </Link>{" "}
        или перейдите{" "}
        <Link href="/" className="underline underline-offset-4">
          на главную
        </Link>
        .
      </p>
    </div>
  );
}
