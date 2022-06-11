import { FastifyPluginCallback } from "fastify";

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

  instance.get("/", (req, res) => {
    res.view("/src/views/pages/dashboard.ejs", {
      isLoggedIn: !!req.session.user,
    });
  });
  next();
};
