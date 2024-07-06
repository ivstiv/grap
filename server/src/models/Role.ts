import { Model } from "objection";
import { User } from "./User";

export class Role extends Model {
  static override tableName = "roles";

  id: number;
  name: "user" | "admin";

  static getByName (name: Role["name"]) {
    return Role.query().where({ name }).first();
  }

  async users () {
    return this.$relatedQuery<User>("users");
  }

  static override relationMappings () {
    return {
      users: {
        relation: Model.ManyToManyRelation,
        modelClass: User,
        join: {
          from: "roles.id",
          through: {
            from: "users_roles.role",
            to: "users_roles.user",
          },
          to: "users.id",
        },
      },
    };
  }
}
