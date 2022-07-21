import assert from "assert";
import { webServer } from "../web-server";
import { User } from "../models/User";
import { systemCleanup, waitForStatToUpdate } from "./utils";
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
        const registerRes = await webServer.inject({
          method: "POST",
          url: "/register",
          payload: scenario.payload,
        });

        const root = parse(registerRes.body);
        const title = root.querySelector("mark[data-test-id='error']");

        assert.strictEqual(registerRes.statusCode, 400);
        assert.strictEqual(unescape(title?.innerText), scenario.expectedError);
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

      const userListAfter = await User.query();

      const root = parse(res.body);
      const title = root.querySelector("mark[data-test-id='error']");

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(userListBefore.length === userListAfter.length, true);
      assert.strictEqual(unescape(title?.innerText), "User with that email already exists.");
    });
  });
});
