import assert from "assert";
import { webServer } from "../web-server";
import { parse } from "node-html-parser";


describe("Index page", () => {
  it("Should return status code 200", async () => {
    const res = await webServer.inject({
      method: "GET",
      url: "/",
    });

    assert.strictEqual(res.statusCode, 200);
  });
});


describe("About page", () => {
  it("Should return status code 200", async () => {
    const res = await webServer.inject({
      method: "GET",
      url: "/about",
    });

    assert.strictEqual(res.statusCode, 200);
  });
});


describe("404 page", () => {
  it("Should return 404 page", async () => {
    const res = await webServer.inject({
      method: "GET",
      url: "/not-exist",
    });

    const root = parse(res.body);
    const title = root.querySelector("h1[data-test-id='title']");

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(title?.innerText, "404 Not Found");
  });
});
