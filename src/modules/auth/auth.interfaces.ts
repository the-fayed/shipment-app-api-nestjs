export interface SerializedUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export type AccessToken = string;

export type Function = (param: string) => string;

export interface SignupResponse {
  status: string;
  message: string;
}

export interface LoginResponse extends SerializedUser {
  access_token: AccessToken;
}

export interface VerifyEmailResponse extends SignupResponse {}

export interface VerifyMobileResponse extends SignupResponse {}

export interface Payload {
  type: string;
  sub: {
    userId: number;
  };
}

export interface Decoded {
  type: string;
  sub: {
    userId: number;
  };
  iat: number;
  exp: number;
}

export enum Role {
  Admin = 'Admin',
  Driver = 'Driver',
  Customer = 'Customer',
}
