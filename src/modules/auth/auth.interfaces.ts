export interface SerializedUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
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
  userId: number;
}
