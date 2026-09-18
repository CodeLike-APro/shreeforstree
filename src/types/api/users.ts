import type { User } from "../models";

export type PublicUser = Omit<User, "image_path">;
