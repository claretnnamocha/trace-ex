import { config } from "dotenv";
import { jobs } from "../helpers";

config();

// export const EmailQueue = jobs.bulljs.create({ queueName: "email" });
export const EmailQueue = jobs.agenda.create({
  queueName: "email",
  options: {},
});
export const ListeningQueue = jobs.bulljs.create({
  queueName: "onChainTransactionListener",
});
