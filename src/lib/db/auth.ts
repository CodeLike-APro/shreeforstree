import "server-only";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { db } from "./index";
import * as schema from "./schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  trustedOrigins: [process.env.NEXT_PUBLIC_BETTER_AUTH_URL!],
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

  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 10,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
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
        defaultValue: "user",
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
