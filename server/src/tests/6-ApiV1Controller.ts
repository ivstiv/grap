import assert from "assert";
import { Email } from "../models/Email";
import { EmailAddress } from "../models/EmailAddress";
import { User } from "../models/User";
import { webServer } from "../web-server";
import { Cookie, systemCleanup } from "./utils";

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
      const res = await webServer.inject({
        method: "GET",
        url: "/api/v1/address",
      });

      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.body, "Unauthorized");
    });


    it("Should return invalid header error", async () => {
      const res = await webServer.inject({
        method: "GET",
        url: "/api/v1/address",
        headers: {
          "authorization": "something random",
        },
      });

      const parsedError = JSON.parse(res.body);
      const expectedError = {
        error: "Invalid header format. Expecting 'Authorization: Bearer token'.",
      };
      assert.strictEqual(res.statusCode, 401);
      assert.deepStrictEqual(parsedError, expectedError);
    });


    it("Should return email address with token", async () => {
      const token = await user.createToken();
      const userAddressesBefore = user.addresses.length;

      const res = await webServer.inject({
        method: "GET",
        url: "/api/v1/address",
        headers: {
          "authorization": `Bearer ${token.token}`,
        },
      });

      user = await user.refresh();
      const userAddressesAfter = user.addresses.length;

      const parsedBody = JSON.parse(res.body);

      if (!parsedBody.data) {
        throw new Error("Missing email address in response.");
      }

      assert.strictEqual(userAddressesBefore, 0);
      assert.strictEqual(userAddressesAfter, 1);
    });


    it("Should return email address with session", async () => {
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

      const userAddressesBefore = user.addresses.length;

      const addressRes = await webServer.inject({
        method: "GET",
        url: "/api/v1/address",
        cookies: {
          [sessionCookie.name]: sessionCookie.value,
        },
      });

      user = await user.refresh();
      const userAddressesAfter = user.addresses.length;

      const parsedBody = JSON.parse(addressRes.body);

      if (!parsedBody.data) {
        throw new Error("Missing email address in response.");
      }

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
      const res = await webServer.inject({
        method: "GET",
        url: `/api/v1/inbox/${address.address}/latest`,
      });

      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.body, "Unauthorized");
    });


    it("Should return invalid header error", async () => {
      const res = await webServer.inject({
        method: "GET",
        url: `/api/v1/inbox/${address.address}/latest`,
        headers: {
          "authorization": "something random",
        },
      });

      const parsedError = JSON.parse(res.body);
      const expectedError = {
        error: "Invalid header format. Expecting 'Authorization: Bearer token'.",
      };
      assert.strictEqual(res.statusCode, 401);
      assert.deepStrictEqual(parsedError, expectedError);
    });


    it("Should return latest email with token", async () => {
      const token = await user.createToken();

      const res = await webServer.inject({
        method: "GET",
        url: `/api/v1/inbox/${address.address}/latest`,
        headers: {
          "authorization": `Bearer ${token.token}`,
        },
      });

      const parsedBody = JSON.parse(res.body);

      if (!parsedBody.data) {
        throw new Error("Missing email in response.");
      }

      const parsedEmail = parsedBody.data;

      assert.strictEqual(parsedEmail.subject, email.subject);
      assert.strictEqual(parsedEmail.content, email.content);
      assert.strictEqual(parsedEmail.from, email.from);
      assert.strictEqual(parsedEmail.createdAt, email.createdAt);
    });


    it("Should return latest email with session", async () => {
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

      const emailRes = await webServer.inject({
        method: "GET",
        url: `/api/v1/inbox/${address.address}/latest`,
        cookies: {
          [sessionCookie.name]: sessionCookie.value,
        },
      });

      const parsedBody = JSON.parse(emailRes.body);

      if (!parsedBody.data) {
        throw new Error("Missing email in response.");
      }

      const parsedEmail = parsedBody.data;

      assert.strictEqual(parsedEmail.subject, email.subject);
      assert.strictEqual(parsedEmail.content, email.content);
      assert.strictEqual(parsedEmail.from, email.from);
      assert.strictEqual(parsedEmail.createdAt, email.createdAt);
    });
  });
});
