import assert from "assert";
import { step } from "mocha-steps";
import { Email } from "../models/Email";
import { EmailAddress } from "../models/EmailAddress";
import { Token } from "../models/Token";
import { User } from "../models/User";
import { systemCleanup } from "./utils";



describe("User model", () => {

  after(() => systemCleanup());

  const USER_EMAIL = "someemail@nowhere.testdev";

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  step("Should create user", async () => {
    const user = await User.register(USER_EMAIL, "");

    if (!user) {
      throw new Error("Failed to create user!");
    }

    assert.strictEqual(user.roles.length, 1);
    assert.strictEqual(user.tokens.length, 0);
    assert.strictEqual(user.addresses.length, 0);
  });


  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  step("Should create token", async () => {
    let user = await User.getByEmail(USER_EMAIL);

    if (!user) {
      throw new Error("Failed to create user!");
    }

    assert.strictEqual(user.tokens.length, 0);
    await user.createToken();
    user = await user.refresh();
    assert.strictEqual(user.tokens.length, 1);
    await user.createToken();
    user = await user.refresh();
    assert.strictEqual(user.tokens.length, 2);
  });


  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  step("Should create address", async () => {
    let user = await User.getByEmail(USER_EMAIL);

    if (!user) {
      throw new Error("Failed to create user!");
    }

    assert.strictEqual(user.addresses.length, 0);
    const address = await user.createEmailAddress();
    assert.strictEqual(address.expiresInMins(), EmailAddress.lifetimeInMinutes);
    user = await user.refresh();
    assert.strictEqual(user.addresses.length, 1);

    await user.createEmailAddress();
    user = await user.refresh();
    assert.strictEqual(user.addresses.length, 2);
  });


  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  step("Should create email", async () => {
    const user = await User.getByEmail(USER_EMAIL);

    if (!user) {
      throw new Error("Failed to create user!");
    }

    const address = user.addresses[0];

    if (!address) {
      throw new Error("Failed to get adress!");
    }

    const emailsBefore = await address.getEmails();
    assert.strictEqual(emailsBefore.length, 0);

    await address.insertEmail({});
    const emailsAfter = await address.getEmails();
    assert.strictEqual(emailsAfter.length, 1);
  });


  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  step("Should delete user and all related data", async () => {
    const user = await User.getByEmail(USER_EMAIL);

    if (!user) {
      throw new Error("Failed to create user!");
    }

    await user.destroy();

    const [
      users,
      tokens,
      addresses,
      emails,
    ] = await Promise.all([
      User.query(),
      Token.query(),
      EmailAddress.query(),
      Email.query(),
    ]);

    assert.strictEqual(users.length, 0);
    assert.strictEqual(tokens.length, 0);
    assert.strictEqual(addresses.length, 0);
    assert.strictEqual(emails.length, 0);
  });
});
