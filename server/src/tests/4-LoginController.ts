import assert from "assert";
import { User } from "../models/User";
import type { Cookie } from "./utils";
import { testWebServer } from "./utils";
import { systemCleanup } from "./utils";
import parse from "node-html-parser";
import { unescape } from "lodash";



describe("Login routes", () => {

  afterEach(() => systemCleanup());

  describe("GET /login", () => {
    it("Should return status code 200", async () => {
      const res = await testWebServer.inject({
        method: "GET",
        url: "/login",
      });

      assert.strictEqual(res.statusCode, 200);
    });
  });

  describe("POST /login", () => {
    it("Should fail validation", async () => {
      const testScenarios = [
        {
          payload: {},
          expectedError: "Email is required",
        },
        {
          payload: {
            email: "",
            password: "asdasdasdasdasdasd",
          },
          expectedError: "Invalid email",
        },
        {
          payload: {
            email: "someemail@somewhere.dontknowwhere",
            password: "12345",
          },
          expectedError: "Password must be at least 6 characters",
        },
        {
          payload: {
            email: "someemail@somewhere.dontknowwhere",
          },
          expectedError: "Password is required",
        },
        {
          payload: {
            email: 2340987,
            password: "123456",
          },
          expectedError: "Email must be a string",
        },
      ];

      for (const scenario of testScenarios) {
        const loginRes = await testWebServer.inject({
          method: "POST",
          url: "/login",
          payload: scenario.payload,
        });

        const sessionCookie = loginRes.cookies.find(c =>
          (c as Cookie).name === "sessionId"
        ) as Cookie;

        const redirectLocation = loginRes.headers["location"];
        assert.strictEqual(loginRes.statusCode, 302);
        assert.strictEqual(redirectLocation, "/login");

        const loginRes2 = await testWebServer.inject({
          method: "GET",
          url: redirectLocation,
          cookies: {
            [sessionCookie.name]: `${sessionCookie.value}`,
          },
        });

        const root = parse(loginRes2.body);
        const alert = root.querySelector("p[data-test-id='alert']");

        assert.strictEqual(loginRes2.statusCode, 200);
        assert.strictEqual(unescape(alert?.innerText), scenario.expectedError);
      }
    });


    it("Should login user", async () => {
      await User.register("user2@grap.email", "123456");

      const res = await testWebServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: "user2@grap.email",
          password: "123456",
        },
      });

      const redirectLocation = res.headers["location"];
      const sessionCookie = res.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/dashboard");

      if (sessionCookie === undefined) {
        throw new Error("sessionCookie is undefined!");
      }

      const dashboardRes = await testWebServer.inject({
        method: "GET",
        url: "/dashboard",
        cookies: {
          [sessionCookie.name]: sessionCookie.value,
        },
      });

      assert.strictEqual(dashboardRes.statusCode, 200);
    });
  });
});
