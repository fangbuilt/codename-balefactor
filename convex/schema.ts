import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const categoryValidator = v.union(
  v.literal("Coffee"),
  v.literal("Non-Coffee"),
  v.literal("Merch"),
  v.literal("Promo"),
  v.literal("Add-on"),
  v.literal("Consignment"),
  v.literal("Bundle")
);

const modifierEligibilityValidator = v.object({
  temperature: v.array(v.id("itemModifiers")),
  sweetness: v.array(v.id("itemModifiers")),
});

const applicationTables = {
  menuItems: defineTable({
    name: v.string(),
    category: categoryValidator,
    cogm: v.number(), // Cost of Goods Manufactured (base price)
    addOnEligibility: v.union(
      v.literal("coffee-only"), // Extra Shot only
      v.literal("coffee-based"), // can have both Extra Shot and Oat Milk
      v.literal("non-coffee"), // Oat Milk only
      v.literal("none") // no add-ons
    ),
    itemModifierEligibility: v.optional(modifierEligibilityValidator),
    // Active/Inactive status
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    // Promo fields
    hasPromo: v.boolean(),
    discountType: v.optional(v.union(v.literal("percentage"), v.literal("fixed"))),
    discountValue: v.optional(v.number()),
    promoStartDate: v.optional(v.number()),
    promoEndDate: v.optional(v.number()),
    promoActive: v.optional(v.boolean()),
  })
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_promo_active", ["hasPromo", "promoActive"]),

  addOns: defineTable({
    name: v.string(),
    price: v.number(),
    type: v.union(v.literal("extra-shot"), v.literal("oat-milk")),
  }),

  itemModifiers: defineTable({
    name: v.string(),
    type: v.union(v.literal("temperature"), v.literal("sweetness")),
    sortOrder: v.number(),
  }).index("by_type_order", ["type", "sortOrder"]),

  transactions: defineTable({
    status: v.union(v.literal("draft"), v.literal("completed")),
    userId: v.id("users"),
    items: v.array(v.object({
      menuItemId: v.id("menuItems"),
      quantity: v.number(),
      basePrice: v.number(),
      addOns: v.array(v.object({
        addOnId: v.id("addOns"),
        price: v.number(),
      })),
      modifiers: v.optional(v.object({
        temperature: v.optional(v.id("itemModifiers")),
        sweetness: v.optional(v.id("itemModifiers")),
      })),
      appliedDiscount: v.optional(v.object({
        type: v.union(v.literal("percentage"), v.literal("fixed")),
        value: v.number(),
        amount: v.number(), // actual discount amount
      })),
      itemTotal: v.number(),
    })),
    subtotal: v.number(),
    totalDiscount: v.number(),
    // Transaction-level discount
    transactionDiscount: v.optional(v.object({
      type: v.union(v.literal("percentage"), v.literal("fixed")),
      value: v.number(),
      amount: v.number(),
    })),
    total: v.number(),
    cogs: v.number(), // Cost of Goods Sold
  })
    .index("by_user_status", ["userId", "status"])
    .index("by_status", ["status"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
