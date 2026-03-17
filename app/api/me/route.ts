import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import usersData from "@/public/data/users.json";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("demo_user_id")?.value;

  if (!userId) {
    return NextResponse.json({ user: null });
  }

  const user = usersData.users.find((u) => u.id === userId) ?? null;
  return NextResponse.json({ user });
}
