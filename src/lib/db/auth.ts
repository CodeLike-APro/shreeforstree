import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "./index";
import * as schema from "./schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh if older than 1 day
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "customer",
        input: false, // not settable by user
      },
      deletedAt: {
        type: "date",
        defaultValue: null,
        input: false,
        nullable: true,
      },
      phone: {
        type: "string",
        defaultValue: null,
        input: true,
        nullable: true,
      },
      image_path: {
        type: "string",
        defaultValue: null,
        input: true,
        nullable: true,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
