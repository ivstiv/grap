import Fastify from "fastify";
import view from "@fastify/view";
import ejs from "ejs";
import { loginRoutes } from "./routes/login";
import { rootRoutes } from "./routes/root";
import { setupRoutes } from "./routes/setup";
import formBodyPlugin from "@fastify/formbody";
import { registerRoutes } from "./routes/register";
import { dashboardRoutes } from "./routes/dashboard";
import fastifyCookiePlugin from "@fastify/cookie";
import fastifySessionPlugin from "@fastify/session";
import fastifyStaticPlugin from "@fastify/static";
import { logoutRoutes } from "./routes/logout";
import ErrorController from "./controllers/ErrorController";
import { apiV1Routes } from "./routes/api-v1";
import { settingsRoutes } from "./routes/settings";
import { adminRoutes } from "./routes/admin";
import path from "path/posix";


export type SessionUser = {
  id: number
}

declare module "fastify" {
  interface Session {
      user?: SessionUser
      flashMessage?: string
  }
}

const { SESSION_SECRET, NODE_ENV } = process.env;

if (!SESSION_SECRET) {
  throw new Error("Missing env variable: SESSION_SECRET");
}

if (!NODE_ENV) {
  throw new Error("Missing env variable: NODE_ENV");
}

export const webServer = Fastify({
  logger: true,
  disableRequestLogging: true,
});

webServer.register(fastifyStaticPlugin, {
  root: path.join(__dirname, "public"),
  prefix: "/public/",
});
webServer.register(formBodyPlugin);
webServer.register(fastifyCookiePlugin);
webServer.register(fastifySessionPlugin, {
  secret: SESSION_SECRET,
  cookie: {
    secure: ["development", "test"].includes(NODE_ENV) ? false : true,
    sameSite: "strict",
  },
});

webServer.register(view, {
  engine: { ejs },
});

webServer.register(rootRoutes);
webServer.register(setupRoutes, { prefix: "setup" });
webServer.register(loginRoutes, { prefix: "login" });
webServer.register(logoutRoutes, { prefix: "logout" });
webServer.register(registerRoutes, { prefix: "register" });
webServer.register(dashboardRoutes, { prefix: "dashboard" });
webServer.register(settingsRoutes, { prefix: "settings" });
webServer.register(adminRoutes, { prefix: "admin" });
webServer.register(apiV1Routes, { prefix: "api/v1" });

webServer.setNotFoundHandler(ErrorController.notFound);
