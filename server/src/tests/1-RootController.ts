import assert from "assert";
import { webServer } from "../web-server";
import { parse } from "node-html-parser";


describe("/", () => {
  it("Should return status code 200", async () => {
    const res = await webServer.inject({
      method: "GET",
      url: "/",
    });

    assert.strictEqual(res.statusCode, 200);
  });
});


describe("/about", () => {
  it("Should return status code 200", async () => {
    const res = await webServer.inject({
      method: "GET",
      url: "/about",
    });

    assert.strictEqual(res.statusCode, 200);
  });
});


describe("/not-exist-expect-404", () => {
  it("Should return 404 page", async () => {
    const res = await webServer.inject({
      method: "GET",
      url: "/not-exist-expect-404",
    });

    const root = parse(res.body);
    const title = root.querySelector("h1[data-test-id='title']");

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(title?.innerText, "404 Not Found");
  });
});
