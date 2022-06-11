import { Model } from "objection";
import { hash } from "bcrypt";

export class User extends Model {
  static tableName = "users";

  id: number;
  email: string;
  password: string;
  createdAt: string;

  static async register (email: string, plainPassword: string) {
    const password = await hash(plainPassword, 12);
    return User.query()
      .insertAndFetch({ email, password })
      .first();
  }
}
