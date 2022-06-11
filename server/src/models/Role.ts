import { Model } from "objection";

export class Role extends Model {
  static tableName = "roles";

  id: number;
  name: string;
}
