import { FastifyPluginCallback } from "fastify";
import * as SystemSettingsController from "../controllers/SystemSettingsController";
import { User } from "../models/User";


export const systemSettingsRoutes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.addHook("preHandler",
      async (req, res) => {
        if (!req.session.user) {
          return res.redirect("/login");
        }

        const user = await User.getById(req.session.user.id);
        const roles = await user.roles();
        if(!roles.includes("admin")) {
          return res.redirect("/login");
        }
      }
    );

    instance.get("/", SystemSettingsController.index);
    instance.post("/", SystemSettingsController.updateSettings);
    next();
  };
