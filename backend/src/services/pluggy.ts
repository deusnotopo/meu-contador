import dotenv from 'dotenv';

dotenv.config();

const PLUGGY_API_URL = 'https://api.pluggy.ai';
const CLIENT_ID = process.env.PLUGGY_CLIENT_ID;
const CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET;

export class PluggyService {
  private static apiKey: string | null = null;

  private static async getApiKey() {
    if (this.apiKey) return this.apiKey;

    const response = await fetch(`${PLUGGY_API_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate with Pluggy');
    }

    const data = await response.json() as { apiKey: string };
    this.apiKey = data.apiKey;
    return this.apiKey;
  }

  static async createConnectToken(userId: string) {
    const apiKey = await this.getApiKey();
    const response = await fetch(`${PLUGGY_API_URL}/connect_tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        // You can add options here, like webhookUrl, etc.
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create Connect Token');
    }

    return await response.json() as { accessToken: string };
  }

  static async getAccounts(itemId: string) {
    const apiKey = await this.getApiKey();
    const response = await fetch(`${PLUGGY_API_URL}/accounts?itemId=${itemId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch accounts from Pluggy');
    }

    const data = await response.json() as { results: any[] };
    return data.results;
  }

  static async getTransactions(accountId: string, from?: string) {
    const apiKey = await this.getApiKey();
    let url = `${PLUGGY_API_URL}/transactions?accountId=${accountId}`;
    if (from) {
      url += `&from=${from}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transactions from Pluggy');
    }

    const data = await response.json() as { results: any[] };
    return data.results;
  }

  static async getItem(itemId: string) {
    const apiKey = await this.getApiKey();
    const response = await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch item from Pluggy');
    }

    return await response.json();
  }
}
