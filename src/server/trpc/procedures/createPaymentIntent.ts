import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { env } from "~/server/env";

export const createPaymentIntent = baseProcedure
  .input(
    z.object({
      token: z.string(),
      amount: z.number().positive(),
      type: z.enum(["subscription", "credits", "marketplace_item", "report"]),
      itemId: z.number().optional(),
      metadata: z.record(z.string()).optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Validate Stripe is configured
    if (!env.STRIPE_SECRET_KEY) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Payment system is not configured",
      });
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        amount: input.amount,
        currency: "USD",
        status: "pending",
        paymentMethod: "card",
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });

    // In a real implementation, we would create a Stripe payment intent here
    // For now, we'll return a mock response
    // const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(input.amount * 100), // Convert to cents
    //   currency: "usd",
    //   metadata: {
    //     paymentId: payment.id.toString(),
    //     userId: user.id.toString(),
    //     type: input.type,
    //   },
    // });

    // Update payment with Stripe ID
    // await db.payment.update({
    //   where: { id: payment.id },
    //   data: { stripePaymentIntentId: paymentIntent.id },
    // });

    return {
      paymentId: payment.id,
      clientSecret: `mock_client_secret_${payment.id}`, // Would be paymentIntent.client_secret
      amount: input.amount,
    };
  });
