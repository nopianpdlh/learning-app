import midtransClient from "midtrans-client";

// Midtrans Configuration
const isProduction = process.env.MIDTRANS_ENV === "production";

// Snap API Client - for creating Snap transactions
export const snap = new midtransClient.Snap({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
});

// Core API Client - for checking transaction status
export const coreApi = new midtransClient.CoreApi({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
});

// Types
export interface CreateTransactionParams {
  orderId: string;
  grossAmount: number;
  customerDetails: {
    firstName: string;
    email: string;
    phone?: string;
  };
  itemDetails: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  expiryDuration?: number; // in minutes, default 24 hours
}

export interface SnapResponse {
  token: string;
  redirect_url: string;
}

export interface TransactionStatus {
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  order_id: string;
  transaction_id?: string;
  gross_amount: string;
  va_numbers?: { bank: string; va_number: string }[];
  settlement_time?: string;
}

// Helper Functions

/**
 * Create Snap transaction for payment
 */
export async function createSnapTransaction(
  params: CreateTransactionParams
): Promise<SnapResponse> {
  const expiryMinutes = params.expiryDuration || 1440; // Default 24 hours

  const parameter = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    customer_details: {
      first_name: params.customerDetails.firstName,
      email: params.customerDetails.email,
      phone: params.customerDetails.phone || "",
    },
    item_details: params.itemDetails,
    expiry: {
      unit: "minutes",
      duration: expiryMinutes,
    },
    // Enable all payment methods
    enabled_payments: [
      "credit_card",
      "bca_va",
      "bni_va",
      "bri_va",
      "permata_va",
      "other_va",
      "gopay",
      "shopeepay",
      "qris",
    ],
    callbacks: {
      finish: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/payment/success`,
      error: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/payment/error`,
      pending: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/payment/pending`,
    },
  };

  const transaction = await snap.createTransaction(parameter);
  return transaction as SnapResponse;
}

/**
 * Get transaction status from Midtrans
 */
export async function getTransactionStatus(
  orderId: string
): Promise<TransactionStatus> {
  // Use type assertion as midtrans-client types are incomplete
  const status = await (coreApi as any).transaction.status(orderId);
  return status as TransactionStatus;
}

/**
 * Verify webhook notification signature
 */
export function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const crypto = require("crypto");
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";

  const payload = orderId + statusCode + grossAmount + serverKey;
  const expectedSignature = crypto
    .createHash("sha512")
    .update(payload)
    .digest("hex");

  return expectedSignature === signatureKey;
}

/**
 * Generate invoice number
 * Format: INV-YYYYMMDD-XXXX
 */
export function generateInvoiceNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${dateStr}-${random}`;
}

/**
 * Map Midtrans transaction status to our PaymentStatus
 */
export function mapTransactionStatus(
  transactionStatus: string,
  fraudStatus?: string
): "PENDING" | "PAID" | "FAILED" | "EXPIRED" {
  switch (transactionStatus) {
    case "capture":
      // For credit card transactions
      if (fraudStatus === "accept") return "PAID";
      return "PENDING";
    case "settlement":
      return "PAID";
    case "pending":
      return "PENDING";
    case "deny":
    case "cancel":
      return "FAILED";
    case "expire":
      return "EXPIRED";
    default:
      return "PENDING";
  }
}
