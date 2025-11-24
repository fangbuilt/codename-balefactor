import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const categoryValidator = v.union(
  v.literal("Coffee"),
  v.literal("Non-Coffee"),
  v.literal("Merch"),
  v.literal("Promo"),
  v.literal("Add-on"),
  v.literal("Consignment"),
  v.literal("Bundle")
);

const addOnEligibilityValidator = v.union(
  v.literal("coffee-based"),
  v.literal("non-coffee"),
  v.literal("none"),
  v.literal("coffee-only")
);

const modifierEligibilityValidator = v.object({
  temperature: v.array(v.id("itemModifiers")),
  sweetness: v.array(v.id("itemModifiers")),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const items = await ctx.db.query("menuItems").collect();
    const now = Date.now();
    
    return items.map(item => {
      const itemModifierEligibility = item.itemModifierEligibility ?? {
        temperature: [],
        sweetness: [],
      };
      let finalPrice = item.cogm;
      let hasActivePromo = false;
      
      if (item.hasPromo && item.promoActive && 
          item.promoStartDate && item.promoEndDate &&
          now >= item.promoStartDate && now <= item.promoEndDate) {
        hasActivePromo = true;
        if (item.discountType === "percentage") {
          finalPrice = item.cogm * (1 - (item.discountValue || 0) / 100);
        } else if (item.discountType === "fixed") {
          finalPrice = Math.max(0, item.cogm - (item.discountValue || 0));
        }
      }
      
      return {
        ...item,
        finalPrice,
        hasActivePromo,
        itemModifierEligibility,
      };
    });
  },
});

export const listForPOS = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const allItems = await ctx.db.query("menuItems").collect();
    const items = allItems.filter(item => (item.status || "active") === "active");
    
    const now = Date.now();
    
    return items.map(item => {
      const itemModifierEligibility = item.itemModifierEligibility ?? {
        temperature: [],
        sweetness: [],
      };
      let finalPrice = item.cogm;
      let hasActivePromo = false;
      
      if (item.hasPromo && item.promoActive && 
          item.promoStartDate && item.promoEndDate &&
          now >= item.promoStartDate && now <= item.promoEndDate) {
        hasActivePromo = true;
        if (item.discountType === "percentage") {
          finalPrice = item.cogm * (1 - (item.discountValue || 0) / 100);
        } else if (item.discountType === "fixed") {
          finalPrice = Math.max(0, item.cogm - (item.discountValue || 0));
        }
      }
      
      return {
        ...item,
        finalPrice,
        hasActivePromo,
        itemModifierEligibility,
      };
    });
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category: categoryValidator,
    cogm: v.number(),
    addOnEligibility: addOnEligibilityValidator,
    itemModifierEligibility: v.optional(modifierEligibilityValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const { itemModifierEligibility, ...rest } = args;
    const eligibility = itemModifierEligibility ?? {
      temperature: [],
      sweetness: [],
    };

    return await ctx.db.insert("menuItems", {
      ...rest,
      itemModifierEligibility: eligibility,
      status: "active",
      hasPromo: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("menuItems"),
    name: v.optional(v.string()),
    category: v.optional(categoryValidator),
    cogm: v.optional(v.number()),
    addOnEligibility: v.optional(addOnEligibilityValidator),
    itemModifierEligibility: v.optional(modifierEligibilityValidator),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    hasPromo: v.optional(v.boolean()),
    discountType: v.optional(v.union(v.literal("percentage"), v.literal("fixed"))),
    discountValue: v.optional(v.number()),
    promoStartDate: v.optional(v.number()),
    promoEndDate: v.optional(v.number()),
    promoActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const bulkUpdate = mutation({
  args: {
    ids: v.array(v.id("menuItems")),
    updates: v.object({
      status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
      hasPromo: v.optional(v.boolean()),
      discountType: v.optional(v.union(v.literal("percentage"), v.literal("fixed"))),
      discountValue: v.optional(v.number()),
      promoStartDate: v.optional(v.number()),
      promoEndDate: v.optional(v.number()),
      promoActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    for (const id of args.ids) {
      await ctx.db.patch(id, args.updates);
    }
  },
});

export const bulkDelete = mutation({
  args: { ids: v.array(v.id("menuItems")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
  },
});

export const remove = mutation({
  args: { id: v.id("menuItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.id);
  },
});
