import { auth } from "./db/auth";

export async function getCurrentUser(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export async function adminCheck(request: Request): Promise<boolean> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const isAdmin = session?.user?.role === "admin";
    return isAdmin;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}
