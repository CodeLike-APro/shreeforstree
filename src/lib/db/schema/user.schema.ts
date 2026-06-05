import { pgTable, text, uuid, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { addresses } from "./address.schema";
import { wishlist } from "./wishlist.schema";

export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  role: userRoleEnum("role").notNull().default("customer"),
  phone: text("phone"),
  password: text("hashed_password"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  wishlist: many(wishlist),
}));
