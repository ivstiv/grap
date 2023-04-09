import assert from "assert";
import { SystemSetting } from "../models/SystemSetting";
import { systemCleanup } from "./utils";



describe("System setting", () => {

  after(() => systemCleanup());


  it("Should return all settings", async () => {
    const settings = await SystemSetting.getAll();
    assert.strictEqual(settings.length, 3);
  });


  it("Should update a setting", async () => {
    const settingBefore = await SystemSetting
      .getByName("disable_docs_page");
    await SystemSetting
      .updateByName("disable_docs_page", "true");
    const settingAfter = await SystemSetting
      .getByName("disable_docs_page");
    assert.strictEqual(settingBefore.value, "false");
    assert.strictEqual(settingAfter.value, "true");
  });
});
