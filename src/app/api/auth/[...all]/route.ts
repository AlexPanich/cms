import { getAuth } from "@/server/auth/auth";

export async function GET(request: Request) {
  return getAuth().handler(request);
}

export const POST = GET;
