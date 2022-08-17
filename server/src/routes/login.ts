import { FastifyPluginCallback } from "fastify";
import LoginController from "../controllers/LoginController";


export const loginRoutes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.addHook("preHandler",
      (req, res, done) => {
        if (req.session.user) {
          return res.redirect("/dashboard");
        }
        done();
      }
    );

    instance.get("/", LoginController.show);
    instance.post("/", LoginController.login);
    next();
  };
