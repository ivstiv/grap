import assert from "assert";
import { Role } from "../models/Role";
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
});
