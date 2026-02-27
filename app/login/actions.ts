"use server";

import { cookies } from "next/headers";
import usersData from "@/public/data/users.json";

export async function loginAction(email: string) {
  const user = usersData.users.find((u) => u.email === email);

  if (!user) {
    return { success: false, error: "Utilisateur introuvable" };
  }

  const cookieStore = await cookies();
  cookieStore.set("demo_user_id", user.id, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return { success: true };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("demo_user_id");
}
