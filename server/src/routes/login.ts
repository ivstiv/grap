import { FastifyPluginCallback } from "fastify";

export const loginRoutes: FastifyPluginCallback =
(instance, _opts, next) => {
  instance.get("/", (req, res) => {
    res.view("/src/views/pages/login.ejs");
  });
  instance.post("/", (req, res) => {
    res.send(req.raw.method);
  });
  next();
};
