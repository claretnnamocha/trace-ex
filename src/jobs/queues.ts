import { jobs } from "../helpers";

export const EmailQueue = jobs.create({ queueName: "email" });
export const ListeningQueue = jobs.create({
  queueName: "onChainTransactionListener",
});
