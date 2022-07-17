import { Model } from "objection";
import { hash } from "bcrypt";
import { Role } from "./Role";
import { EmailAddress } from "./EmailAddress";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { Token } from "./Token";
import { randomBytes } from "crypto";
import { eventBus } from "../EventBus";
import { UserSettings } from "./UserSettings";

export class User extends Model {
  static tableName = "users";

  id: number;
  email: string;
  password: string;
  createdAt: string;
  roles: Role[]; // available only withGraphFetched
  tokens: Token[]; // available only withGraphFetched
  addresses: EmailAddress[]; // available only withGraphFetched
  settings: UserSettings; // available only withGraphFetched


  static async getById (id: number) {
    const user = await User.query()
      .where({ id })
      .withGraphFetched("[roles, tokens, addresses, settings]")
      .first();
    if (!user) {
      throw new Error(`User with id: ${id} was not found!`);
    }
    return user;
  }


  static getByEmail (email: string) {
    return User.query()
      .where({ email })
      .withGraphFetched("[roles, tokens, addresses, settings]")
      .first();
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

    await Promise.all([
      user.$relatedQuery<Role>("roles").relate(userRole),
      UserSettings.query().insert({ user: user.id }),
    ]);

    eventBus.emit({
      type: "UserRegistered",
      detail: {
        user,
      },
    });

    return User.getByEmail(email);
  }


  refresh () {
    return this.$query()
      .where({ email: this.email })
      .withGraphFetched("[roles, tokens, addresses, settings]")
      .first();
  }


  hasRole (role: Role["name"]) {
    return this.roles.some(r => r.name === role);
  }


  async destroy () {
    const addrDeletionPromises = this.addresses.map(a => a.destroy());
    const tokenDeletionPromises = this.tokens.map(a => a.destroy());

    await Promise.all([
      ...addrDeletionPromises,
      ...tokenDeletionPromises,
      this.$relatedQuery<Role>("roles").unrelate(),
      this.settings.destroy(),
    ]);
    await this.$query().delete().where({ id: this.id });
  }


  async createEmailAddress () {
    const dict = Math.random() < 0.5 ? colors : adjectives;
    const randomName = uniqueNamesGenerator({
      dictionaries: [dict, animals],
      length: 2,
      separator: ".",
    });

    const address = await EmailAddress.query().insertAndFetch({
      owner: this.id,
      address: `${randomName}@${process.env.DOMAIN}`,
    });

    eventBus.emit({
      type: "CreateAddress",
      detail: {
        address,
      },
    });

    return address;
  }


  async createToken (note = "Empty token") {
    return Token.query().insert({
      note,
      token: randomBytes(20).toString("hex"),
      owner: this.id,
    });
  }


  static relationMappings () {
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
      addresses: {
        relation: Model.HasManyRelation,
        modelClass: EmailAddress,
        join: {
          from: "users.id",
          to: "addresses.owner",
        },
      },
      tokens: {
        relation: Model.HasManyRelation,
        modelClass: Token,
        join: {
          from: "users.id",
          to: "tokens.owner",
        },
      },
      settings: {
        relation: Model.HasOneRelation,
        modelClass: UserSettings,
        join: {
          from: "users.id",
          to: "user_settings.user",
        },
      },
    };
  }
}
