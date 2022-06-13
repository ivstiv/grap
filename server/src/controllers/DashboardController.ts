import { User } from "../models/User";
import { FastifyHandler } from "./ControllerUtilities";
import * as yup from "yup";


export const index: FastifyHandler = 
  async (req, res) => {
    if (!req.session.user) {
      throw new Error("Session user is missing!");
    }

    const user = await User.getById(req.session.user.id);
    const addresses = await user.addresses();

    const emailsPromises = addresses.map(adr => adr.getEmails());
    const emails = (await Promise.all(emailsPromises)).flat();

    const formattedAddresses = addresses.map(adr => ({
      id: adr.id,
      address: adr.address,
      expiresIn: adr.expiresIn(),
      inboxEmails: emails
        .filter(e => e.address === adr.id)
        .reduce((sum, _curr) => sum+1, 0),
    }));

    const flashMessage = req.session.flashMessage;
    req.session.flashMessage = undefined; // reset the variable

    return res.view("/src/views/pages/dashboard.ejs", {
      isLoggedIn: true,
      addresses: formattedAddresses,
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
    const userAddresses = await user.addresses();
    const userOwnsAdrsToDelete = userAddresses
      .some(adr => adr.id === parseInt(req.body.address));

    if(!userOwnsAdrsToDelete) {
      req.session.flashMessage = "You don't own the address that you are trying to delete.";
      return res.redirect("/dashboard");
    }

    const addressToDelete = userAddresses
      .find(adr => adr.id === parseInt(req.body.address));

    if (addressToDelete) {
      await addressToDelete.destroy();
      req.session.flashMessage = "Address deleted successfully!";
    } else {
      req.session.flashMessage = "Failed to delete due to internal error.";
    }
    return res.redirect("/dashboard");
  };
