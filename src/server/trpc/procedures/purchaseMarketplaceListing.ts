import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const purchaseMarketplaceListing = baseProcedure
  .input(
    z.object({
      token: z.string(),
      listingId: z.number(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const listing = await db.marketplaceListing.findUnique({
      where: { id: input.listingId },
    });

    if (!listing || !listing.isActive) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Listing not found or inactive",
      });
    }

    // Check if already purchased
    const existingPurchase = await db.marketplacePurchase.findFirst({
      where: {
        listingId: input.listingId,
        buyerId: user.id,
        status: "completed",
      },
    });

    if (existingPurchase) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You have already purchased this item",
      });
    }

    // Check credit balance
    const creditBalance = await db.creditBalance.findUnique({
      where: { userId: user.id },
    });

    const priceInCredits = Math.ceil(listing.price * 10); // 1 USD = 10 credits

    if (!creditBalance || creditBalance.balance < priceInCredits) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Insufficient credits. You need ${priceInCredits} credits but have ${creditBalance?.balance || 0}.`,
      });
    }

    // Perform transaction
    const purchase = await db.$transaction(async (tx) => {
      // Create purchase record
      const newPurchase = await tx.marketplacePurchase.create({
        data: {
          listingId: input.listingId,
          buyerId: user.id,
          price: listing.price,
          status: "completed",
          accessGranted: true,
        },
      });

      // Deduct credits from buyer
      await tx.creditBalance.update({
        where: { userId: user.id },
        data: {
          balance: { decrement: priceInCredits },
          lifetimeSpent: { increment: priceInCredits },
        },
      });

      // Create credit transaction
      await tx.creditTransaction.create({
        data: {
          balanceId: creditBalance.id,
          amount: -priceInCredits,
          type: "marketplace_purchase",
          description: `Purchased: ${listing.title}`,
          referenceId: newPurchase.id.toString(),
        },
      });

      // Update listing stats
      await tx.marketplaceListing.update({
        where: { id: input.listingId },
        data: {
          totalSales: { increment: 1 },
          totalRevenue: { increment: listing.price },
        },
      });

      // Create commission for seller (70% commission rate)
      const commissionAmount = listing.price * 0.7;
      await tx.commission.create({
        data: {
          listingId: input.listingId,
          sellerId: listing.sellerId,
          saleAmount: listing.price,
          commissionRate: 0.7,
          commissionAmount,
          status: "pending",
        },
      });

      return newPurchase;
    });

    return { purchase };
  });
