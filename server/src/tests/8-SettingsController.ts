import assert from "assert";
import { unescape } from "lodash";
import { afterEach } from "mocha";
import parse from "node-html-parser";
import { User } from "../models/User";
import type { Cookie } from "./utils";
import { testWebServer } from "./utils";
import { systemCleanup } from "./utils";



describe("Settings routes", () => {
  let user: User;

  beforeEach(async () => {
    const registered = await User.register("user@grap.email", "123456");
    if (!registered) {
      throw new Error("Failed to register user.");
    }
    user = registered;
  });

  afterEach(async () => {
    user = undefined as unknown as User;
    await systemCleanup();
  });


  describe("GET /settings", () => {
    it("Should redirect to login", async () => {
      const res = await testWebServer.inject({
        method: "GET",
        url: "/dashboard",
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/login");
    });


    it("Should return status code 200", async () => {
      const loginRes = await testWebServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: user.email,
          password: "123456",
        },
      });

      const sessionCookie = loginRes.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const res = await testWebServer.inject({
        method: "GET",
        url: "/settings",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      assert.strictEqual(res.statusCode, 200);
    });
  });


  describe("POST /settings/token", () => {
    it("Should redirect to login", async () => {
      const res = await testWebServer.inject({
        method: "POST",
        url: "/settings/token",
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/login");
    });


    it("Should fail validation", async () => {
      const loginRes = await testWebServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: user.email,
          password: "123456",
        },
      });

      const sessionCookie = loginRes.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const testScenarios = [
        {
          payload: { note: "abcdefghijklmnopqrstuvwxyz" },
          expectedError: "Note must be at most 15 characters",
        },
      ];

      for (const scenario of testScenarios) {
        const createTokenRes = await testWebServer.inject({
          method: "POST",
          url: "/settings/token",
          cookies: {
            [sessionCookie.name]: `${sessionCookie.value}`,
          },
          payload: scenario.payload,
        });

        const redirectLocation = createTokenRes.headers["location"];
        assert.strictEqual(createTokenRes.statusCode, 302);
        assert.strictEqual(redirectLocation, "/settings");

        const settingsRes = await testWebServer.inject({
          method: "GET",
          url: "/settings",
          cookies: {
            [sessionCookie.name]: `${sessionCookie.value}`,
          },
        });

        const root = parse(settingsRes.body);
        const title = root.querySelector("p[data-test-id='alert']");

        assert.strictEqual(settingsRes.statusCode, 200);
        assert.strictEqual(unescape(title?.innerText), scenario.expectedError);
      }
    });


    it("Should create the token", async () => {
      const loginRes = await testWebServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: user.email,
          password: "123456",
        },
      });

      const sessionCookie = loginRes.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const createTokenRes = await testWebServer.inject({
        method: "POST",
        url: "/settings/token",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
        payload: {
          note: "note here",
        },
      });

      const redirectLocation = createTokenRes.headers["location"];
      assert.strictEqual(createTokenRes.statusCode, 302);
      assert.strictEqual(redirectLocation, "/settings");

      const settingsRes = await testWebServer.inject({
        method: "GET",
        url: "/settings",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      const root = parse(settingsRes.body);
      const title = root.querySelector("p[data-test-id='alert']");

      assert.strictEqual(settingsRes.statusCode, 200);
      assert.strictEqual(unescape(title?.innerText), "Access token created successfully!");
    });


    it("Should fail because max tokens reached", async () => {
      while(user.tokens.length < user.settings.maxTokens) {
        await user.createToken();
        user = await user.refresh();
      }

      const loginRes = await testWebServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: user.email,
          password: "123456",
        },
      });

      const sessionCookie = loginRes.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const createTokenRes = await testWebServer.inject({
        method: "POST",
        url: "/settings/token",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
        payload: {
          note: "",
        },
      });

      const redirectLocation = createTokenRes.headers["location"];
      assert.strictEqual(createTokenRes.statusCode, 302);
      assert.strictEqual(redirectLocation, "/settings");

      const settingsRes = await testWebServer.inject({
        method: "GET",
        url: "/settings",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      const root = parse(settingsRes.body);
      const title = root.querySelector("p[data-test-id='alert']");

      assert.strictEqual(settingsRes.statusCode, 200);
      assert.strictEqual(unescape(title?.innerText), "You have reached your token limit.");
    });
  });


  describe("POST /settings/token/destroy", () => {
    it("Should redirect to login", async () => {
      const res = await testWebServer.inject({
        method: "POST",
        url: "/settings/token/destroy",
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/login");
    });


    it("Should fail validation", async () => {
      const loginRes = await testWebServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: user.email,
          password: "123456",
        },
      });

      const sessionCookie = loginRes.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const testScenarios = [
        {
          payload: {},
          expectedError: "Token is required",
        },
        {
          payload: { token: "asd" },
          expectedError: "Token must be a number",
        },
        {
          payload: { token: -1 },
          expectedError: "Token must be greater than 0",
        },
        {
          payload: { token: 0 },
          expectedError: "Token must be greater than 0",
        },
        {
          payload: { token: 2340987 },
          expectedError: "You don't own the token you are trying to delete.",
        },
      ];

      for (const scenario of testScenarios) {
        const deleteTokenRes = await testWebServer.inject({
          method: "POST",
          url: "/settings/token/destroy",
          cookies: {
            [sessionCookie.name]: `${sessionCookie.value}`,
          },
          payload: scenario.payload,
        });

        const redirectLocation = deleteTokenRes.headers["location"];
        assert.strictEqual(deleteTokenRes.statusCode, 302);
        assert.strictEqual(redirectLocation, "/settings");

        const settingsRes = await testWebServer.inject({
          method: "GET",
          url: "/settings",
          cookies: {
            [sessionCookie.name]: `${sessionCookie.value}`,
          },
        });

        const root = parse(settingsRes.body);
        const title = root.querySelector("p[data-test-id='alert']");

        assert.strictEqual(settingsRes.statusCode, 200);
        assert.strictEqual(unescape(title?.innerText), scenario.expectedError);
      }
    });


    it("Should delete the token", async () => {
      const token = await user.createToken();
      const loginRes = await testWebServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: user.email,
          password: "123456",
        },
      });

      const sessionCookie = loginRes.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const deleteTokenRes = await testWebServer.inject({
        method: "POST",
        url: "/settings/token/destroy",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
        payload: {
          token: token.id,
        },
      });

      const redirectLocation = deleteTokenRes.headers["location"];
      assert.strictEqual(deleteTokenRes.statusCode, 302);
      assert.strictEqual(redirectLocation, "/settings");

      const settingsRes = await testWebServer.inject({
        method: "GET",
        url: "/settings",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      const root = parse(settingsRes.body);
      const title = root.querySelector("p[data-test-id='alert']");

      assert.strictEqual(settingsRes.statusCode, 200);
      assert.strictEqual(unescape(title?.innerText), "Access token deleted successfully!");
    });
  });


  describe("POST /settings/user/destroy", () => {
    it("Should redirect to login", async () => {
      const res = await testWebServer.inject({
        method: "POST",
        url: "/settings/user/destroy",
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/login");
    });


    it("Should delete the user", async () => {
      const loginRes = await testWebServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: user.email,
          password: "123456",
        },
      });

      const sessionCookie = loginRes.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const deleteTokenRes = await testWebServer.inject({
        method: "POST",
        url: "/settings/user/destroy",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      const redirectLocation = deleteTokenRes.headers["location"];
      assert.strictEqual(deleteTokenRes.statusCode, 302);
      assert.strictEqual(redirectLocation, "/login");

      const users = await User.query();
      assert.strictEqual(users.length, 0);
    });
  });
});
