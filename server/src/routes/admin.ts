import { FastifyPluginCallback } from "fastify";
import * as SystemSettingsController from "../controllers/SystemSettingsController";
import * as UsersController from "../controllers/UsersController";
import { User } from "../models/User";


export const adminRoutes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.addHook("preHandler",
      async (req, res) => {
        if (!req.session.user) {
          return res.redirect("/login");
        }

        const user = await User.getById(req.session.user.id);
        if(!user.hasRole("admin")) {
          return res.redirect("/login");
        }
      }
    );

    instance.get("/system-settings", SystemSettingsController.index);
    instance.post("/system-settings", SystemSettingsController.updateSettings);
    instance.get("/users", UsersController.index);
    next();
  };
