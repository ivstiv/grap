import { Model } from "objection";
import { hash } from "bcrypt";
import { Role } from "./Role";

export class User extends Model {
  static tableName = "users";

  id: number;
  email: string;
  password: string;
  createdAt: string;

  static getByEmail (email: string) {
    return User.query().where({ email }).first();
  }

  static async register (email: string, plainPassword: string) {
    const password = await hash(plainPassword, 12);
    const [
      user,
      userRole,
    ] = await Promise.all([
      User.query()
        .insertAndFetch({ email, password })
        .first(),
      Role.getByName("user"),
    ]);

    if (!userRole) {
      throw new Error("Couldn't find user role!");
    }

    await user.$relatedQuery<Role>("roles").relate(userRole);
    return user;
  }

  async destroy () {
    await this.$relatedQuery<Role>("roles").unrelate();
    await this.$query().delete().where({ id: this.id });
  }


  async roles () {
    const roles = await this.$relatedQuery<Role>("roles");
    return roles.map(r => r.name);
  }


  static get relationMappings () {
    return {
      roles: {
        relation: Model.ManyToManyRelation,
        modelClass: Role,
        join: {
          from: "users.id",
          through: {
            from: "users_roles.user",
            to: "users_roles.role",
          },
          to: "roles.id",
        },
      },
    };
  }
}
