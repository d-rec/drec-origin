import * as jwt from 'jsonwebtoken';
import { HttpService } from '@nestjs/axios';
let jwtToken;

export async function login(httpService: HttpService | any): Promise<string> {
  const url = `${process.env.IREC_EVIDENT_API_URL}/auth/token`;
  const payload = {
    email: process.env.IREC_EVIDENT_REGISTRANT_EMAIL,
    token: process.env.IREC_EVIDENT_API_Token,
  };
  const response = await httpService.post(url, payload).toPromise();
  jwtToken = response.data.token;
  return jwtToken;
}

export async function regenerateToken(
  httpService: HttpService | any,
): Promise<string> {
  if (!jwtToken) {
    return login(httpService);
  }

  // Check if token has expired (assuming expiration is based on 1 hour)
  const expired = isTokenExpired(jwtToken);
  if (expired) {
    return login(httpService);
  }

  return jwtToken;
}

export function isTokenExpired(token: string): boolean {
  const decodedToken = jwt.decode(token) as { exp: number };
  const expirationDate = new Date(decodedToken.exp * 1000); // Convert expiration time from seconds to milliseconds
  return expirationDate < new Date();
}
