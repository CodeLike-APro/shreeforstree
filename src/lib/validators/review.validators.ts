import * as z4 from "zod/v4";

export const createReviewSchema = z4
  .object({
    rating: z4.number().int().min(1).max(5),
    comments: z4.string().min(1).max(500).optional(),
    imagesUrl: z4.array(z4.string().min(1)).max(5).optional(),
    imagesPath: z4.array(z4.string().min(1)).max(5).optional(),
  })
  .refine(
    ({ imagesUrl, imagesPath }) =>
      !imagesUrl || !imagesPath || imagesUrl.length === imagesPath.length,
    {
      message: "imagesUrl and imagesPath must have the same number of items.",
      path: ["imagesUrl"],
    },
  );
