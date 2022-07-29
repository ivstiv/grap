import assert from "assert";
import { webServer } from "../web-server";
import { User } from "../models/User";
import { Cookie, systemCleanup } from "./utils";
import parse from "node-html-parser";
import { unescape } from "lodash";

describe("Login routes", () => {

  afterEach(() => systemCleanup());

  describe("GET /login", () => {
    it("Should return status code 200", async () => {
      const res = await webServer.inject({
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
        const loginRes = await webServer.inject({
          method: "POST",
          url: "/login",
          payload: scenario.payload,
        });

        const root = parse(loginRes.body);
        const title = root.querySelector("mark[data-test-id='error']");

        assert.strictEqual(loginRes.statusCode, 400);
        assert.strictEqual(unescape(title?.innerText), scenario.expectedError);
      }
    });


    it("Should login user", async () => {
      await User.register("user2@grap.email", "123456");

      const res = await webServer.inject({
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

      const dashboardRes = await webServer.inject({
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
