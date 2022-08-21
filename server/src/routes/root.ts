import { FastifyPluginCallback } from "fastify";
import RootController from "../controllers/RootController";


export const rootRoutes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.get("/", RootController.index);
    instance.get("/new-index", RootController.newIndex);
    instance.get("/about", RootController.about);
    instance.get("/docs", RootController.docs);
    next();
  };
