import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getMarketplaceListings = baseProcedure
  .input(
    z.object({
      token: z.string(),
      category: z.string().optional(),
      type: z.enum(["scenario_template", "analytic_template", "expert_report"]).optional(),
      searchQuery: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      sortBy: z.enum(["recent", "popular", "price_low", "price_high", "rating"]).default("recent"),
      cursor: z.number().optional(),
      limit: z.number().default(12),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const where: any = {
      isActive: true,
    };

    if (input.category) {
      where.category = input.category;
    }

    if (input.type) {
      where.type = input.type;
    }

    if (input.searchQuery) {
      where.OR = [
        { title: { contains: input.searchQuery, mode: "insensitive" } },
        { description: { contains: input.searchQuery, mode: "insensitive" } },
      ];
    }

    if (input.minPrice !== undefined || input.maxPrice !== undefined) {
      where.price = {};
      if (input.minPrice !== undefined) where.price.gte = input.minPrice;
      if (input.maxPrice !== undefined) where.price.lte = input.maxPrice;
    }

    let orderBy: any = { createdAt: "desc" };
    if (input.sortBy === "popular") {
      orderBy = { totalSales: "desc" };
    } else if (input.sortBy === "price_low") {
      orderBy = { price: "asc" };
    } else if (input.sortBy === "price_high") {
      orderBy = { price: "desc" };
    } else if (input.sortBy === "rating") {
      orderBy = { averageRating: "desc" };
    }

    const listings = await db.marketplaceListing.findMany({
      where,
      orderBy,
      take: input.limit + 1,
      skip: input.cursor || 0,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
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

    let nextCursor: number | undefined = undefined;
    if (listings.length > input.limit) {
      listings.pop();
      nextCursor = (input.cursor || 0) + input.limit;
    }

    return {
      listings,
      nextCursor,
    };
  });
