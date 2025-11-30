import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  categories: defineTable({
    name: v.string(), // Coffee, Non-Coffee, Consigment, etc.
    sortOrder: v.number(),
  }),

  variationCategories: defineTable({
    name: v.string(), // Temperature, Sweetness, Add-ons, etc. (Size, etc. can be added later)
    sortOrder: v.number(),
  }),

  menuVariations: defineTable({
    name: v.string(), // Hot, Cold, Less Sugar, Extra Shot, etc.
    variationCategoryId: v.id("variationCategories"),
    price: v.optional(v.number()),
    sortOrder: v.number(),
  }).index("by_variation_category_and_sort_order", [
    "variationCategoryId",
    "sortOrder",
  ]),

  menuItems: defineTable({
    name: v.string(),
    categoryId: v.id("categories"),
    cogm: v.number(),
    isActive: v.boolean(),
  })
    .index("by_category", ["categoryId"])
    .index("by_is_active", ["isActive"])
    .index("by_category_and_is_active", ["categoryId", "isActive"]),

  menuItemVariationEligibility: defineTable({
    menuItemId: v.id("menuItems"),
    variationCategoryId: v.id("variationCategories"),
  })
    .index("by_menu_item", ["menuItemId"])
    .index("by_variation_category", ["variationCategoryId"]),

  promos: defineTable({
    name: v.optional(v.string()),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    discountAmount: v.optional(v.number()),
    validUntil: v.optional(v.number()),
    applicableTo: v.union(v.literal("item"), v.literal("transaction")),
  }).index("by_valid_until", ["validUntil"]),

  menuItemPromos: defineTable({
    menuItemId: v.id("menuItems"),
    promoId: v.id("promos"),
  })
    .index("by_menu_item", ["menuItemId"])
    .index("by_promo", ["promoId"]),

  transactions: defineTable({
    userId: v.id("users"),
    cogs: v.number(),
  }).index("by_user", ["userId"]),

  carts: defineTable({
    transactionId: v.id("transactions"),
    subtotal: v.number(),
    totalDiscount: v.number(),
    total: v.number(), // subtotal - totalDiscount
  }).index("by_transaction", ["transactionId"]),

  cartItems: defineTable({
    cartId: v.id("carts"),
    menuItemId: v.id("menuItems"),
    quantity: v.number(),
    basePrice: v.number(), // cogm snapshot
    itemTotal: v.number(), // (basePrice + variation prices) * quantity - item discount
  }).index("by_cart", ["cartId"]),

  cartItemVariations: defineTable({
    cartItemId: v.id("cartItems"),
    menuVariationId: v.id("menuVariations"),
    price: v.number(), // snapshot
  }).index("by_cart_item", ["cartItemId"]),

  appliedDiscounts: defineTable({
    cartItemId: v.optional(v.id("cartItems")),
    cartId: v.optional(v.id("carts")),
    promoId: v.id("promos"),
    discountAmount: v.number(),
  })
    .index("by_cart_item", ["cartItemId"])
    .index("by_cart", ["cartId"]),

  userRoles: defineTable({
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("staff"),
      v.literal("customer")
    ),
  }).index("by_user", ["userId"]),
});
