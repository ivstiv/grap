import assert from "assert";
import { afterEach } from "mocha";
import { User } from "../models/User";
import type { Cookie } from "./utils";
import { testWebServer } from "./utils";
import { systemCleanup } from "./utils";



describe("Logout routes", () => {
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


  describe("GET /logout", () => {
    it("Should redirect to login", async () => {
      const res = await testWebServer.inject({
        method: "GET",
        url: "/logout",
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/login");
    });


    it("Should destroy session and redirect to logout", async () => {
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

      const dashboardResBeforeLogout = await testWebServer.inject({
        method: "GET",
        url: "/dashboard",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      assert.strictEqual(dashboardResBeforeLogout.statusCode, 200);

      const res = await testWebServer.inject({
        method: "GET",
        url: "/logout",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/login");


      const dashboardResAfterLogout = await testWebServer.inject({
        method: "GET",
        url: "/dashboard",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      const redirectLocationAfterLogout = dashboardResAfterLogout.headers["location"];
      assert.strictEqual(dashboardResAfterLogout.statusCode, 302);
      assert.strictEqual(redirectLocationAfterLogout, "/login");
    });
  });
});
