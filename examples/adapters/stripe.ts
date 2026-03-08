/**
 * Adapter: Stripe
 *
 * WHAT: An adapter wraps a third-party SDK or API behind a narrow, stable interface.
 * WHEN: Any time you integrate an external service — payment, email, storage, ORM.
 *       Use cases call this adapter; they never import the vendor SDK directly.
 * WHERE: Lives in src/lib/. Never imports from src/use-cases/ or src/services/.
 *
 * Why it matters: to switch providers, you change only this file.
 * Every use case calling chargeCard() keeps working unchanged.
 */

import Stripe from 'stripe';

const client = new Stripe(process.env.STRIPE_KEY!);

export const stripeAdapter = {
  /**
   * Charge a card. Amount is in the currency's smallest unit (cents for USD).
   * token is a Stripe payment method token from the frontend.
   */
  async chargeCard(amountCents: number, token: string) {
    return client.charges.create({
      amount: amountCents,
      currency: 'usd',
      source: token,
    });
  },

  /**
   * Refund a previously created charge by its Stripe charge ID.
   */
  async refundCharge(chargeId: string) {
    return client.refunds.create({ charge: chargeId });
  },
};
