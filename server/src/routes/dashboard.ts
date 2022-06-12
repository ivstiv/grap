import { FastifyPluginCallback } from "fastify";
import * as DashboardController from "../controllers/DashboardController";


export const dashboardRoutes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.addHook("preHandler",
      (req, res, done) => {
        if (!req.session.user) {
          return res.redirect("/login");
        }
        done();
      }
    );

    instance.get("/", DashboardController.index);
    next();
  };
