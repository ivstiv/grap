import { Model } from "objection";


export type StatName = 
  | "total_users"
  | "total_emails"
  | "total_addresses";


export class SystemStat extends Model {
  static tableName = "stats";
  static idColumn = "name";

  name: StatName;
  value: string;

  static async getAll () {
    const stats = await Promise.all([
      SystemStat.getByName("total_users"),
      SystemStat.getByName("total_emails"),
      SystemStat.getByName("total_addresses"),
    ]);
    return stats;
  }

  static async getByName (name: StatName) {
    const stat = await SystemStat.query().where({ name }).first();
    if (!stat) {
      return SystemStat.getDefaultSetting(name);
    }
    return stat;
  }

  static async incrementByName (name: StatName) {
    const stat = await SystemStat.getByName(name);
    return await SystemStat.updateByName(name, String(parseInt(stat.value) + 1));
  }

  static async updateByName (name: StatName, value: string) {
    const stat = await SystemStat.query().where({ name }).first();
    if (!stat) {
      return SystemStat.getDefaultSetting(name);
    }
    return stat.$query().updateAndFetch({ value }).where({ name });
  }


  private static getDefaultSetting (name: StatName) {
    const defaultValues: Record<StatName, string> = {
      "total_addresses": "0",
      "total_emails": "0",
      "total_users": "0",
    };

    return SystemStat.query().insertAndFetch({
      name,
      value: defaultValues[name],
    });
  }
}
