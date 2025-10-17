import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getMarketplaceListingDetails = baseProcedure
  .input(
    z.object({
      token: z.string(),
      listingId: z.number(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const listing = await db.marketplaceListing.findUnique({
      where: { id: input.listingId },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            purchases: true,
            reviews: true,
          },
        },
      },
    });

    if (!listing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Listing not found",
      });
    }

    // Check if user has already purchased this listing
    const userPurchase = await db.marketplacePurchase.findFirst({
      where: {
        listingId: input.listingId,
        buyerId: user.id,
        status: "completed",
      },
    });

    return {
      listing,
      hasPurchased: !!userPurchase,
    };
  });
