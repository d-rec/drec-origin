import { Injectable, UnauthorizedException } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";
import Redis from "ioredis";

@Injectable()
export class EvidentService {
  private apiUrl = process.env.IREC_EVIDENT_API_URL!;
  private email = process.env.IREC_EVIDENT_REGISTRANT_EMAIL!;
  private apiToken = process.env.IREC_EVIDENT_API_Token!;
  private redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({ baseURL: this.apiUrl });

    this.axiosInstance.interceptors.request.use(
      async (config) => {
        let token = await this.redis.get("evident_auth_token");
        if (!token) throw new UnauthorizedException({"status": 401, "message":"No auth token found"});
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  async getAuthToken(): Promise<string> {
    const response = await this.axiosInstance.post('/auth/token', {
      email: this.email,
      token: this.apiToken,
    });
    this.storeAuthToken(response.data.token);
    return response.data.token;
  }

  async fetchDevices(): Promise<any> {
    const response = await this.axiosInstance.get('/devices');
    return response.data;
  }

  async storeAuthToken(token: string): Promise<void> {
    await this.redis.set("evident_auth_token", token, "EX", 3);
    console.log(`Stored auth token in Redis: ${token}`);
  }
}