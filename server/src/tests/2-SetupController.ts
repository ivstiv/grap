import assert from "assert";
import { webServer } from "../web-server";
import { User } from "../models/User";
import { Cookie, systemCleanup, waitForStatToUpdate } from "./utils";
import parse from "node-html-parser";
import { unescape } from "lodash";
import { Role } from "../models/Role";


describe("Setup routes", () => {

  after(() => systemCleanup());

  describe("GET /setup", () => {
    after(() => systemCleanup());

    it("Should return setup page", async () => {
      const res = await webServer.inject({
        method: "GET",
        url: "/setup",
      });

      assert.strictEqual(res.statusCode, 200);
    });


    it("Should redirect to login", async () => {
      const firstAdmin = await User.register("user1@grap.email", "123456");
      const adminRole = await Role.getByName("admin");
      if (!firstAdmin) {
        throw new Error("Failed to register user.");
      }
      if (!adminRole) {
        throw new Error("Missing admin role!");
      }
      await firstAdmin.$relatedQuery<Role>("roles").relate(adminRole);
      const res = await webServer.inject({
        method: "GET",
        url: "/setup",
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/");
    });
  });


  describe("POST /setup", () => {
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
        const setupRes = await webServer.inject({
          method: "POST",
          url: "/setup",
          payload: scenario.payload,
        });

        const sessionCookie = setupRes.cookies.find(c =>
          (c as Cookie).name === "sessionId"
        ) as Cookie;

        const redirectLocation = setupRes.headers["location"];
        assert.strictEqual(setupRes.statusCode, 302);
        assert.strictEqual(redirectLocation, "/setup");

        const setupRes2 = await webServer.inject({
          method: "GET",
          url: redirectLocation,
          cookies: {
            [sessionCookie.name]: `${sessionCookie.value}`,
          },
        });

        const root = parse(setupRes2.body);
        const alert = root.querySelector("p[data-test-id='alert']");

        assert.strictEqual(setupRes2.statusCode, 200);
        assert.strictEqual(unescape(alert?.innerText), scenario.expectedError);
      }
    });


    it("Should register user", async () => {
      const userListBefore = await User.query();

      const userListPromise = waitForStatToUpdate("total_users");
      const res = await webServer.inject({
        method: "POST",
        url: "/setup",
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
  });
});
