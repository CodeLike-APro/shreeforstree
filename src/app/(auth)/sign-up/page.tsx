import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import { getCurrentUser } from "@/lib/auth-utils";

export default async function SignUp() {
  const headerList = await headers();
  const currentUser = await getCurrentUser(headerList);
  if (currentUser) return redirect("/");

  return <AuthCard initialMode="sign-up" />;
}
