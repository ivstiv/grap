import Fastify from "fastify";
import view from "@fastify/view";
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
import { Liquid } from "liquidjs";
import { env } from "./env";
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { getApiUrl } from "./utilities/functions";



export type SessionUser = {
  id: number
  isAdmin: boolean
};

declare module "fastify" {
  interface Session {
    user?: SessionUser
    flashMessage?: string
  }
  interface FastifyReply {
    locals: {
      flashMessage?: string
      isLoggedIn: boolean
      isAdmin: boolean
      domain: string
    }
  }
}



export const getWebServer = async () => {
  const webServer = Fastify({
    logger: true,
    disableRequestLogging: true,
    trustProxy: (_, hop) => hop === 1,
  });

  webServer.setValidatorCompiler(validatorCompiler);
  webServer.setSerializerCompiler(serializerCompiler);

  const liquid = new Liquid({
    root: "src/views",
    extname: ".liquid",
    cache: env.NODE_ENV === "production",
  });

  await Promise.all([
    webServer.register(fastifyStaticPlugin, {
      root: path.join(__dirname, "public"),
      prefix: "/public/",
      cacheControl: true,
      maxAge: 86400000, // 1 day
      immutable: true,
      lastModified: true,
      etag: true,
    }),
    webServer.register(formBodyPlugin),
    webServer.register(fastifyCookiePlugin),
    webServer.register(fastifySessionPlugin, {
      secret: env.SESSION_SECRET,
      cookie: {
        secure: ["development", "test"]
          .includes(env.NODE_ENV) ? false : true,
        sameSite: "strict",
        httpOnly: true,
      },
    }),
    webServer.register(view, { engine: { liquid } }),

    webServer.register(fastifySwagger, {
      openapi: {
        info: {
          title: "Grap API",
          description: "A simple system to manage temporary email addresses for CI/CD integrations.",
          version: "1.0.0",
        },
        servers: [
          { url: getApiUrl() },
        ],
        security: [
          {
            "Bearer Auth": [],
          },
        ],
        components: {
          securitySchemes: {
            "Bearer Auth": {
              type: "apiKey",
              name: "Authorization",
              in: "header",
            },
          },
        },
      },
      transform: jsonSchemaTransform,
      hideUntagged: true, // spec routes need to be opt-in, otherwise all non-api routes appear
    }),

    webServer.register(fastifySwaggerUi, {
      prefix: "/documentation",
      uiConfig: {
        persistAuthorization: true,
      },
    }),

    webServer.register(rootRoutes),
    webServer.register(setupRoutes, { prefix: "setup" }),
    webServer.register(loginRoutes, { prefix: "login" }),
    webServer.register(logoutRoutes, { prefix: "logout" }),
    webServer.register(registerRoutes, { prefix: "register" }),
    webServer.register(dashboardRoutes, { prefix: "dashboard" }),
    webServer.register(settingsRoutes, { prefix: "settings" }),
    webServer.register(adminRoutes, { prefix: "admin" }),
    webServer.register(apiV1Routes, { prefix: "/api/v1" }),
  ]);

  webServer.setNotFoundHandler(ErrorController.notFound);

  // no need to decorate the locals
  // as it is decorated by the point-of-view package
  // webServer.decorateReply("locals", null);
  // populate common variables for all views
  webServer.addHook("onRequest", async (request, reply) => {
    reply.locals = {
      flashMessage: request.session.flashMessage,
      isLoggedIn: !!request.session.user,
      isAdmin: request.session.user?.isAdmin ?? false,
      domain: env.DOMAIN,
    };
    request.session.flashMessage = undefined;
  });

  return webServer;
};
