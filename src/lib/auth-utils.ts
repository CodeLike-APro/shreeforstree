import { validationError } from "./api-response";
import { auth } from "./db/auth";

export async function getCurrentUser(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user;
  } catch (error) {
    return validationError("Failed to get current user", error);
  }
}

export async function adminCheck(request: Request): Promise<boolean> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const isAdmin = session?.user?.role === "admin";
    return isAdmin;
  } catch (error) {
    validationError("Failed to check admin status", error);
    return false;
  }
}
