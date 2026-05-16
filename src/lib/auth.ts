import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Name or Email", type: "text" },
        password: { label: "Password",      type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credentials are required");
        }

        try {
          await dbConnect();
          const identifier = credentials.email.trim();
          
          // Search by name (case-insensitive) OR email
          const user = await (User as any).findOne({
            $or: [
              { email: identifier.toLowerCase() },
              { name:  { $regex: new RegExp(`^${identifier}$`, "i") } }
            ]
          }).select("+passwordHash +password").lean();

          if (!user) {
            console.warn(`[authorize] No user found: ${identifier}`);
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash || user.password
          );

          if (!isValid) {
            console.warn(`[authorize] Invalid password for: ${identifier}`);
            return null;
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions || {},
          };
        } catch (err: any) {
          console.error("[authorize] FATAL ERROR", err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error:  "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};