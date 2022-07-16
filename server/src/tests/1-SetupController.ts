import assert from "assert";
import { webServer } from "../web-server";
import { step } from "mocha-steps";
import { User } from "../models/User";
import { waitForStatToUpdate } from "./utils";


describe("Setup controller", () => {
  step("Should return status code 200", async () => {
    const res = await webServer.inject({
      method: "GET",
      url: "/setup",
    });

    assert.equal(res.statusCode, 200);
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
      assert.equal(res.statusCode, 400),
    );
  });


  step("Should create first admin", async () => {
    const userListBefore = await User.query();

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
      waitForStatToUpdate("total_users"),
    ]);

    assert.equal(res.statusCode, 302);
    assert.equal(userListBefore.length, 0);
    assert.equal(userListAfter.length, 1);
    assert.equal(userListAfter.length, parseInt(totalUsers.value));
  });


  step("Should return status code 302", async () => {
    const res = await webServer.inject({
      method: "GET",
      url: "/setup",
    });

    assert.equal(res.statusCode, 302);
  });
});
