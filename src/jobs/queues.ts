import { config } from "dotenv";
import { jobs } from "../helpers";

config();

export const EmailQueue = jobs.agenda.create({
  queueName: "email",
});

export const ListeningQueue = jobs.agenda.create({
  queueName: "onChainTransactionListener",
});
