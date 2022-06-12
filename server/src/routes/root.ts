import { FastifyPluginCallback } from "fastify";
import * as RootController from "../controllers/RootController";


export const rootRoutes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.get("/", RootController.index);
    instance.get("/about", RootController.about);
    next();
  };
