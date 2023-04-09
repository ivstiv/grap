import assert from "assert";
import { parse } from "node-html-parser";
import { SystemSetting } from "../models/SystemSetting";
import type { Cookie } from "./utils";
import { testWebServer } from "./utils";
import { systemCleanup } from "./utils";
import { User } from "../models/User";
import { Role } from "../models/Role";



describe("Root pages", () => {
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

  describe("GET /", () => {
    after(() => systemCleanup());

    it("Should return status code 200", async () => {
      const res = await testWebServer.inject({
        method: "GET",
        url: "/",
      });

      assert.strictEqual(res.statusCode, 200);
    });


    it("Should return the page with a user session", async () => {
      const [
        loginResUser,
        loginResAdmin,
      ] = await Promise.all([
        testWebServer.inject({
          method: "POST",
          url: "/login",
          payload: {
            email: notAdmin.email,
            password: "123456",
          },
        }),
        testWebServer.inject({
          method: "POST",
          url: "/login",
          payload: {
            email: admin.email,
            password: "123456",
          },
        }),
      ]);

      const sessionCookieUser = loginResUser.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const sessionCookieAdmin = loginResAdmin.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const [
        resUser,
        resAdmin,
      ] = await Promise.all([
        testWebServer.inject({
          method: "GET",
          url: "/",
          cookies: {
            [sessionCookieUser.name]: `${sessionCookieUser.value}`,
          },
        }),
        testWebServer.inject({
          method: "GET",
          url: "/",
          cookies: {
            [sessionCookieAdmin.name]: `${sessionCookieAdmin.value}`,
          },
        }),
      ]);

      assert.strictEqual(resUser.statusCode, 200);
      assert.strictEqual(resAdmin.statusCode, 200);
    });


    it("Should redirect to login because index is disabled", async () => {
      await SystemSetting.updateByName("disable_index_page", "true");
      const res = await testWebServer.inject({
        method: "GET",
        url: "/",
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/login");
    });
  });


  // describe("GET /documentation", () => {
  //   it("Should return status code 200", async () => {
  //     const res = await testWebServer.inject({
  //       method: "GET",
  //       url: "/documentation",
  //     });

  //     assert.strictEqual(res.statusCode, 200);
  //   });


  //   it("Should return the page with a user session", async () => {
  //     const [
  //       loginResUser,
  //       loginResAdmin,
  //     ] = await Promise.all([
  //       testWebServer.inject({
  //         method: "POST",
  //         url: "/login",
  //         payload: {
  //           email: notAdmin.email,
  //           password: "123456",
  //         },
  //       }),
  //       testWebServer.inject({
  //         method: "POST",
  //         url: "/login",
  //         payload: {
  //           email: admin.email,
  //           password: "123456",
  //         },
  //       }),
  //     ]);

  //     const sessionCookieUser = loginResUser.cookies.find(c =>
  //       (c as Cookie).name === "sessionId"
  //     ) as Cookie;

  //     const sessionCookieAdmin = loginResAdmin.cookies.find(c =>
  //       (c as Cookie).name === "sessionId"
  //     ) as Cookie;

  //     const [
  //       resUser,
  //       resAdmin,
  //     ] = await Promise.all([
  //       testWebServer.inject({
  //         method: "GET",
  //         url: "/documentation",
  //         cookies: {
  //           [sessionCookieUser.name]: `${sessionCookieUser.value}`,
  //         },
  //       }),
  //       testWebServer.inject({
  //         method: "GET",
  //         url: "/documentation",
  //         cookies: {
  //           [sessionCookieAdmin.name]: `${sessionCookieAdmin.value}`,
  //         },
  //       }),
  //     ]);

  //     assert.strictEqual(resUser.statusCode, 200);
  //     assert.strictEqual(resAdmin.statusCode, 200);
  //   });
  // });


  describe("GET /not-exist-expect-404", () => {
    it("Should return 404 page", async () => {
      const res = await testWebServer.inject({
        method: "GET",
        url: "/not-exist-expect-404",
      });

      const root = parse(res.body);
      const title = root.querySelector("h1[data-test-id='title']");

      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(title?.innerText, "404 Not Found");
    });
  });
});
