import { User } from "../models/User";
import { FastifyHandler } from "./ControllerUtilities";


export const createAddress: FastifyHandler = 
  async (req, res) => {
    let user: User | undefined;
    if (req.session.user) {
      user = await User.query()
        .where({ id: req.session.user.id })
        .first();
    }
    
    if (!user) {
      throw new Error("User not found!");
    }

    // TO-DO: check if the user has reached its limit
    const { address } = await user.createEmailAddress();
    return res.code(201).send({ data: address });
  };

