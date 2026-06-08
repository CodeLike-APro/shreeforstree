import { forbidden } from "@/lib/api-response";
import { adminCheck } from "@/lib/auth-utils";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(request: NextRequest) {
  const isAdmin = await adminCheck(request);
  if (!isAdmin) {
    return forbidden("Unauthorized access");
  }

  const body = await request.json();
  const { paramsToSign } = body;

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!,
  );

  return Response.json({ signature });
}
