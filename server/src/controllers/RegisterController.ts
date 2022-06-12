import {
  UserAccountFormHandler,
  FastifyHandler,
} from "./ControllerUtilities";


export const show: FastifyHandler = 
  async (_req, res) => res.view("/src/views/pages/register.ejs");


export const register: FastifyHandler<UserAccountFormHandler> = 
  async (_req, res) => res.redirect("/dashboard");
