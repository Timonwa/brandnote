import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

// Admins are invited with publicMetadata.role set, which only the server can write.
// A signed-in non-admin gets a 404 so the page doesn't reveal that it exists.
export async function requireAdmin() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (user.publicMetadata.role !== "admin") notFound();
  return user;
}
