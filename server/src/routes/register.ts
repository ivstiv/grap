import { FastifyPluginCallback } from "fastify";
import * as RegisterController from "../controllers/RegisterController";


export const registerRoutes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.addHook("preHandler",
      (req, res, done) => {
        if (req.session.user) {
          return res.redirect("/dashboard");
        }
        done();
      }
    );

    instance.get("/", RegisterController.show);
    instance.post("/", RegisterController.register);
    next();
  };
