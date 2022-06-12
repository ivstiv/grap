import { FastifyPluginCallback } from "fastify";
import * as LogoutController from "../controllers/LogoutController";


export const logoutRoutes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.get("/", LogoutController.logout);
    next();
  };
