import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const purchaseCredits = baseProcedure
  .input(
    z.object({
      token: z.string(),
      credits: z.number().int().positive(),
      paymentIntentId: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Calculate amount (e.g., $1 per credit)
    const amount = input.credits * 1.0;

    // Verify payment was successful (in real implementation, verify with Stripe)
    const payment = await db.payment.findFirst({
      where: {
        userId: user.id,
        stripePaymentIntentId: input.paymentIntentId,
        status: "succeeded",
      },
    });

    if (!payment) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Payment not found or not successful",
      });
    }

    // Create order
    const order = await db.order.create({
      data: {
        paymentId: payment.id,
        userId: user.id,
        type: "credits",
        quantity: input.credits,
        totalAmount: amount,
        status: "completed",
      },
    });

    // Get or create credit balance
    let balance = await db.creditBalance.findUnique({
      where: { userId: user.id },
    });

    if (!balance) {
      balance = await db.creditBalance.create({
        data: {
          userId: user.id,
          balance: 0,
          lifetimeEarned: 0,
          lifetimeSpent: 0,
        },
      });
    }

    // Add credits
    const updatedBalance = await db.creditBalance.update({
      where: { id: balance.id },
      data: {
        balance: balance.balance + input.credits,
        lifetimeEarned: balance.lifetimeEarned + input.credits,
      },
    });

    // Create transaction record
    await db.creditTransaction.create({
      data: {
        balanceId: balance.id,
        amount: input.credits,
        type: "purchase",
        description: `Purchased ${input.credits} credits`,
        referenceId: order.id.toString(),
      },
    });

    return {
      success: true,
      orderId: order.id,
      newBalance: updatedBalance.balance,
      creditsAdded: input.credits,
    };
  });
