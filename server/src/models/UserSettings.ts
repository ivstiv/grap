import { Model } from "objection";


export class UserSettings extends Model {
  static override tableName = "user_settings";
  static override idColumn = "user";

  user: number;
  maxEmailAddresses: number;
  maxTokens: number;

  async destroy () {
    return this.$query().delete().where({ user: this.user });
  }
}
