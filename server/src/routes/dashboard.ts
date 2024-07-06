import type { FastifyPluginCallback } from "fastify";
import DashboardController from "../controllers/DashboardController";


export const dashboardRoutes: FastifyPluginCallback =
  (instance, _opts, next) => {
    instance.addHook("preHandler",
      (req, res, done) => {
        if (!req.session.user) {
          return res.redirect("/login");
        }
        done();
        return undefined;
      }
    );

    instance.get("/", DashboardController.index);
    instance.post("/address", DashboardController.deleteAddress);
    instance.get("/inbox/:id", DashboardController.showInbox);
    instance.post("/inbox/email", DashboardController.deleteEmail);
    instance.get("/inbox/:inboxId/email/:emailId", DashboardController.showEmail);
    next();
    return undefined;
  };
