import { User } from "../models/User";
import { FastifyHandler } from "./ControllerUtilities";
import * as yup from "yup";
import { Email } from "../models/Email";


export const index: FastifyHandler =
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

    const flashMessage = req.session.flashMessage;
    req.session.flashMessage = undefined; // reset the variable

    return res.view("/src/views/pages/dashboard.ejs", {
      isLoggedIn: true,
      isAdmin: user.hasRole("admin"),
      addresses: formattedAddresses,
      maxAddresses: user.settings.maxEmailAddresses,
      flashMessage,
    });
  };


interface DeleteAddressHandler {
  Body: {
    address: string
  }
}
export const deleteAddress: FastifyHandler<DeleteAddressHandler> =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const schema = yup.object().shape({
      address: yup.number().min(1).required(),
    });

    // validate the submitted form
    const errors = await schema.validate(req.body)
      .then(() => [])
      .catch(e => e.errors);

    if (errors.length > 0) {
      req.session.flashMessage = errors[0];
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
export const showInbox: FastifyHandler<ShowInboxHandler> =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const { id } = req.params;
    const parsedId = parseInt(id);
    if(isNaN(parsedId)) {
      return res.code(400).view("/src/views/pages/400.ejs", {
        isLoggedIn: !!req.session.user,
      });
    }

    const user = await User.getById(req.session.user.id);
    const addr = user.addresses.find(a => a.id === parseInt(id));

    if(!addr) {
      return res.code(404).view("/src/views/pages/404.ejs", {
        isLoggedIn: !!req.session.user,
      });
    }

    const emails = await addr.getEmails();
    emails.sort((a, b ) => b.id - a.id);

    const flashMessage = req.session.flashMessage;
    req.session.flashMessage = undefined; // reset the variable

    return res.view("/src/views/pages/inbox.ejs", {
      isLoggedIn: !!req.session.user,
      isAdmin: user.hasRole("admin"),
      emails,
      flashMessage,
    });
  };


interface DeleteEmailHandler {
  Body: {
    email: string
  }
}
export const deleteEmail: FastifyHandler<DeleteEmailHandler> =
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const schema = yup.object().shape({
      email: yup.number().min(1).required(),
    });

    // validate the submitted form
    const errors = await schema.validate(req.body)
      .then(() => [])
      .catch(e => e.errors);

    if (errors.length > 0) {
      req.session.flashMessage = errors[0];
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
