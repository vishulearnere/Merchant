export type PaymentLinkStatus = 'ACTIVE' | 'PAID' | 'EXPIRED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface PaymentLink {
  id: string;
  linkId: string;
  merchantId: string;
  amount: number; // In paise (e.g., 50000 = ₹500)
  description: string;
  status: PaymentLinkStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  latestPayment?: Payment | null;
}

export interface Payment {
  id: string;
  paymentId: string;
  linkId: string;
  amount: number; // In paise
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PayPageData {
  link: PaymentLink;
  latestPayment: Payment | null;
}

export interface CreateLinkInput {
  amount: number; // In paise
  description: string;
  expiresInMinutes?: number;
}

export interface WebhookPayload {
  eventId: string;
  paymentId: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface WebhookResponse {
  received: boolean;
  message: string;
  status: PaymentStatus;
  isDuplicate?: boolean;
}

export interface MerchantUser {
  id: string;
  email: string;
  name: string;
  token?: string;
}
