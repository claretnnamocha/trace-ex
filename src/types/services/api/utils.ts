export interface GetTokenBalance {
  address: string;
  token?: string;
  network: string;
  blockchain: string;
}

export interface UpdateWalletTransactions {
  address: string;
}

export interface LogWalletTransactions {
  walletId: string;
  transaction: any;
}

export interface UpdateWalletBalance {
  appId?: string;
  walletId?: string;
  transaction: any;
  amount: string;
  type: string;
  confirmed?: boolean;
}

export interface DrainWallet {
  walletId?: string;
}
