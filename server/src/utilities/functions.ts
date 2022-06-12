import { Role } from "../models/Role";

export const numOfAdmins = async () => {
  const adminRole = await Role.getByName("admin");
  if (!adminRole) {
    throw new Error("Missing admin role!");
  }
  const admins = await adminRole.users();
  return admins.length;
};
