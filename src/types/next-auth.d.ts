import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import { IUserPermissions } from "./index";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      permissions?: IUserPermissions;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    permissions?: IUserPermissions;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    permissions?: IUserPermissions;
  }
}
