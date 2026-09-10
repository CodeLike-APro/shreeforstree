"use server";
import { cookies } from "next/headers";

export async function setCartCookie() {
  const cookieStore = await cookies();

  const cartCookieValue = crypto.randomUUID();

  cookieStore.set({
    name: "cartCookie",
    value: cartCookieValue,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 1 month
  });

  return cartCookieValue;
}
