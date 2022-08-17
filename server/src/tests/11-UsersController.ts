import assert from "assert";
import { unescape } from "lodash";
import { afterEach } from "mocha";
import parse from "node-html-parser";
import { Role } from "../models/Role";
import { User } from "../models/User";
import { webServer } from "../web-server";
import { Cookie, systemCleanup } from "./utils";


describe("Users routes", () => {
  let admin: User;
  let notAdmin: User;

  beforeEach(async () => {
    const [
      registered1,
      adminRole,
    ] = await Promise.all([
      User.register("user1@grap.email", "123456"),
      Role.getByName("admin"),
    ]);

    const registered2 = await User.register("user2@grap.email", "123456");
    if (!registered1 || !registered2 || !adminRole) {
      throw new Error("Failed to register user.");
    }
    admin = registered1;
    notAdmin = registered2;

    await admin.$relatedQuery<Role>("roles").relate(adminRole);
    admin = await admin.refresh();
  });

  afterEach(async () => {
    admin = undefined as unknown as User;
    notAdmin = undefined as unknown as User;
    await systemCleanup();
  });


  describe("GET /admin/users", () => {
    it("Should redirect to login", async () => {
      const res = await webServer.inject({
        method: "GET",
        url: "/admin/users",
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/login");
    });


    it("Should redirect to login because not admin", async () => {
      const loginRes = await webServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: notAdmin.email,
          password: "123456",
        },
      });

      const sessionCookie = loginRes.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const res = await webServer.inject({
        method: "GET",
        url: "/admin/users",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/login");
    });


    it("Should redirect to 404 page because missing page param", async () => {
      const loginRes = await webServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: admin.email,
          password: "123456",
        },
      });

      const sessionCookie = loginRes.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const res = await webServer.inject({
        method: "GET",
        url: "/admin/users",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/404");
    });


    it("Should return users page", async () => {
      const loginRes = await webServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: admin.email,
          password: "123456",
        },
      });

      const sessionCookie = loginRes.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const res = await webServer.inject({
        method: "GET",
        url: "/admin/users?page=1",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      assert.strictEqual(res.statusCode, 200);
    });
  });


  describe("POST /admin/user", () => {
    it("Should redirect to login", async () => {
      const res = await webServer.inject({
        method: "POST",
        url: "/admin/user",
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/login");
    });


    it("Should redirect to login because not admin", async () => {
      const loginRes = await webServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: notAdmin.email,
          password: "123456",
        },
      });

      const sessionCookie = loginRes.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const res = await webServer.inject({
        method: "POST",
        url: "/admin/user",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/login");
    });


    it("Should fail validation", async () => {
      const loginRes = await webServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: admin.email,
          password: "123456",
        },
      });

      const sessionCookie = loginRes.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const testScenarios = [
        {
          payload: {},
          expectedError: "User is required",
        },
        {
          payload: { user: "asd" },
          expectedError: "User must be a number",
        },
        {
          payload: { user: 1 },
          expectedError: "MaxEmails is required",
        },
        {
          payload: {
            user: 1,
            maxEmails: false,
          },
          expectedError: "MaxEmails must be a number",
        },
        {
          payload: {
            user: true,
            maxEmails: 2,
          },
          expectedError: "User must be a number",
        },
        {
          payload: {
            user: 99999999999,
            maxEmails: 10,
          },
          expectedError: "User not found",
        },
      ];

      for (const scenario of testScenarios) {
        const updateUserRes = await webServer.inject({
          method: "POST",
          url: "/admin/user",
          cookies: {
            [sessionCookie.name]: `${sessionCookie.value}`,
          },
          payload: scenario.payload,
        });

        const redirectLocation = updateUserRes.headers["location"];
        assert.strictEqual(updateUserRes.statusCode, 302);
        assert.strictEqual(redirectLocation, "/admin/users?page=1");

        const usersRes = await webServer.inject({
          method: "GET",
          url: "/admin/users?page=1",
          cookies: {
            [sessionCookie.name]: `${sessionCookie.value}`,
          },
        });

        const root = parse(usersRes.body);
        const title = root.querySelector("mark[data-test-id='flash-message']");

        assert.strictEqual(usersRes.statusCode, 200);
        assert.strictEqual(unescape(title?.innerText), scenario.expectedError);
      }
    });


    it("Should update user settings", async () => {
      const loginRes = await webServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: admin.email,
          password: "123456",
        },
      });

      const sessionCookie = loginRes.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      assert.strictEqual(notAdmin.settings.maxEmailAddresses, 10);

      const updateUserRes = await webServer.inject({
        method: "POST",
        url: "/admin/user",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
        payload: {
          user: notAdmin.id,
          maxEmails: 1,
        },
      });

      const redirectLocation = updateUserRes.headers["location"];
      assert.strictEqual(updateUserRes.statusCode, 302);
      assert.strictEqual(redirectLocation, "/admin/users?page=1");

      notAdmin = await notAdmin.refresh();
      assert.strictEqual(notAdmin.settings.maxEmailAddresses, 1);
    });
  });
});
