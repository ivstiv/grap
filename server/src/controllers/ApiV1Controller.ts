import { Token } from "../models/Token";
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

    if (req.headers.authorization) {
      const [_bearer, token] = req.headers.authorization.split(" ");
      const fetchedToken = await Token.query()
        .where({ token }).first();
      if (!fetchedToken) {
        throw new Error("Token not found!");
      }
      user = await fetchedToken.getOwner();
    }
    
    if (!user) {
      throw new Error("User not found!");
    }

    const addresses = await user.addresses();
    if (user.getLimits().maxEmailAddresses <= addresses.length) {
      return res.code(401).send({ error: "Address limit reached! Try again later." });
    }
    
    const { address } = await user.createEmailAddress();
    return res.code(201).send({ data: address });
  };


interface LatestEmailHandler {
  Params: {
    address: string
  }
}
export const latestEmail: FastifyHandler<LatestEmailHandler> = 
  async (req, res) => {
    let user: User | undefined;

    if (req.headers.authorization) {
      const [_bearer, token] = req.headers.authorization.split(" ");
      const fetchedToken = await Token.query()
        .where({ token }).first();
      if (!fetchedToken) {
        throw new Error("Token not found!");
      }
      user = await fetchedToken.getOwner();
    }
    
    if (!user) {
      throw new Error("User not found!");
    }

    const addresses = await user.addresses();
    const addressToPoll = addresses
      .find(a => a.address === req.params.address);

    if(!addressToPoll) {
      return res.code(404).send({ error: "Address not found!" });
    }

    const emails = await addressToPoll.getEmails();

    const latestEmail = emails.sort((a, b) => b.id - a.id).shift();

    if (!latestEmail) {
      return res.code(200).send({ data: {} });
    }

    return res.code(200).send({
      data: {
        subject: latestEmail.subject,
        content: latestEmail.content,
        from: latestEmail.from,
        createdAt: latestEmail.createdAt,
      },
    });
  };

