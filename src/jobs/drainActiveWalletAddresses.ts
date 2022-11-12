import { v4 as uuid } from "uuid";
import { jobs } from "../helpers";
import { Wallet } from "../models";
import { drainWalletOnChain } from "../modules/api/utils/service";
import { WalletSchema } from "../types/models";
import { ListeningQueue } from "./queues";

export const drainActiveWalletAddresses = async () => {
  console.log("Draining sizeable wallets 🤓");
  const queue = ListeningQueue;
  const queueName = `drainActiveWalletAddresses-${uuid()}`;

  jobs.agenda.process({
    queueName,
    queue,
    callback: async () => {
      const wallets: Array<WalletSchema> = await Wallet.findAll({
        where: { active: true },
      });

      for (let index = 0; index < wallets.length; index += 1) {
        const { id: walletId } = wallets[index];

        await drainWalletOnChain({ walletId });
      }
    },
  });

  const job = await jobs.agenda.add({
    queue,
    queueName,
    data: null,
  });

  job.repeatEvery("15 minutes");
  await job.save();

  await queue.start();
};
