import assert from "assert";
import { unescape } from "lodash";
import { afterEach } from "mocha";
import parse from "node-html-parser";
import { User } from "../models/User";
import { webServer } from "../web-server";
import { Cookie, systemCleanup } from "./utils";

describe("Dashboard routes", () => {
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


  describe("GET /dashboard", () => {
    it("Should redirect to login", async () => {
      const res = await webServer.inject({
        method: "GET",
        url: "/dashboard",
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/login");
    });


    it("Should return status code 200", async () => {
      const loginRes = await webServer.inject({
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

      const res = await webServer.inject({
        method: "GET",
        url: "/dashboard",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      assert.strictEqual(res.statusCode, 200);
    });
  });


  describe("POST /dashboard/address", () => {
    it("Should redirect to login", async () => {
      const res = await webServer.inject({
        method: "POST",
        url: "/dashboard/address",
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
          email: user.email,
          password: "123456",
        },
      });

      const sessionCookie = loginRes.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const testScenarios = [
        {
          payload: {},
          expectedError: "Address is required",
        },
        {
          payload: { address: "asd" },
          expectedError: "Address must be a number",
        },
        {
          payload: { address: -1 },
          expectedError: "Address must be greater than 0",
        },
        {
          payload: { address: 0 },
          expectedError: "Address must be greater than 0",
        },
        {
          payload: { address: 2340987 },
          expectedError: "You don't own the address that you are trying to delete.",
        },
      ];

      for (const scenario of testScenarios) {
        const deleteAddrRes = await webServer.inject({
          method: "POST",
          url: "/dashboard/address",
          cookies: {
            [sessionCookie.name]: `${sessionCookie.value}`,
          },
          payload: scenario.payload,
        });

        const redirectLocation = deleteAddrRes.headers["location"];
        assert.strictEqual(deleteAddrRes.statusCode, 302);
        assert.strictEqual(redirectLocation, "/dashboard");

        const dashboardRes = await webServer.inject({
          method: "GET",
          url: "/dashboard",
          cookies: {
            [sessionCookie.name]: `${sessionCookie.value}`,
          },
        });

        const root = parse(dashboardRes.body);
        const title = root.querySelector("mark[data-test-id='flash-message']");

        assert.strictEqual(dashboardRes.statusCode, 200);
        assert.strictEqual(unescape(title?.innerText), scenario.expectedError);
      }
    });


    it("Should delete the address", async () => {
      const address = await user.createEmailAddress();
      const loginRes = await webServer.inject({
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

      const deleteAddrRes = await webServer.inject({
        method: "POST",
        url: "/dashboard/address",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
        payload: {
          address: address.id,
        },
      });

      const redirectLocation = deleteAddrRes.headers["location"];
      assert.strictEqual(deleteAddrRes.statusCode, 302);
      assert.strictEqual(redirectLocation, "/dashboard");

      const dashboardRes = await webServer.inject({
        method: "GET",
        url: "/dashboard",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      const root = parse(dashboardRes.body);
      const title = root.querySelector("mark[data-test-id='flash-message']");

      assert.strictEqual(dashboardRes.statusCode, 200);
      assert.strictEqual(unescape(title?.innerText), "Address deleted successfully!");
    });
  });


  describe("GET /dashboard/inbox/:id", () => {
    it("Should redirect to login", async () => {
      const res = await webServer.inject({
        method: "GET",
        url: "/dashboard/inbox/something",
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
          email: user.email,
          password: "123456",
        },
      });

      const sessionCookie = loginRes.cookies.find(c =>
        (c as Cookie).name === "sessionId"
      ) as Cookie;

      const testScenarios = [
        {
          url: "/dashboard/inbox/some-string",
          expectedStatusCode: 400,
        },
        {
          url: "/dashboard/inbox/",
          expectedStatusCode: 400,
        },
        {
          url: "/dashboard/inbox/-1",
          expectedStatusCode: 404,
        },
      ];

      for (const scenario of testScenarios) {
        const showInboxRes = await webServer.inject({
          method: "GET",
          url: scenario.url,
          cookies: {
            [sessionCookie.name]: `${sessionCookie.value}`,
          },
        });

        assert.strictEqual(showInboxRes.statusCode, scenario.expectedStatusCode);
      }
    });


    it("Should return inbox view", async () => {
      const address = await user.createEmailAddress();
      const loginRes = await webServer.inject({
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

      const showInboxRes = await webServer.inject({
        method: "GET",
        url: `/dashboard/inbox/${address.id}`,
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      assert.strictEqual(showInboxRes.statusCode, 200);
    });
  });


  describe("POST /dashboard/inbox/email", () => {
    it("Should redirect to login", async () => {
      const res = await webServer.inject({
        method: "POST",
        url: "/dashboard/inbox/email",
      });

      const redirectLocation = res.headers["location"];
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(redirectLocation, "/login");
    });


    it("Should fail validation", async () => {
      const somebodyElse = await User.register("user2@grap.email", "123456");
      if (!somebodyElse) {
        throw new Error("Couldn't create another user.");
      }
      const address = await somebodyElse.createEmailAddress();
      const somebodyElseEmail = await address.insertEmail({});

      const loginRes = await webServer.inject({
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

      const testScenarios = [
        {
          payload: {},
          expectedError: "Email is required",
        },
        {
          payload: { email: "asd" },
          expectedError: "Email must be a number",
        },
        {
          payload: { email: -1 },
          expectedError: "Email must be greater than 0",
        },
        {
          payload: { email: 0 },
          expectedError: "Email must be greater than 0",
        },
        {
          payload: { email: 2340987 },
          expectedError: "Email not found!",
        },
        {
          payload: { email: somebodyElseEmail.id },
          expectedError: "You don't own the email that you are trying to delete.",
        },
      ];

      for (const scenario of testScenarios) {
        const deleteEmailRes = await webServer.inject({
          method: "POST",
          url: "/dashboard/inbox/email",
          cookies: {
            [sessionCookie.name]: `${sessionCookie.value}`,
          },
          payload: scenario.payload,
        });

        const redirectLocation = deleteEmailRes.headers["location"];
        assert.strictEqual(deleteEmailRes.statusCode, 302);
        assert.strictEqual(redirectLocation, "/dashboard");

        const dashboardRes = await webServer.inject({
          method: "GET",
          url: "/dashboard",
          cookies: {
            [sessionCookie.name]: `${sessionCookie.value}`,
          },
        });

        const root = parse(dashboardRes.body);
        const title = root.querySelector("mark[data-test-id='flash-message']");

        assert.strictEqual(dashboardRes.statusCode, 200);
        assert.strictEqual(unescape(title?.innerText), scenario.expectedError);
      }
    });


    it("Should delete email", async () => {
      const address = await user.createEmailAddress();
      const email = await address.insertEmail({});
      const loginRes = await webServer.inject({
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

      const deleteEmailRes = await webServer.inject({
        method: "POST",
        url: "/dashboard/inbox/email",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
        payload: {
          email: email.id,
        },
      });

      const redirectLocation = deleteEmailRes.headers["location"];
      assert.strictEqual(deleteEmailRes.statusCode, 302);
      assert.strictEqual(redirectLocation, `/dashboard/inbox/${address.id}`);

      const dashboardRes = await webServer.inject({
        method: "GET",
        url: "/dashboard",
        cookies: {
          [sessionCookie.name]: `${sessionCookie.value}`,
        },
      });

      const root = parse(dashboardRes.body);
      const title = root.querySelector("mark[data-test-id='flash-message']");

      assert.strictEqual(dashboardRes.statusCode, 200);
      assert.strictEqual(unescape(title?.innerText), "Address deleted successfully!");
    });
  });
});
