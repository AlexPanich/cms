import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

// Обычная GET-форма: поиск работает и без JavaScript, страница поиска сбрасывается на первую.
export function SearchForm({
  defaultValue,
  placeholder,
  params = {},
}: {
  defaultValue: string;
  placeholder: string;
  // Фильтры списка, которые поиск должен сохранить.
  params?: Record<string, string>;
}) {
  return (
    <form role="search" className="relative w-full max-w-xs">
      {Object.entries(params).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-8"
      />
    </form>
  );
}
