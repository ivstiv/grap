import type { FastifyPluginCallback } from "fastify";
import SettingsController from "../controllers/SettingsController";


export const settingsRoutes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.addHook("preHandler",
      (req, res, done) => {
        if (!req.session.user) {
          return res.redirect("/login");
        }
        done();
      }
    );

    instance.get("/", SettingsController.index);
    instance.post("/token", SettingsController.createToken);
    instance.post("/token/destroy", SettingsController.destroyToken);
    instance.post("/user/destroy", SettingsController.destroyUser);
    next();
  };
