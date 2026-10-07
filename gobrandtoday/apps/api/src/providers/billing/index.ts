import type { Currency, PlanId } from '@gbt/shared';
import { env } from '../../config/env';

/**
 * Billing is architected but not switched on: Razorpay for INR (UPI, cards,
 * netbanking) and Stripe for USD. Implement `createCheckout` per provider and
 * flip BILLING_PROVIDER — routes, plans and limits already read from here.
 */
export interface CheckoutSession {
  url: string;
}

export interface BillingProvider {
  readonly id: 'none' | 'razorpay' | 'stripe';
  readonly enabled: boolean;
  createCheckout(input: { userId: string; email: string; plan: PlanId; currency: Currency }): Promise<CheckoutSession>;
}

class DisabledBilling implements BillingProvider {
  readonly id = 'none' as const;
  readonly enabled = false;
  async createCheckout(): Promise<CheckoutSession> {
    throw new Error('Billing is not configured yet.');
  }
}

export const billing: BillingProvider = env.BILLING_PROVIDER === 'none' ? new DisabledBilling() : new DisabledBilling();
