import { v4 as uuid } from "uuid";
import { jobs } from "../helpers";
import { Wallet } from "../models";
import { updateWalletTransactions } from "../modules/api/utils/service";
import { WalletSchema } from "../types/models";
import { ListeningQueue } from "./queues";

export const listenForOnChainTransactions = async () => {
  console.log("Listening for on-chain transactions 👂");
  const queue = ListeningQueue;
  const queueName = `listenForOnChainTransactions-${uuid()}`;

  jobs.agenda.process({
    queueName,
    queue: ListeningQueue,
    callback: async () => {
      const wallets: Array<WalletSchema> = await Wallet.findAll({
        where: { active: true },
      });

      for (let index = 0; index < wallets.length; index += 1) {
        const { address } = wallets[index];
        /* eslint-disable no-await-in-loop */
        await updateWalletTransactions({ address });
      }
    },
  });

  const job = await jobs.agenda.add({
    queue,
    queueName,
    data: null,
  });

  job.repeatEvery("15 seconds");
  await job.save();

  await queue.start();
};
