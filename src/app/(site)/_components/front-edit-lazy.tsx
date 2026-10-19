"use client";

import dynamic from "next/dynamic";

// Код правки на сайте (вместе с TipTap) — отдельным чанком, который браузер загружает, только
// когда компонент отрендерен, то есть для пользователя с правом edit_from_front. При обычном
// импорте Next подключил бы его скриптом к каждой странице сайта, даже если он не выводится.
export const FrontEditProvider = dynamic(() =>
  import("./front-edit").then((module) => module.FrontEditProvider),
);
export const PageTitleEditor = dynamic(() =>
  import("./front-edit").then((module) => module.PageTitleEditor),
);
export const PageContentEditor = dynamic(() =>
  import("./front-edit").then((module) => module.PageContentEditor),
);
export const TextEditor = dynamic(() => import("./front-edit").then((module) => module.TextEditor));
