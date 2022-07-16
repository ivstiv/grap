import assert from "assert";
import { webServer } from "../web-server";


describe("Index page", () => {
  it("Should return status code 200", async () => {
    const res = await webServer.inject({
      method: "GET",
      url: "/",
    });

    assert.equal(res.statusCode, 200);
  });
});


describe("About page", () => {
  it("Should return status code 200", async () => {
    const res = await webServer.inject({
      method: "GET",
      url: "/about",
    });

    assert.equal(res.statusCode, 200);
  });
});
