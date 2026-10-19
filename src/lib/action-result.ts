export type FieldErrors = Partial<Record<string, string[]>>;

// Результат server action. Ошибки возвращаются значением, а не исключением:
// исключение из server action в production приходит на клиент без текста.
export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: FieldErrors };
