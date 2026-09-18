import type { Review, User } from "../models";

export type ProductReview = Review & {
  user: Pick<User, "name" | "image">;
};
