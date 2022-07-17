import assert from "assert";
import { webServer } from "../web-server";
import { step } from "mocha-steps";
import { User } from "../models/User";
import { Cookie, systemCleanup } from "./utils";


describe("Login controller", () => {

  after(() => systemCleanup());


  step("Should return status code 200", async () => {
    const res = await webServer.inject({
      method: "GET",
      url: "/login",
    });

    assert.strictEqual(res.statusCode, 200);
  });


  step("Should fail validation", async () => {
    const responses = await Promise.all([
      webServer.inject({
        method: "POST",
        url: "/login",
        payload: {},
      }),
      webServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: "",
          password: "asdasdasdasdasdasd",
        },
      }),
      webServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: "someemail@somewhere.dontknowwhere",
          password: "12345",
        },
      }),
      webServer.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: "someemail@somewhere.dontknowwhere",
        },
      }),
    ]);

    responses.forEach(res =>
      assert.strictEqual(res.statusCode, 400),
    );
  });

  let sessionCookie: Cookie | undefined;

  step("Should login user", async () => {
    await User.register("user2@grap.email", "123456");

    const res = await webServer.inject({
      method: "POST",
      url: "/login",
      payload: {
        email: "user2@grap.email",
        password: "123456",
      },
    });

    const redirectLocation = res.headers["location"];
    sessionCookie = res.cookies.find(c => 
      (c as Cookie).name === "sessionId"
    ) as Cookie;

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(redirectLocation, "/dashboard");
  });


  step("Should load dashboard with status code 200", async () => {
    if (sessionCookie === undefined) {
      throw new Error("sessionCookie is undefined!");
    }

    const res = await webServer.inject({
      method: "GET",
      url: "/dashboard",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    assert.strictEqual(res.statusCode, 200);
  });


  step("Should redirect to login with status code 302", async () => {
    if (sessionCookie === undefined) {
      throw new Error("sessionCookie is undefined!");
    }

    const res = await webServer.inject({
      method: "GET",
      url: "/dashboard",
      cookies: {
        [sessionCookie.name]: `${sessionCookie.value}+somethingrantom`,
      },
    });

    const redirectLocation = res.headers["location"];

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(redirectLocation, "/login");
  });
});
