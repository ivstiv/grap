import assert from "assert";
import { webServer } from "../web-server";
import { User } from "../models/User";
import { Cookie, systemCleanup, waitForStatToUpdate } from "./utils";
import { SystemSetting } from "../models/SystemSetting";
import parse from "node-html-parser";
import { unescape } from "lodash";


describe("Register routes", () => {

  after(() => systemCleanup());

  describe("GET /register", () => {
    after(() => systemCleanup());

    it("Should return register page", async () => {
      const res = await webServer.inject({
        method: "GET",
        url: "/register",
      });

      assert.strictEqual(res.statusCode, 200);
    });


    it("Should redirect to login", async () => {
      await SystemSetting.updateByName("disable_register_page", "true");
      const res = await webServer.inject({
        method: "GET",
        url: "/register",
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/login");
    });
  });


  describe("POST /register", () => {
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
        const registerRes = await webServer.inject({
          method: "POST",
          url: "/register",
          payload: scenario.payload,
        });

        const sessionCookie = registerRes.cookies.find(c =>
          (c as Cookie).name === "sessionId"
        ) as Cookie;

        const redirectLocation = registerRes.headers["location"];
        assert.strictEqual(registerRes.statusCode, 302);
        assert.strictEqual(redirectLocation, "/register");

        const registerRes2 = await webServer.inject({
          method: "GET",
          url: redirectLocation,
          cookies: {
            [sessionCookie.name]: `${sessionCookie.value}`,
          },
        });

        const root = parse(registerRes2.body);
        const alert = root.querySelector("p[data-test-id='alert']");

        assert.strictEqual(registerRes2.statusCode, 200);
        assert.strictEqual(unescape(alert?.innerText), scenario.expectedError);
      }
    });


    it("Should register user", async () => {
      const userListBefore = await User.query();

      const userListPromise = waitForStatToUpdate("total_users");
      const res = await webServer.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: "user1@grap.email",
          password: "123456",
        },
      });

      const redirectLocation = res.headers["location"];

      const [
        userListAfter,
        totalUsers,
      ] = await Promise.all([
        User.query(),
        userListPromise,
      ]);

      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/dashboard");
      assert.strictEqual(userListBefore.length < userListAfter.length, true);
      assert.strictEqual(userListAfter.length, parseInt(totalUsers.value));
    });


    it("Should fail to register user with the same email", async () => {
      const user = await User.register("user2@grap.email", "123456");
      if (!user) {
        throw new Error("Failed to register user.");
      }
      const userListBefore = await User.query();

      const res = await webServer.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: user.email,
          password: "123456",
        },
      });

      const sessionCookie = res.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/register");

      const res2 = await webServer.inject({
        method: "GET",
        url: redirectLocation,
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      const userListAfter = await User.query();

      const root = parse(res2.body);
      const title = root.querySelector("p[data-test-id='alert']");

      assert.strictEqual(res2.statusCode, 200);
      assert.strictEqual(userListBefore.length === userListAfter.length, true);
      assert.strictEqual(unescape(title?.innerText), "User with that email already exists.");
    });
  });
});
