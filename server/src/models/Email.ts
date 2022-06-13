import { Model } from "objection";
import { EmailAddress } from "./EmailAddress";


export class Email extends Model {
  static tableName = "emails";

  id: number;
  address: number;
  subject: string;
  content: string;
  from: string;
  createdAt: string;

  async getAddress () {
    return this.$relatedQuery<EmailAddress>("emailAddress").first();
  }

  async destroy () {
    return this.$query().delete().where({ id: this.id });
  }

  static relationMappings () {
    return {
      emailAddress: {
        relation: Model.BelongsToOneRelation,
        modelClass: EmailAddress,
        join: {
          from: "emails.address",
          to: "addresses.id",
        },
      },
    };
  }
}
