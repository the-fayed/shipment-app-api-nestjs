export interface SerializedUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export type AccessToken = string;

export interface SignupResponse {
  user: SerializedUser;
  access_token: AccessToken;
}

export interface LoginResponse {
  user: SerializedUser;
  access_token: AccessToken;
}
