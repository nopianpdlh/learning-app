/**
 * Pakasir Payment Gateway Integration
 * Documentation: https://pakasir.com/p/docs
 */

import crypto from "crypto";

// Pakasir API Configuration
const PAKASIR_API_URL = "https://app.pakasir.com/api";
const PAKASIR_PROJECT_SLUG = process.env.PAKASIR_PROJECT_SLUG || "";
const PAKASIR_API_KEY = process.env.PAKASIR_API_KEY || "";

// Payment method types (from Pakasir docs)
export type PaymentMethod =
  | "qris"
  | "bni_va"
  | "bri_va"
  | "cimb_niaga_va"
  | "sampoerna_va"
  | "bnc_va"
  | "maybank_va"
  | "permata_va"
  | "atm_bersama_va"
  | "artha_graha_va"
  | "retail";

// Payment transaction interface
export interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  returnUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  orderId: string;
  amount: number;
  paymentUrl: string;
  qrString?: string; // For QRIS
  vaNumber?: string; // For Virtual Account (payment_number)
  fee: number;
  totalPayment: number;
  paymentMethod: string;
  expiresAt: string;
}

export interface WebhookPayload {
  project: string;
  order_id: string;
  amount: number;
  status: "completed" | "pending";
  payment_method: string;
  completed_at?: string;
}

/**
 * Create a new payment transaction via API
 */
export async function createPayment(
  request: CreatePaymentRequest
): Promise<PaymentResponse> {
  if (!PAKASIR_API_KEY || !PAKASIR_PROJECT_SLUG) {
    throw new Error("Pakasir API credentials not configured");
  }

  try {
    const response = await fetch(
      `${PAKASIR_API_URL}/transactioncreate/${request.paymentMethod}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project: PAKASIR_PROJECT_SLUG,
          order_id: request.orderId,
          amount: request.amount,
          api_key: PAKASIR_API_KEY,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Failed to create payment transaction");
    }

    const data = await response.json();
    const payment = data.payment;

    // Generate payment URL for redirect
    const redirectParam = request.returnUrl
      ? `&redirect=${encodeURIComponent(request.returnUrl)}`
      : "";
    const paymentUrl = `https://app.pakasir.com/pay/${PAKASIR_PROJECT_SLUG}/${request.amount}?order_id=${request.orderId}${redirectParam}`;

    return {
      success: true,
      orderId: payment.order_id,
      amount: payment.amount,
      paymentUrl,
      qrString: payment.payment_number, // QR string or VA number
      vaNumber: payment.payment_number,
      fee: payment.fee,
      totalPayment: payment.total_payment,
      paymentMethod: payment.payment_method,
      expiresAt: payment.expired_at,
    };
  } catch (error) {
    console.error("Pakasir createPayment error:", error);
    throw error;
  }
}

/**
 * Get payment transaction status
 */
export async function getPaymentStatus(
  orderId: string,
  amount: number
): Promise<{ status: string; completedAt?: string }> {
  if (!PAKASIR_API_KEY || !PAKASIR_PROJECT_SLUG) {
    throw new Error("Pakasir API credentials not configured");
  }

  try {
    const url = `${PAKASIR_API_URL}/transactiondetail?project=${PAKASIR_PROJECT_SLUG}&amount=${amount}&order_id=${orderId}&api_key=${PAKASIR_API_KEY}`;

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Failed to get payment status");
    }

    const data = await response.json();
    const transaction = data.transaction;

    return {
      status: transaction.status, // 'completed' or 'pending'
      completedAt: transaction.completed_at,
    };
  } catch (error) {
    console.error("Pakasir getPaymentStatus error:", error);
    throw error;
  }
}

/**
 * Verify webhook payload
 * Note: Pakasir doesn't use signature verification.
 * Always verify order_id and amount match your database records.
 */
export function verifyWebhookPayload(payload: WebhookPayload): boolean {
  // Basic validation
  if (!payload.project || !payload.order_id || !payload.amount) {
    return false;
  }

  // Verify project matches
  if (payload.project !== PAKASIR_PROJECT_SLUG) {
    return false;
  }

  return true;
}

/**
 * Generate payment URL for redirect
 */
export function generatePaymentUrl(
  orderId: string,
  amount: number,
  returnUrl?: string
): string {
  const redirectParam = returnUrl
    ? `&redirect=${encodeURIComponent(returnUrl)}`
    : "";
  return `https://app.pakasir.com/pay/${PAKASIR_PROJECT_SLUG}/${amount}?order_id=${orderId}${redirectParam}`;
}

/**
 * Format payment method display name
 */
export function formatPaymentMethod(method: string): string {
  const methodMap: Record<string, string> = {
    qris: "QRIS",
    bni_va: "BNI Virtual Account",
    bri_va: "BRI Virtual Account",
    cimb_niaga_va: "CIMB Niaga Virtual Account",
    sampoerna_va: "Sampoerna Virtual Account",
    bnc_va: "BNC Virtual Account",
    maybank_va: "Maybank Virtual Account",
    permata_va: "Permata Virtual Account",
    atm_bersama_va: "ATM Bersama Virtual Account",
    artha_graha_va: "Artha Graha Virtual Account",
    retail: "Retail Payment",
  };
  return methodMap[method] || method;
}

/**
 * Check if payment method is valid
 */
export function isValidPaymentMethod(method: string): method is PaymentMethod {
  const validMethods: PaymentMethod[] = [
    "qris",
    "bni_va",
    "bri_va",
    "cimb_niaga_va",
    "sampoerna_va",
    "bnc_va",
    "maybank_va",
    "permata_va",
    "atm_bersama_va",
    "artha_graha_va",
    "retail",
  ];
  return validMethods.includes(method as PaymentMethod);
}

/**
 * Simulate payment for sandbox testing
 */
export async function simulatePayment(
  orderId: string,
  amount: number
): Promise<boolean> {
  if (!PAKASIR_API_KEY || !PAKASIR_PROJECT_SLUG) {
    throw new Error("Pakasir API credentials not configured");
  }

  try {
    const response = await fetch(`${PAKASIR_API_URL}/paymentsimulation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project: PAKASIR_PROJECT_SLUG,
        order_id: orderId,
        amount: amount,
        api_key: PAKASIR_API_KEY,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Pakasir simulatePayment error:", error);
    return false;
  }
}
