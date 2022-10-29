import { v4 as uuid } from "uuid";
import { jobs } from "../helpers";
import { Wallet } from "../models";
import { updateWalletTransactions } from "../modules/api/utils/service";
import { WalletSchema } from "../types/models";
import { ListeningQueue } from "./queues";

export const listenForOnChainTransactions = async () => {
  const queueName = `listenForOnChainTransactions-${uuid()}`;

  const queue = ListeningQueue;
  await queue.clean(0);
  await queue.empty();

  await jobs.add({
    queue,
    options: { repeat: { every: 10 * 1000 } },
    queueName,
    data: null,
  });

  await jobs.process({
    queueName,
    queue,
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
};
