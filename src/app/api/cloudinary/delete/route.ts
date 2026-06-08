import {
  badRequest,
  forbidden,
  internalServerError,
  notFound,
  ok,
} from "@/lib/api-response";
import { adminCheck } from "@/lib/auth-utils";
import { deleteProductImage } from "@/lib/image-upload";
import z4 from "zod/v4";

const schema = z4.object({
  public_id: z4.string().min(1, "Public ID is required"),
});

export async function POST(request: Request) {
  try {
    const isAdmin = await adminCheck(request);
    if (!isAdmin) {
      return forbidden("Unauthorized access");
    }

    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return badRequest("Invalid public ID");
    }

    try {
      const cloudinaryResult = await deleteProductImage(result.data.public_id);
      if (cloudinaryResult.result === "not found") {
        return notFound("Image not found");
      }
      return ok("Image deleted successfully");
    } catch (error) {
      return internalServerError("Failed to delete image", error);
    }
  } catch (error) {
    return internalServerError("An unexpected error occurred", error);
  }
}
