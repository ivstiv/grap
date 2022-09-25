import { User } from "../models/User";
import { FastifyHandler, numericStringConstraint } from "./ControllerUtilities";
import { Email } from "../models/Email";
import { z } from "zod";


const index: FastifyHandler =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const user = await User.getById(req.session.user.id);

    const emailsPromises = user.addresses.map(adr => adr.getEmails());
    const emails = (await Promise.all(emailsPromises)).flat();

    const formattedAddresses = user.addresses
      .sort((a, b) => b.id - a.id)
      .map(adr => ({
        id: adr.id,
        address: adr.address,
        expiresIn: adr.expiresInMins(),
        inboxEmails: emails
          .filter(e => e.address === adr.id)
          .reduce((sum, _curr) => sum+1, 0),
      }));

    return res.view("/src/views/dashboard", {
      addresses: formattedAddresses,
      maxAddresses: user.settings.maxEmailAddresses,
    });
  };


interface DeleteAddressHandler {
  Body: {
    address: string
  }
}
const deleteAddress: FastifyHandler<DeleteAddressHandler> =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const schema = z.object({
      address: numericStringConstraint("address"),
    });

    // validate the submitted form
    const parsedBody = schema.safeParse(req.body);

    if (!parsedBody.success) {
      const { address } = parsedBody.error.flatten().fieldErrors;
      req.session.flashMessage = address?.at(0);
      return res.redirect("/dashboard");
    }

    const user = await User.getById(req.session.user.id);
    const addressToDelete = user.addresses
      .find(adr => adr.id === parseInt(req.body.address));

    if(!addressToDelete) {
      req.session.flashMessage = "You don't own the address that you are trying to delete.";
      return res.redirect("/dashboard");
    }

    await addressToDelete.destroy();
    req.session.flashMessage = "Address deleted successfully!";
    return res.redirect("/dashboard");
  };


interface ShowInboxHandler {
  Params: {
    id: string
  }
}
const showInbox: FastifyHandler<ShowInboxHandler> =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const { id } = req.params;
    const parsedId = parseInt(id);
    if(isNaN(parsedId)) {
      return res.code(400).view("/src/views/400");
    }

    const user = await User.getById(req.session.user.id);
    const addr = user.addresses.find(a => a.id === parseInt(id));

    if(!addr) {
      return res.code(404).view("/src/views/404");
    }

    const emails = await addr.getEmails();
    emails.sort((a, b ) => b.id - a.id);

    return res.view("/src/views/inbox", { emails, address: addr });
  };


interface DeleteEmailHandler {
  Body: {
    email: string
  }
}
const deleteEmail: FastifyHandler<DeleteEmailHandler> =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const schema = z.object({
      email: numericStringConstraint("email"),
    });

    // validate the submitted form
    const parsedBody = schema.safeParse(req.body);

    if (!parsedBody.success) {
      const { email } = parsedBody.error.flatten().fieldErrors;
      req.session.flashMessage = email?.at(0);
      return res.redirect("/dashboard");
    }

    const email = await Email.query()
      .where({ id: req.body.email })
      .first();
    if (!email) {
      req.session.flashMessage = "Email not found!";
      return res.redirect("/dashboard");
    }

    const relatedAddr = await email.getAddress();
    if (!relatedAddr) {
      req.session.flashMessage = "Email address not found!";
      return res.redirect("/dashboard");
    }

    const relatedUser = await relatedAddr.getOwner();
    if (!relatedUser) {
      req.session.flashMessage = "Related user not found!";
      return res.redirect("/dashboard");
    }

    if (relatedUser.id !== req.session.user.id) {
      req.session.flashMessage = "You don't own the email that you are trying to delete.";
      return res.redirect("/dashboard");
    }

    await email.destroy();
    req.session.flashMessage = "Address deleted successfully!";
    return res.redirect(`/dashboard/inbox/${relatedAddr.id}`);
  };


interface ShowEmailHandler {
  Params: {
    inboxId: string
    emailId: string
  }
}
const showEmail: FastifyHandler<ShowEmailHandler> =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const { inboxId, emailId } = req.params;
    const parsedInboxId = parseInt(inboxId);
    const parsedEmailId = parseInt(emailId);
    if(isNaN(parsedInboxId) || isNaN(parsedEmailId)) {
      return res.code(400).view("/src/views/400");
    }

    const user = await User.getById(req.session.user.id);
    const addr = user.addresses.find(a => a.id === parsedInboxId);

    if(!addr) {
      return res.code(404).view("/src/views/404");
    }

    const emails = await addr.getEmails();
    const emailToShow = emails.find(e => e.id === parsedEmailId);

    if(!emailToShow) {
      return res.code(404).view("/src/views/404");
    }

    return res.view("/src/views/email-preview", { email: emailToShow, address: addr.address });
  };


// compiles to a cleaner imports from TS with interop
// import * as SomeController - MESSY
// import SomeController - CLEAN
export default {
  index,
  deleteAddress,
  showInbox,
  deleteEmail,
  showEmail,
};
