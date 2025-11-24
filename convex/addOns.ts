import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("addOns").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    price: v.number(),
    type: v.union(v.literal("extra-shot"), v.literal("oat-milk")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("addOns", args);
  },
});

// Initialize default add-ons
export const initializeAddOns = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.query("addOns").collect();
    if (existing.length > 0) return;

    await ctx.db.insert("addOns", {
      name: "Extra Shot",
      price: 6000,
      type: "extra-shot",
    });

    await ctx.db.insert("addOns", {
      name: "Oat Milk",
      price: 3000,
      type: "oat-milk",
    });
  },
});
