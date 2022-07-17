import { Model } from "objection";
import { eventBus } from "../EventBus";
import { Email } from "./Email";
import { User } from "./User";

type EmailArgs = {
  subject?: string
  from?: string
  content?: string
}


export class EmailAddress extends Model {
  static tableName = "addresses";

  id: number;
  address: string;
  owner: number;
  createdAt: string;
  static lifetimeInMinutes = 30;


  async insertEmail (args: EmailArgs) {
    const email = await Email.query().insertAndFetch({
      address: this.id,
      subject: args.subject ?? "Missing subject",
      from: args.from ?? "Mising sender",
      content: args.content
        || "Couldn't parse the email contents. Open a github issue and let me know who the sender of the email was, so I can test and amend the parsing.",
    });
    eventBus.emit({
      type: "ParsedEmail",
      detail: {
        email,
      },
    });
    return email;
  }

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

  expiresInMins () {
    const created = Date.parse(this.createdAt);
    const createdInMins = Math.floor(created / (1000 * 60));
    const expiresInMins = createdInMins + EmailAddress.lifetimeInMinutes;
    const nowInMins = Math.floor(Date.now() / (1000 * 60));
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
