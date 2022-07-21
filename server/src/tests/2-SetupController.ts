import assert from "assert";
import { webServer } from "../web-server";
import { User } from "../models/User";
import { systemCleanup, waitForStatToUpdate } from "./utils";
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
          expectedError: "password is a required field",
        },
        {
          payload: {
            email: "",
            password: "asdasdasdasdasdasd",
          },
          expectedError: "email is a required field",
        },
        {
          payload: {
            email: "someemail@somewhere.dontknowwhere",
            password: "12345",
          },
          expectedError: "password must be at least 6 characters",
        },
        {
          payload: {
            email: "someemail@somewhere.dontknowwhere",
          },
          expectedError: "password is a required field",
        },
        {
          payload: {
            email: 2340987,
            password: "123456",
          },
          expectedError: "email must be a valid email",
        },
      ];

      for (const scenario of testScenarios) {
        const setupRes = await webServer.inject({
          method: "POST",
          url: "/setup",
          payload: scenario.payload,
        });

        const root = parse(setupRes.body);
        const title = root.querySelector("mark[data-test-id='error']");

        assert.strictEqual(setupRes.statusCode, 400);
        assert.strictEqual(unescape(title?.innerText), scenario.expectedError);
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
