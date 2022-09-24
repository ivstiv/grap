import assert from "assert";
import { unescape } from "lodash";
import parse from "node-html-parser";
import { Role } from "../models/Role";
import { SystemSetting } from "../models/SystemSetting";
import { User } from "../models/User";
import { webServer } from "../web-server";
import { Cookie, systemCleanup } from "./utils";

describe("System settings routes", () => {
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


  describe("GET /admin/system-settings", () => {
    it("Should redirect to login because not logged in", async () => {
      const res = await webServer.inject({
        method: "GET",
        url: "/admin/system-settings",
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
        url: "/admin/system-settings",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/login");
    });


    it("Should return system settings page", async () => {
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
        url: "/admin/system-settings",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      assert.strictEqual(res.statusCode, 200);
    });
  });


  describe("POST /admin/system-settings", () => {
    it("Should redirect to login because not logged in", async () => {
      const res = await webServer.inject({
        method: "POST",
        url: "/admin/system-settings",
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
        url: "/admin/system-settings",
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
          expectedError: "disable_docs_page is required",
        },
        {
          payload: { disable_docs_page: "asd" },
          expectedError: "disable_docs_page must have a value of true or false.",
        },
        {
          payload: { disable_docs_page: "true" },
          expectedError: "disable_index_page is required",
        },
        {
          payload: {
            disable_docs_page: "true",
            disable_index_page: false,
          },
          expectedError: "disable_index_page must be a string",
        },
        {
          payload: {
            disable_docs_page: 0,
            disable_index_page: false,
          },
          expectedError: "disable_docs_page must be a string",
        },
        {
          payload: {
            disable_docs_page: "true",
            disable_index_page: "false",
          },
          expectedError: "disable_register_page is required",
        },
      ];

      for (const scenario of testScenarios) {
        const updateSettingsRes = await webServer.inject({
          method: "POST",
          url: "/admin/system-settings",
          cookies: {
            [sessionCookie.name]: `${sessionCookie.value}`,
          },
          payload: scenario.payload,
        });

        const redirectLocation = updateSettingsRes.headers["location"];
        assert.strictEqual(updateSettingsRes.statusCode, 302);
        assert.strictEqual(redirectLocation, "/admin/system-settings");

        const settingsRes = await webServer.inject({
          method: "GET",
          url: "/admin/system-settings",
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


    it("Should update system settings", async () => {
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

      const systemSettingsBefore = await SystemSetting.getAll();
      for(const setting of systemSettingsBefore) {
        assert.strictEqual(setting.value, "false");
      }

      const updateSettingsRes = await webServer.inject({
        method: "POST",
        url: "/admin/system-settings",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
        payload: {
          disable_docs_page: "true",
          disable_index_page: "true",
          disable_register_page: "true",
        },
      });

      const redirectLocation = updateSettingsRes.headers["location"];
      assert.strictEqual(updateSettingsRes.statusCode, 302);
      assert.strictEqual(redirectLocation, "/admin/system-settings");

      const systemSettingsAfter = await SystemSetting.getAll();
      for(const setting of systemSettingsAfter) {
        assert.strictEqual(setting.value, "true");
      }
    });
  });
});
