import assert from "assert";
import { webServer } from "../web-server";
import { step } from "mocha-steps";
import { User } from "../models/User";
import { systemCleanup, waitForStatToUpdate } from "./utils";


describe("/setup", () => {

  after(() => systemCleanup());


  step("Should return status code 200", async () => {
    const res = await webServer.inject({
      method: "GET",
      url: "/setup",
    });

    assert.strictEqual(res.statusCode, 200);
  });


  step("Should fail validation", async () => {
    const responses = await Promise.all([
      webServer.inject({
        method: "POST",
        url: "/setup",
        payload: {},
      }),
      webServer.inject({
        method: "POST",
        url: "/setup",
        payload: {
          email: "",
          password: "asdasdasdasdasdasd",
        },
      }),
      webServer.inject({
        method: "POST",
        url: "/setup",
        payload: {
          email: "someemail@somewhere.dontknowwhere",
          password: "12345",
        },
      }),
      webServer.inject({
        method: "POST",
        url: "/setup",
        payload: {
          email: "someemail@somewhere.dontknowwhere",
        },
      }),
    ]);

    responses.forEach(res =>
      assert.strictEqual(res.statusCode, 400),
    );
  });


  step("Should create first admin", async () => {
    const userListBefore = await User.query();

    const userListPromise = waitForStatToUpdate("total_users");
    const res = await webServer.inject({
      method: "POST",
      url: "/setup",
      payload: {
        email: "admin@admin.admin",
        password: "123456",
      },
    });

    const [
      userListAfter,
      totalUsers,
    ] = await Promise.all([
      User.query(),
      userListPromise,
    ]);

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(userListBefore.length, 0);
    assert.strictEqual(userListAfter.length, 1);
    assert.strictEqual(userListAfter.length, parseInt(totalUsers.value));
  });


  step("Should return status code 302", async () => {
    const res = await webServer.inject({
      method: "GET",
      url: "/setup",
    });

    assert.strictEqual(res.statusCode, 302);
  });
});
