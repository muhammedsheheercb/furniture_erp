import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve" | "export";

export async function hasPermission(module: string, action: PermissionAction): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session) return false;
  
  // Admin and Owner have all permissions
  if (session.user.role === "admin" || session.user.role === "owner") return true;
  
  const userPermissions = (session.user as any).permissions || {};
  const modulePerms = userPermissions[module];
  
  if (!modulePerms) return false;
  
  return modulePerms[action] === true;
}
