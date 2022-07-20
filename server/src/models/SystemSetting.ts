import { Model } from "objection";


export type SettingName =
  | "disable_register_page"
  | "disable_index_page"
  | "disable_about_page";


export class SystemSetting extends Model {
  static tableName = "settings";
  static idColumn = "name";

  name: SettingName;
  value: string;

  static async getAll () {
    const settings = await Promise.all([
      SystemSetting.getByName("disable_register_page"),
      SystemSetting.getByName("disable_index_page"),
      SystemSetting.getByName("disable_about_page"),
    ]);
    return settings;
  }

  static async getByName (name: SettingName) {
    const setting = await SystemSetting.query().where({ name }).first();
    if (!setting) {
      return SystemSetting.getDefaultSetting(name);
    }
    return setting;
  }

  static async updateByName (name: SettingName, value: string) {
    const setting = await SystemSetting.query().where({ name }).first();
    if (!setting) {
      return SystemSetting.getDefaultSetting(name);
    }
    return setting.$query().updateAndFetch({ value }).where({ name });
  }


  private static getDefaultSetting (name: SettingName) {
    const defaultValues: Record<SettingName, string> = {
      "disable_register_page": "false",
      "disable_index_page": "false",
      "disable_about_page": "false",
    };

    return SystemSetting.query().insertAndFetch({
      name,
      value: defaultValues[name],
    });
  }
}
