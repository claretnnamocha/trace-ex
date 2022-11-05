import BigNumber from "bignumber.js";
import { v4 as uuid } from "uuid";
import { SALT, WALLET_FACTORY_ADDRESS } from "../configs/constants";
import { jobs } from "../helpers";
import { ethers } from "../helpers/crypto/ethereum";
import { App, Wallet } from "../models";
import { AppSchema, WalletSchema } from "../types/models";
import { ListeningQueue } from "./queues";

export const drainActiveWalletAddresses = async () => {
  const queueName = `drainActiveWalletAddresses-${uuid()}`;

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
        const {
          address,
          token: {
            minimumDrainAmount,
            decimals,
            network,
            isNativeToken,
            contractAddress: tokenAddress,
          },
          app: { id: appId },
          index: walletIndex,
        } = wallets[index];
        let onChainBalance: number;
        const contractAddress = await WALLET_FACTORY_ADDRESS();
        if (network !== "altlayer-devnet")
          throw new Error("Network not supported");

        const walletFactory = ethers.getFactory({ contractAddress, network });

        const { secretKey }: AppSchema = await App.findByPk(appId);
        const salt = SALT({ walletIndex, secretKey });

        if (isNativeToken) {
          /* eslint-disable no-await-in-loop */
          onChainBalance = await ethers.getNativeTokenBalance({
            address,
            network,
          });
        } else {
          /* eslint-disable no-await-in-loop */
          onChainBalance = await ethers.getNativeTokenBalance({
            address,
            network,
          });
        }

        const min = new BigNumber(minimumDrainAmount).multipliedBy(
          10 ** decimals
        );

        if (min.gt(new BigNumber(onChainBalance))) return;

        if (isNativeToken) {
          /* eslint-disable no-await-in-loop */
          await ethers.drainEtherWithFactory({ salt, walletFactory });
        } else {
          /* eslint-disable no-await-in-loop */
          await ethers.drainERC20WithFactory({
            salt,
            walletFactory,
            tokenAddress,
          });
        }
      }
    },
  });
};
