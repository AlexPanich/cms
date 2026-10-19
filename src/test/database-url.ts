// База для интеграционных тестов: TEST_DATABASE_URL или база разработки с суффиксом _test
// на том же сервере. Тесты очищают таблицы, поэтому имя базы обязано оканчиваться на _test —
// так их нельзя случайно запустить по базе разработки или продакшена.
const TEST_DATABASE_NAME = /^[A-Za-z0-9_-]+_test$/;

export function testDatabaseUrl(source: Record<string, string | undefined>): URL {
  const raw = source.TEST_DATABASE_URL || source.DATABASE_URL;
  if (!raw) throw new Error("Для тестов задайте DATABASE_URL или TEST_DATABASE_URL");

  const url = new URL(raw);
  if (!source.TEST_DATABASE_URL) url.pathname = `${databaseName(url)}_test`;
  if (!TEST_DATABASE_NAME.test(databaseName(url))) {
    throw new Error(`Имя тестовой базы должно оканчиваться на _test: ${databaseName(url)}`);
  }
  return url;
}

export function databaseName(url: URL): string {
  return decodeURIComponent(url.pathname.replace(/^\//, ""));
}
