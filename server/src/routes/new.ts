import { FastifyPluginCallback } from "fastify";
import NewController from "../controllers/NewController";


export const newRoutes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.get("/index", NewController.index);
    instance.get("/login", NewController.login);
    instance.get("/register", NewController.register);
    instance.get("/setup", NewController.setup);
    next();
  };
