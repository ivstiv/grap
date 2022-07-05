import { Model } from "objection";


export class UserSettings extends Model {
  static tableName = "user_settings";
  static idColumn = "user";

  user: number;
  maxEmailAddresses: number;
  maxTokens: number;

  async destroy () {
    return this.$query().delete().where({ user: this.user });
  }
}
