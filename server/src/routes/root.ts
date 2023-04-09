import type { FastifyPluginCallback } from "fastify";
import RootController from "../controllers/RootController";


export const rootRoutes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.get("/", RootController.index);
    instance.get("/documentation", RootController.documentation);
    next();
  };
