import { Model } from "objection";
import { User } from "./User";


export class Token extends Model {
  static tableName = "tokens";

  id: number;
  token: string;
  note: string;
  owner: number;
  createdAt: string;


  static async isTokenValid (token: string) {
    const fetchedToken = await Token.query().where({ token }).first();
    return !!fetchedToken;
  }


  async getOwner () {
    return this.$relatedQuery<User>("user").first();
  }


  async destroy () {
    return this.$query().delete().where({ token: this.token });
  }


  static relationMappings () {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "tokens.owner",
          to: "users.id",
        },
      },
    };
  }
}
