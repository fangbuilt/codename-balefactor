import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const modifierTypeValidator = v.union(
  v.literal("temperature"),
  v.literal("sweetness")
);

const DEFAULT_MODIFIERS: Record<
  "temperature" | "sweetness",
  { name: string; sortOrder: number }[]
> = {
  temperature: [
    { name: "Hot", sortOrder: 1 },
    { name: "Warm", sortOrder: 2 },
    { name: "Less Ice", sortOrder: 3 },
    { name: "Cold", sortOrder: 4 },
  ],
  sweetness: [
    { name: "Not Sweet", sortOrder: 1 },
    { name: "Less Sugar", sortOrder: 2 },
    { name: "Normal", sortOrder: 3 },
  ],
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    const temperature = await ctx.db
      .query("itemModifiers")
      .withIndex("by_type_order", (q) => q.eq("type", "temperature"))
      .collect();

    const sweetness = await ctx.db
      .query("itemModifiers")
      .withIndex("by_type_order", (q) => q.eq("type", "sweetness"))
      .collect();

    return [...temperature, ...sweetness];
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: modifierTypeValidator,
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("itemModifiers", args);
  },
});

export const initializeDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    for (const [type, defaults] of Object.entries(DEFAULT_MODIFIERS) as [
      "temperature" | "sweetness",
      { name: string; sortOrder: number }[],
    ][]) {
      const existing = await ctx.db
        .query("itemModifiers")
        .withIndex("by_type_order", (q) => q.eq("type", type))
        .collect();
      const existingNames = new Set(existing.map((modifier) => modifier.name));

      for (const option of defaults) {
        if (!existingNames.has(option.name)) {
          await ctx.db.insert("itemModifiers", {
            name: option.name,
            type,
            sortOrder: option.sortOrder,
          });
        }
      }
    }
  },
});

