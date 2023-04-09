import { env } from "../env";
import { Role } from "../models/Role";

export const numOfAdmins = async () => {
  const adminRole = await Role.getByName("admin");
  if (!adminRole) {
    throw new Error("Missing admin role!");
  }
  const admins = await adminRole.users();
  return admins.length;
};


export const capitalizeFirstLetter = (string: string) =>
  string[0].toUpperCase() + string.slice(1);


export const getApiUrl = () => {
  if(env.NODE_ENV === "production") {
    return `https://${env.DOMAIN}`;
  }
  return `http://${env.DOMAIN}`;
};
