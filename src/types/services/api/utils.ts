export interface GetTokenBalance {
  address: string;
  token?: string;
  network: string;
}

export interface UpdateWalletTransactions {
  address: string;
}

export interface LogWalletTransactions {
  walletId: string;
  transaction: any;
}

export interface UpdateWalletBalance {
  walletId: string;
  transaction: any;
  amount: string;
  type: string;
  confirmed: boolean;
}