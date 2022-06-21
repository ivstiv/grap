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

export class User extends Model {
  static tableName = "users";

  id: number;
  email: string;
  password: string;
  createdAt: string;


  getLimits () {
    return{
      maxTokens: 5,
      maxEmailAddresses: 10,
    };
  }


  static async getById (id: number) {
    const user = await User.query().where({ id }).first();
    if (!user) {
      throw new Error(`User with id: ${id} was not found!`);
    }
    return user;
  }


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
    const addresses = await this.addresses();
    const addrDeletionPromises = addresses.map(a => a.destroy());

    const tokens = await this.tokens();
    const tokenDeletionPromises = tokens.map(a => a.destroy());

    await Promise.all([
      ...addrDeletionPromises,
      ...tokenDeletionPromises,
      this.$relatedQuery<Role>("roles").unrelate(),
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

    return EmailAddress.query().insert({
      owner: this.id,
      address: `${randomName}@${process.env.DOMAIN}`,
    });
  }


  async createToken (note = "Empty token") {
    return Token.query().insert({
      note,
      token: randomBytes(20).toString("hex"),
      owner: this.id,
    });
  }

  async tokens () {
    return this.$relatedQuery<Token>("tokens");
  }


  async addresses () {
    return this.$relatedQuery<EmailAddress>("addresses");
  }


  async roles () {
    const roles = await this.$relatedQuery<Role>("roles");
    return roles.map(r => r.name);
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
    };
  }
}
