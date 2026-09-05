import { cookies } from "next/headers";

export async function setGuestOrderCookie({
  orderId,
  guestToken,
}: {
  orderId: string;
  guestToken: string;
}): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set({
    name: `guest_order_${orderId}`,
    value: guestToken,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });
}

export async function resolveGuestToken(
  orderId: string,
  tokenFromRequest?: string | null,
): Promise<string | undefined> {
  if (tokenFromRequest) {
    if (tokenFromRequest.trim() !== "") return tokenFromRequest.trim();
  }

  const cookieStore = await cookies();

  const guestTokenCookie = cookieStore.get(`guest_order_${orderId}`);
  if (guestTokenCookie?.value) {
    return guestTokenCookie.value;
  }

  return undefined;
}
