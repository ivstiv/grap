import assert from "assert";
import type { Email } from "../models/Email";
import type { EmailAddress } from "../models/EmailAddress";
import { User } from "../models/User";
import type { Cookie } from "./utils";
import { testWebServer } from "./utils";
import { systemCleanup } from "./utils";
import { z } from "zod";



describe("API V1 routes", () => {
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


  describe("GET /api/v1/address", () => {
    it("Should return Unauthorized", async () => {
      const res = await testWebServer.inject({
        method: "GET",
        url: "/api/v1/address",
      });

      assert.strictEqual(res.statusCode, 403);
      assert.deepStrictEqual(JSON.parse(res.body), {
        statusCode: 403,
        error: "Unauthorised",
        message: "Missing bearer token and session.",
      });
    });


    it("Should return invalid header error", async () => {
      const res = await testWebServer.inject({
        method: "GET",
        url: "/api/v1/address",
        headers: {
          "authorization": "something random",
        },
      });

      assert.strictEqual(res.statusCode, 403);
      assert.deepStrictEqual(JSON.parse(res.body), {
        statusCode: 403,
        error: "Unauthorised",
        message: "Invalid header format. Expecting 'Authorization: Bearer token'.",
      });
    });


    it("Should return email address with token", async () => {
      const token = await user.createToken();
      const userAddressesBefore = user.addresses.length;

      const res = await testWebServer.inject({
        method: "GET",
        url: "/api/v1/address",
        headers: {
          "authorization": `Bearer ${token.token}`,
        },
      });

      user = await user.refresh();
      const userAddressesAfter = user.addresses.length;

      const ExpectedResponseBody = z.object({
        data: z.string().nonempty(),
      });
      const jsonBody = JSON.parse(res.body);
      ExpectedResponseBody.parse(jsonBody);

      assert.strictEqual(userAddressesBefore, 0);
      assert.strictEqual(userAddressesAfter, 1);
    });


    it("Should return email address with session", async () => {
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

      const userAddressesBefore = user.addresses.length;

      const addressRes = await testWebServer.inject({
        method: "GET",
        url: "/api/v1/address",
        cookies: {
          [sessionCookie.name]: sessionCookie.value,
        },
      });

      user = await user.refresh();
      const userAddressesAfter = user.addresses.length;

      const ExpectedResponseBody = z.object({
        data: z.string().nonempty(),
      });
      const jsonBody = JSON.parse(addressRes.body);
      ExpectedResponseBody.parse(jsonBody);

      assert.strictEqual(userAddressesBefore, 0);
      assert.strictEqual(userAddressesAfter, 1);
    });
  });



  describe("GET /api/v1/inbox/:address/latest", () => {
    let email: Email;
    let address: EmailAddress;

    beforeEach(async () => {
      address = await user.createEmailAddress();
      email = await address.insertEmail({});
    });


    it("Should return Unauthorized", async () => {
      const res = await testWebServer.inject({
        method: "GET",
        url: `/api/v1/inbox/${address.address}/latest`,
      });

      assert.strictEqual(res.statusCode, 403);
      assert.deepStrictEqual(JSON.parse(res.body), {
        statusCode: 403,
        error: "Unauthorised",
        message: "Missing bearer token and session.",
      });
    });


    it("Should return invalid header error", async () => {
      const res = await testWebServer.inject({
        method: "GET",
        url: `/api/v1/inbox/${address.address}/latest`,
        headers: {
          "authorization": "something random",
        },
      });

      assert.strictEqual(res.statusCode, 403);
      assert.deepStrictEqual(JSON.parse(res.body), {
        statusCode: 403,
        error: "Unauthorised",
        message: "Invalid header format. Expecting 'Authorization: Bearer token'.",
      });
    });


    it("Should return latest email with token", async () => {
      const token = await user.createToken();

      const res = await testWebServer.inject({
        method: "GET",
        url: `/api/v1/inbox/${address.address}/latest`,
        headers: {
          "authorization": `Bearer ${token.token}`,
        },
      });

      const ExpectedResponseBody = z.object({
        data: z.object({
          subject: z.string(),
          content: z.string(),
          from: z.string(),
          createdAt: z.string(),
        }),
      });
      const jsonBody = JSON.parse(res.body);
      const parsedBody = ExpectedResponseBody.parse(jsonBody);

      const parsedEmail = parsedBody.data;

      assert.strictEqual(parsedEmail.subject, email.subject);
      assert.strictEqual(parsedEmail.content, email.content);
      assert.strictEqual(parsedEmail.from, email.from);
      assert.strictEqual(parsedEmail.createdAt, email.createdAt);
    });


    it("Should return latest email with session", async () => {
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

      const emailRes = await testWebServer.inject({
        method: "GET",
        url: `/api/v1/inbox/${address.address}/latest`,
        cookies: {
          [sessionCookie.name]: sessionCookie.value,
        },
      });

      const ExpectedResponseBody = z.object({
        data: z.object({
          subject: z.string(),
          content: z.string(),
          from: z.string(),
          createdAt: z.string(),
        }),
      });
      const jsonBody = JSON.parse(emailRes.body);
      const parsedBody = ExpectedResponseBody.parse(jsonBody);

      const parsedEmail = parsedBody.data;

      assert.strictEqual(parsedEmail.subject, email.subject);
      assert.strictEqual(parsedEmail.content, email.content);
      assert.strictEqual(parsedEmail.from, email.from);
      assert.strictEqual(parsedEmail.createdAt, email.createdAt);
    });
  });
});
