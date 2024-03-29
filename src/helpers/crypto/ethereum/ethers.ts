import BigNumber from "bignumber.js";
import { Contract, ethers, Wallet } from "ethers";

export const DECIMALS = 18;

export const IERC20_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "name_",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol_",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export type NETWORKS =
  | "altlayer-devnet"
  | "goerli"
  | "metis-goerli"
  | "zksync-goerli"
  | "zksync-mainnet"
  | "trust-testnet"
  | "bsc-testnet";

export interface NormalizedTransaction {
  amount: string;
  type: string;
  token: string;
  transaction: any;
  confirmed: boolean;
}

export const RPC_LINK = ({
  network = "altlayer-devnet",
}: {
  network?: NETWORKS;
}): string => {
  switch (network) {
    case "trust-testnet":
      return "https://api.testnet-dev.trust.one";
    case "metis-goerli":
      return "https://goerli.gateway.metisdevops.link";
    case "altlayer-devnet":
      return "https://1rpc.io/alt";
    case "zksync-goerli":
      return "https://zksync2-testnet.zksync.dev";
    case "goerli":
      return "https://eth-goerli.public.blastapi.io";
    case "bsc-testnet":
      return "https://data-seed-prebsc-1-s3.binance.org:8545";
    default:
      throw new Error("This network is not supported yet");
  }
};

const RPC_LINK2 = ({ chainId = 9990 }: { chainId?: number }): string => {
  switch (chainId) {
    case 15555:
      return RPC_LINK({ network: "trust-testnet" });
    case 599:
      return RPC_LINK({ network: "metis-goerli" });
    case 9990:
      return RPC_LINK({ network: "altlayer-devnet" });
    case 5:
      return RPC_LINK({ network: "goerli" });
    case 97:
      return RPC_LINK({ network: "bsc-testnet" });
    case 280:
      return RPC_LINK({ network: "zksync-goerli" });
    default:
      throw new Error("This network is not supported yet");
  }
};

export const getContract = ({
  contractAddress,
  abi,
  signer = null,
}: {
  contractAddress: string;
  abi: ethers.ContractInterface;
  signer?: ethers.Signer | ethers.providers.Provider;
}): ethers.Contract => {
  return new ethers.Contract(contractAddress, abi, signer);
};

export const PROVIDER = ({
  network = "altlayer-devnet",
  chainId,
}: {
  network?: NETWORKS;
  chainId?: number;
}): ethers.providers.BaseProvider => {
  const rpc = chainId ? RPC_LINK2({ chainId }) : RPC_LINK({ network });
  return ethers.providers.getDefaultProvider(rpc);
};

export const getWalletFromMnemonic = ({
  mnemonic,
  path,
  network = "altlayer-devnet",
}: {
  mnemonic: string;
  path: string;
  network?: NETWORKS;
}): Wallet => {
  const provider = PROVIDER({ network });
  return Wallet.fromMnemonic(mnemonic, path).connect(provider);
};

export const getNativeTokenBalance = async ({
  address,
  network = "altlayer-devnet",
}: {
  address: string;
  network?: NETWORKS;
}): Promise<number> => {
  const provider = PROVIDER({ network });
  const balance = await provider.getBalance(address);
  return new BigNumber(balance.toString()).toNumber();
};

export const getERC20TokenBalance = async ({
  address,
  contractAddress,
  network = "altlayer-devnet",
}: {
  address: string;
  contractAddress: string;
  network?: NETWORKS;
}): Promise<number> => {
  const signer = PROVIDER({ network });
  const token = getContract({ abi: IERC20_ABI, contractAddress, signer });
  const balance = await token.balanceOf(address);
  return new BigNumber(balance.toString()).toNumber();
};

export const sendNativeToken = async ({
  reciever,
  amount,
  privateKey,
  network = "altlayer-devnet",
}: {
  reciever: string;
  amount: number;
  privateKey: string;
  network?: NETWORKS;
}): Promise<ethers.providers.TransactionResponse> => {
  const provider = PROVIDER({ network });
  const to = ethers.utils.getAddress(reciever);
  const { address } = new Wallet(privateKey);
  const realAmount = new BigNumber(amount)
    .multipliedBy(10 ** DECIMALS)
    .toString(16);

  const value = `0x${realAmount}`;

  const balance = await provider.getBalance(address);

  if (balance.lte(value)) throw new Error("Insufficient balance");

  const transaction = { to, value };
  const wallet = new ethers.Wallet(privateKey).connect(provider);

  return wallet.sendTransaction(transaction);
};

export const sendERC20Token = async ({
  reciever,
  amount,
  contractAddress,
  privateKey,
  network = "altlayer-devnet",
}: {
  reciever: string;
  amount: number;
  contractAddress: string;
  privateKey: string;
  network?: NETWORKS;
}): Promise<ethers.providers.TransactionResponse> => {
  const to = ethers.utils.getAddress(reciever);

  const provider = PROVIDER({ network });
  const signer = new ethers.Wallet(privateKey, provider);
  const from = signer.address;
  const token = getContract({ abi: IERC20_ABI, contractAddress, signer });
  const decimals: number = await token.decimals();

  const value = new BigNumber(amount).multipliedBy(
    new BigNumber(10 ** decimals)
  );

  const balance = await getERC20TokenBalance({
    address: from,
    contractAddress,
    network,
  });

  if (value.gt(balance)) throw new Error("Insufficient balance");

  const data = token.interface.encodeFunctionData("transfer", [to, value]);
  const gasPrice = (await provider.getGasPrice()).toHexString();
  const nonce = await provider.getTransactionCount(from);

  const transaction: any = {
    from,
    to: contractAddress,
    data,
    gasPrice,
    nonce,
  };
  const gasLimit = await provider.estimateGas(transaction);
  transaction.gasLimit = gasLimit.toHexString();

  const wallet = new ethers.Wallet(privateKey, provider);

  return wallet.sendTransaction(transaction);
};

export const sendTransaction = async ({
  hash,
  network = "altlayer-devnet",
}: {
  hash: string;
  network?: NETWORKS;
}): Promise<ethers.providers.TransactionResponse> => {
  const provider = PROVIDER({ network });
  return provider.sendTransaction(hash);
};

/**
 * Using Smart Contract accounts
 * See example at https://goerli.etherscan.io/address/0x550a71DC9b232EE03C92F6bBFD6A967Af4E8F225
 */

export const WALLET_FACTORY_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "salt",
        type: "bytes",
      },
    ],
    name: "createWallet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "salt",
        type: "bytes",
      },
      {
        internalType: "address",
        name: "erc20",
        type: "address",
      },
    ],
    name: "drainERC20",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "salt",
        type: "bytes",
      },
    ],
    name: "drainETH",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "salt",
        type: "bytes",
      },
    ],
    name: "getAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "salt",
        type: "bytes",
      },
      {
        internalType: "address",
        name: "erc20",
        type: "address",
      },
    ],
    name: "getERC20Balance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "salt",
        type: "bytes",
      },
    ],
    name: "getETHBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantPermission",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "salt",
        type: "bytes",
      },
    ],
    name: "isCreated",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "isPermitted",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokePermission",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "tracker",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
    ],
    name: "transferERC20",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "address payable",
        name: "to",
        type: "address",
      },
    ],
    name: "transferETH",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];

export const getFactory = ({
  contractAddress,
  network = "altlayer-devnet",
  privateKey = undefined,
}: {
  contractAddress: string;
  privateKey?: string;
  network?: NETWORKS;
}): ethers.Contract => {
  let signer: ethers.Signer | ethers.providers.Provider = PROVIDER({ network });
  if (privateKey) signer = new Wallet(privateKey).connect(signer);

  return getContract({
    abi: WALLET_FACTORY_ABI,
    contractAddress,
    signer,
  });
};

export const getAddressWithFactory = async ({
  salt,
  walletFactory,
}: {
  salt: string;
  walletFactory: Contract;
}): Promise<string> => {
  return walletFactory.getAddress(salt);
};

const ensureWalletIsCreated = async ({
  walletFactory,
  salt,
  walletCreated = false,
}) => {
  const isCreated = await walletFactory.isCreated(salt);
  if (isCreated === walletCreated) throw new Error("Wallet is not yet created");

  return walletFactory;
};

const validateFactorySigner = async ({ walletFactory }) => {
  const address = await walletFactory.signer.getAddress();
  const senderIsPermitted = await walletFactory.isPermitted(address);
  if (!senderIsPermitted) throw new Error("Unauthorized signer");
};

export const createWalletWithFactory = async ({
  salt,
  walletFactory,
}: {
  salt: string;
  walletFactory: Contract;
}) => {
  await ensureWalletIsCreated({
    walletFactory,
    salt,
    walletCreated: true,
  });
  await validateFactorySigner({ walletFactory });

  await walletFactory.createWallet(salt);
};

export const approveWalletWithFactory = async ({
  salt,
  tokenAddress,
  walletFactory,
}: {
  salt: string;
  tokenAddress: string;
  walletFactory: Contract;
}) => {
  await ensureWalletIsCreated({
    walletFactory,
    salt,
    walletCreated: true,
  });
  await validateFactorySigner({ walletFactory });

  await walletFactory.approve(salt, tokenAddress);
};

export const drainEtherWithFactory = async ({
  salt,
  walletFactory,
}: {
  salt: string;
  walletFactory: Contract;
}) => {
  await ensureWalletIsCreated({
    walletFactory,
    salt,
  });

  await validateFactorySigner({ walletFactory });
  await walletFactory.drainETH(salt);
};

export const drainERC20WithFactory = async ({
  salt,
  tokenAddress,
  walletFactory,
}: {
  salt: string;
  tokenAddress: string;
  walletFactory: Contract;
}) => {
  await ensureWalletIsCreated({
    walletFactory,
    salt,
  });

  await validateFactorySigner({ walletFactory });

  const { chainId } = await walletFactory.signer.provider.getNetwork();

  // @ts-ignore
  const signer = PROVIDER({ chainId });
  const token = getContract({
    abi: IERC20_ABI,
    contractAddress: tokenAddress,
    signer,
  });

  await walletFactory.drainERC20(salt, token.address);
};

export const transferEtherFromFactory = async ({
  amount,
  reciever,
  walletFactory,
}: {
  amount: number;
  reciever: string;
  walletFactory: Contract;
}) => {
  await validateFactorySigner({ walletFactory });

  const to = ethers.utils.getAddress(reciever);
  const value = new BigNumber(amount)
    .multipliedBy(new BigNumber(10 ** 18))
    .toFixed();

  await walletFactory.transferETH(value, to);
};

export const transferERC20FromFactory = async ({
  tokenAddress,
  amount,
  reciever,
  walletFactory,
}: {
  tokenAddress: string;
  amount: number;
  reciever: string;
  walletFactory: Contract;
}) => {
  await validateFactorySigner({ walletFactory });

  const { chainId } = await walletFactory.signer.provider.getNetwork();

  // @ts-ignore
  const signer = PROVIDER({ chainId });
  const token = getContract({
    abi: IERC20_ABI,
    contractAddress: tokenAddress,
    signer,
  });
  const decimals: number = await token.decimals();

  const to = ethers.utils.getAddress(reciever);
  const value = new BigNumber(amount)
    .multipliedBy(new BigNumber(10 ** decimals))
    .toFixed();

  await walletFactory.transferERC20(token.address, value, to);
};
