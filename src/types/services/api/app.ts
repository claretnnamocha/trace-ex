export interface CreateApp {
  name: string;
  userId: string;
}

export interface UpdateApp {
  userId: string;
  name: string;
  displayName?: string;
  supportEmail?: string;
  instantSettlement?: boolean;
}

export interface GenerateWalletAddress {
  appId: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail: string;
  network: string;
  symbol: string;
  blockchain: string;
  addressValidity?: number;
  targetAmount?: number;
  index?: number;
}

export interface GetWalletAddress {
  appId: string;
  reference?: string;
}

export interface GetAppBalance {
  appId: string;
  token?: string;
}

export interface APIAuthenticated {
  appId: string;
  page?: number;
  pageSize?: number;
}

export interface SendCrypto {
  appId: string;
  token: string;
  to: string;
  amount: number;
  network: string;
  blockchain: string;
}
