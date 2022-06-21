import { Model } from "objection";
import { Email } from "./Email";
import { User } from "./User";


export class EmailAddress extends Model {
  static tableName = "addresses";

  id: number;
  address: string;
  owner: number;
  createdAt: string;
  static lifetimeInMinutes = 5;


  async getOwner () {
    return this.$relatedQuery<User>("user").first();
  }

  async getEmails () {
    return this.$relatedQuery<Email>("emails");
  }

  async destroy () {
    const emails = await this.getEmails();
    const deletionPromises = emails.map(e => e.destroy());
    await Promise.all(deletionPromises);
    await this.$query().delete().where({ id: this.id });
  }

  expiresIn () {
    const created = Date.parse(this.createdAt);
    const createdInMins = Math.floor(created / (1000 * 60));
    const expiresInMins = createdInMins + EmailAddress.lifetimeInMinutes;

    const now = new Date();
    const nowInMins = Math.floor(now.getTime() / (1000 * 60));

    return expiresInMins - nowInMins;
  }


  static relationMappings () {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "addresses.owner",
          to: "users.id",
        },
      },
      emails: {
        relation: Model.HasManyRelation,
        modelClass: Email,
        join: {
          from: "addresses.id",
          to: "emails.address",
        },
      },
    };
  }
}
