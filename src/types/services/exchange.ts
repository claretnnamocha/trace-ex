export interface SignUpRequest {
  appId: string;
  username: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  othernames: string;
  password: string;
  country: string;
  preferredLanguage: string;
  role: string;
  addresses: Array<Object>;
  avatar: string;
}

export interface SignInRequest {
  appId: string;
  user: string;
  password: string;
}

export interface VerifyRequest {
  appId: string;
  token: string;
  userId?: string;
  email?: string;
  resend?: boolean;
}

export interface InitiateResetRequest {
  appId: string;
  email: string;
}

export interface ResetPasswordRequest {
  appId: string;
  email: string;
  token: string;
  password: string;
  logOtherDevicesOut: boolean;
}

export interface ResendVerifyRequest {
  appId: string;
  email: string;
}

export interface UpdateRequest {
  appId: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  dob?: Date;
  avatar?: string;
}

export interface UpdatePasswordRequest {
  appId: string;
  userId: string;
  password: string;
  logOtherDevicesOut: boolean;
  newPassword: string;
}

export interface ValidateTotp {
  appId: string;
  userId: string;
  token: string;
}

export interface GetWallet {
  network: string;
  token: string;
  userId: string;
}

export interface GetAll {
  appId: string;
  name?: string;
  email?: string;
  verifiedEmail?: boolean;
  isDeleted?: boolean;
  verifiedPhone?: boolean;
  active?: boolean;
  gender?: string;
  dob?: string;
  phone?: string;
  permissions?: Array<string>;
  role?: string;
  page?: number;
  pageSize?: number;
}

export interface SendCrypto {
  userId: string;
  token: string;
  to: string;
  amount: number;
  network: string;
  blockchain: string;
}
