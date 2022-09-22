import { FastifyPluginCallback } from "fastify";
import NewController from "../controllers/NewController";


export const newRoutes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.get("/index", NewController.index);
    instance.get("/login", NewController.login);
    instance.get("/register", NewController.register);
    instance.get("/setup", NewController.setup);
    instance.get("/documentation", NewController.documentation);
    instance.get("/400", NewController.badRequest);
    instance.get("/404", NewController.notFound);
    next();
  };
