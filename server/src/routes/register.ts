import type { FastifyPluginCallback } from "fastify";
import RegisterController from "../controllers/RegisterController";
import { SystemSetting } from "../models/SystemSetting";


export const registerRoutes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.addHook("preHandler",
      async (req, res) => {
        if (req.session.user) {
          return res.redirect("/dashboard");
        }

        const setting = await SystemSetting.getByName("disable_register_page");
        if (setting.value === "true") {
          return res.redirect("/login");
        }
      }
    );

    instance.get("/", RegisterController.show);
    instance.post("/", RegisterController.register);
    next();
  };
