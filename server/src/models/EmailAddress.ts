import { Model } from "objection";
import { User } from "./User";


export class EmailAddress extends Model {
  static tableName = "addresses";

  id: number;
  address: string;
  owner: number;
  createdAt: string;
  static lifetimeInMinutes = 60;


  async getOwner () {
    return this.$relatedQuery<User>("user");
  }

  expiresIn () {
    const created = Date.parse(this.createdAt);
    const createdInMins = Math.floor(created / (1000 * 60));
    const expiresInMins = createdInMins + EmailAddress.lifetimeInMinutes;

    const now = new Date();
    const nowInMins = Math.floor(now.getTime() / (1000 * 60));

    return expiresInMins - nowInMins;
  }


  static get relationMappings () {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "addresses.owner",
          to: "users.id",
        },
      },
    };
  }
}
