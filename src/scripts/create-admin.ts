// Создаёт пользователя с ролью admin.
//   pnpm user:create-admin --email admin@example.com [--name "Имя"]
// Пароль спрашивается в терминале без отображения или берётся из ADMIN_PASSWORD.
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import { z } from "zod";
import { closeDb, db } from "@/db";
import { createUserWithPassword, UserError } from "@/server/users/service";

async function promptHidden(question: string): Promise<string> {
  if (!process.stdin.isTTY) {
    throw new Error("Нет терминала: передайте пароль через переменную ADMIN_PASSWORD");
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  process.stdout.write(question);
  // Глушим эхо ввода, чтобы пароль не отображался в терминале.
  (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = () => {};
  try {
    return await rl.question("");
  } finally {
    rl.close();
    process.stdout.write("\n");
  }
}

async function readPassword(): Promise<string> {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const password = await promptHidden("Пароль: ");
  if (password !== (await promptHidden("Повторите пароль: "))) {
    throw new Error("Пароли не совпадают");
  }
  return password;
}

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      name: { type: "string", default: "Администратор" },
    },
  });
  if (!values.email) {
    throw new Error("Укажите email: pnpm user:create-admin --email admin@example.com");
  }

  const { id } = await createUserWithPassword(db(), {
    email: values.email,
    name: values.name,
    password: await readPassword(),
    roleKeys: ["admin"],
  });
  console.log(`Администратор создан: ${values.email} (id ${id})`);
}

main()
  .catch((error: unknown) => {
    if (error instanceof z.ZodError) {
      console.error(z.prettifyError(error));
    } else if (error instanceof UserError || error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  })
  .finally(closeDb);
