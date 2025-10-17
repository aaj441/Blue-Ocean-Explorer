import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const createMarketplaceReview = baseProcedure
  .input(
    z.object({
      token: z.string(),
      listingId: z.number(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Check if user has purchased this listing
    const purchase = await db.marketplacePurchase.findFirst({
      where: {
        listingId: input.listingId,
        buyerId: user.id,
        status: "completed",
      },
    });

    const isVerifiedPurchase = !!purchase;

    // Check if user has already reviewed
    const existingReview = await db.marketplaceReview.findUnique({
      where: {
        listingId_userId: {
          listingId: input.listingId,
          userId: user.id,
        },
      },
    });

    if (existingReview) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You have already reviewed this listing",
      });
    }

    const review = await db.$transaction(async (tx) => {
      // Create review
      const newReview = await tx.marketplaceReview.create({
        data: {
          listingId: input.listingId,
          userId: user.id,
          rating: input.rating,
          comment: input.comment,
          isVerifiedPurchase,
        },
      });

      // Recalculate average rating
      const allReviews = await tx.marketplaceReview.findMany({
        where: { listingId: input.listingId },
      });

      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await tx.marketplaceListing.update({
        where: { id: input.listingId },
        data: { averageRating: avgRating },
      });

      return newReview;
    });

    return { review };
  });
