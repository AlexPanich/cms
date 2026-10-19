import { createAuthClient } from "better-auth/react";

// Вход идёт из браузера через /api/auth, чтобы работал встроенный rate limit Better Auth.
export const authClient = createAuthClient();
