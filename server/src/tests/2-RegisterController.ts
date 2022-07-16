import assert from "assert";
import { webServer } from "../web-server";
import { step } from "mocha-steps";
import { User } from "../models/User";
import { waitForStatToUpdate } from "./utils";


describe("Register controller", () => {
  step("Should return status code 200", async () => {
    const res = await webServer.inject({
      method: "GET",
      url: "/register",
    });

    assert.equal(res.statusCode, 200);
  });


  step("Should fail validation", async () => {
    const responses = await Promise.all([
      webServer.inject({
        method: "POST",
        url: "/register",
        payload: {},
      }),
      webServer.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: "",
          password: "asdasdasdasdasdasd",
        },
      }),
      webServer.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: "someemail@somewhere.dontknowwhere",
          password: "12345",
        },
      }),
      webServer.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: "someemail@somewhere.dontknowwhere",
        },
      }),
    ]);

    responses.forEach(res =>
      assert.equal(res.statusCode, 400),
    );
  });


  step("Should register user", async () => {
    const userListBefore = await User.query();

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
      waitForStatToUpdate("total_users"),
    ]);

    assert.equal(res.statusCode, 302);
    assert.equal(redirectLocation, "/dashboard");
    assert.equal(userListBefore.length < userListAfter.length, true);
    assert.equal(userListAfter.length, parseInt(totalUsers.value));
  });


  step("Should fail to register user with the same email", async () => {
    const userListBefore = await User.query();

    const res = await webServer.inject({
      method: "POST",
      url: "/register",
      payload: {
        email: "user1@grap.email",
        password: "123456",
      },
    });

    const userListAfter = await User.query();

    assert.equal(res.statusCode, 400);
    assert.equal(userListBefore.length === userListAfter.length, true);
  });
});
