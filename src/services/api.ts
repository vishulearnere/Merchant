import {
  CreateLinkInput,
  PaymentLink,
  Payment,
  PayPageData,
  WebhookPayload,
  WebhookResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/v1';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('payflow_token');
    localStorage.removeItem('payflow_mock_links');
    localStorage.removeItem('payflow_mode');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('payflow_token', token);
    } else {
      localStorage.removeItem('payflow_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public getBaseUrl(): string {
    return API_BASE_URL;
  }

  public async checkHealth(): Promise<{ ok: boolean; database?: string; url: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return { ok: true, database: data.database, url: API_BASE_URL };
      }
      return { ok: false, url: API_BASE_URL };
    } catch {
      return { ok: false, url: API_BASE_URL };
    }
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async getPaymentLinks(): Promise<PaymentLink[]> {
    const res = await fetch(`${API_BASE_URL}/payment-links`, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch payment links: ${res.statusText}`);
    }

    return await res.json();
  }

  async createPaymentLink(input: CreateLinkInput): Promise<PaymentLink> {
    const res = await fetch(`${API_BASE_URL}/payment-links`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to create payment link: ${res.statusText}`);
    }

    return await res.json();
  }

  async getPayPageData(linkId: string): Promise<PayPageData> {
    const res = await fetch(`${API_BASE_URL}/pay/${linkId}`);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Payment link '${linkId}' not found`);
    }

    return await res.json();
  }

  async startPayment(linkId: string): Promise<Payment> {
    const res = await fetch(`${API_BASE_URL}/pay/${linkId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to start payment: ${res.statusText}`);
    }

    return await res.json();
  }

  async sendWebhook(payload: WebhookPayload, sharedSecret?: string): Promise<WebhookResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (sharedSecret) {
      headers['X-Webhook-Secret'] = sharedSecret;
    }

    const res = await fetch(`${API_BASE_URL}/webhooks/provider`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok && !data.received) {
      throw new Error(data.message || `Webhook call failed: ${res.statusText}`);
    }

    return data;
  }
}

export const api = new ApiService();
