import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resolveSiteRoute } from "@/server/site/service";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  return pathname === "/admin" || pathname.startsWith("/admin/")
    ? adminProxy(request)
    : siteProxy(request);
}

// Быстрая проверка только наличия cookie, без БД: гостя сразу отправляем на вход.
// Настоящая проверка сессии и прав — в requirePagePermission и requirePermission.
function adminProxy(request: NextRequest) {
  if (getSessionCookie(request)) {
    return NextResponse.next();
  }
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

// Внутренний запрос proxy к самому приложению за разметкой страницы «не найдена».
// Внешний клиент с этим заголовком просто получит ту же страницу со статусом 200.
const RENDER_NOT_FOUND_HEADER = "x-cms-render-not-found";

// Публичный сайт: настоящий 404 и 308 до рендера. Сам рендер статус поменять не может —
// с Cache Components ответ всегда начинается со статуса 200 (см. CLAUDE.md).
async function siteProxy(request: NextRequest) {
  const isDocumentRequest =
    (request.method === "GET" || request.method === "HEAD") &&
    // Навигация и prefetch на клиенте: страницу «не найдена» нарисует роутер.
    !request.headers.has("rsc") &&
    !request.headers.has("next-router-prefetch") &&
    !request.headers.has(RENDER_NOT_FOUND_HEADER);
  if (!isDocumentRequest) return NextResponse.next();

  let resolution;
  try {
    resolution = await resolveSiteRoute(
      db(),
      request.nextUrl.pathname,
      request.nextUrl.searchParams.get("page") ?? undefined,
    );
  } catch (error) {
    // БД недоступна — пусть страница сама покажет ошибку.
    console.error("proxy: не удалось проверить адрес", error);
    return NextResponse.next();
  }

  if (resolution.status === "ok") return NextResponse.next();
  if (resolution.status === "redirect") {
    const url = new URL(resolution.location, request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url, 308);
  }
  return notFoundResponse(request);
}

async function notFoundResponse(request: NextRequest) {
  const headers = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" };
  if (request.method === "HEAD") return new NextResponse(null, { status: 404, headers });

  // Порт берём из окружения, а не из Host: заголовок задаёт клиент, и через него можно было бы
  // заставить сервер ходить на другие локальные порты.
  const origin = `http://127.0.0.1:${process.env.PORT || "3000"}`;
  try {
    const page = await fetch(new URL(request.nextUrl.pathname, origin), {
      headers: { [RENDER_NOT_FOUND_HEADER]: "1", Accept: "text/html" },
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    return new NextResponse(await page.text(), { status: 404, headers });
  } catch (error) {
    console.error("proxy: не удалось получить страницу «не найдена»", error);
    return new NextResponse(
      '<!doctype html><html lang="ru"><meta charset="utf-8"><title>Страница не найдена</title><h1>Страница не найдена</h1><p><a href="/">На главную</a></p></html>',
      { status: 404, headers },
    );
  }
}

export const config = {
  // Админка и публичный сайт: всё, кроме API, файлов Next, загруженных файлов, входа
  // и служебных файлов сайта.
  matcher: [
    "/((?!(?:api|_next|media|login)(?:/|$)|favicon\\.ico$|sitemap\\.xml$|robots\\.txt$).*)",
  ],
};
