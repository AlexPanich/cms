import Link from "next/link";

export default function Forbidden() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">Недостаточно прав</h1>
      <p className="text-foreground/70">
        У вашей учётной записи нет доступа к этому разделу. Обратитесь к администратору.
      </p>
      <Link href="/" className="underline underline-offset-4">
        На главную
      </Link>
    </main>
  );
}
