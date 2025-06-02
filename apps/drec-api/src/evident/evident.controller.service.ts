import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class EvidentService {
    private apiUrl = process.env.IREC_EVIDENT_API_URL!;
  private loginUrl = process.env.EVIDENT_LOGIN_URL!;
  private email = process.env.IREC_EVIDENT_REGISTRANT_EMAIL!;
  private password = process.env.IREC_EVIDENT_Password!;
  private apiToken = process.env.IREC_EVIDENT_API_Token!;

  async getAuthToken(): Promise<string> {
    const response = await axios.post(this.loginUrl, {
      username: this.email,
      password: this.password,
      api_token: this.apiToken,
    });
    return response.data.access_token;
  }

  async fetchDevices(): Promise<any> {
    const token = await this.getAuthToken();
    const response = await axios.get(`${this.apiUrl}/devices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
}