import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from './logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        logger.info('API Request', { method: config.method, url: config.url });
        return config;
      },
      (error) => {
        logger.error('API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.info('API Response', { status: response.status, url: response.config.url });
        return response;
      },
      (error: AxiosError) => {
        logger.error('API Response Error', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      logger.error('Health check failed', error);
      throw error;
    }
  }

  // Transactions
  async getTransactions(userId: string) {
    const response = await this.client.get(`/transactions/${userId}`);
    return response.data;
  }

  async createTransaction(userId: string, data: unknown) {
    const response = await this.client.post(`/transactions/${userId}`, data);
    return response.data;
  }

  async updateTransaction(userId: string, transactionId: string, data: unknown) {
    const response = await this.client.put(`/transactions/${userId}/${transactionId}`, data);
    return response.data;
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const response = await this.client.delete(`/transactions/${userId}/${transactionId}`);
    return response.data;
  }

  // Budgets
  async getBudgets(userId: string) {
    const response = await this.client.get(`/budgets/${userId}`);
    return response.data;
  }

  async createBudget(userId: string, data: unknown) {
    const response = await this.client.post(`/budgets/${userId}`, data);
    return response.data;
  }

  // Goals
  async getGoals(userId: string) {
    const response = await this.client.get(`/goals/${userId}`);
    return response.data;
  }

  async createGoal(userId: string, data: unknown) {
    const response = await this.client.post(`/goals/${userId}`, data);
    return response.data;
  }

  // Sync
  async syncData(userId: string, data: unknown) {
    const response = await this.client.post(`/sync/${userId}`, data);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
