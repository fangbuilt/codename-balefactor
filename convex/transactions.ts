import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const modifierSelectionValidator = v.object({
  temperature: v.optional(v.id("itemModifiers")),
  sweetness: v.optional(v.id("itemModifiers")),
});

export const getCurrentCart = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const cart = await ctx.db
      .query("transactions")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "draft"))
      .unique();

    if (!cart) {
      return null;
    }

    // Populate menu item, add-on, and modifier details
    const populatedItems = [];
    for (const item of cart.items) {
      const menuItem = await ctx.db.get(item.menuItemId);
      const populatedAddOns = [];
      for (const addOn of item.addOns) {
        const addOnDetails = await ctx.db.get(addOn.addOnId);
        populatedAddOns.push({
          ...addOn,
          details: addOnDetails,
        });
      }

      const temperatureModifier = item.modifiers?.temperature
        ? await ctx.db.get(item.modifiers.temperature)
        : null;
      const sweetnessModifier = item.modifiers?.sweetness
        ? await ctx.db.get(item.modifiers.sweetness)
        : null;

      populatedItems.push({
        ...item,
        menuItem,
        addOns: populatedAddOns,
        modifierDetails: {
          temperature: temperatureModifier,
          sweetness: sweetnessModifier,
        },
      });
    }

    return {
      ...cart,
      items: populatedItems,
    };
  },
});

export const addToCart = mutation({
  args: {
    menuItemId: v.id("menuItems"),
    quantity: v.number(),
    addOns: v.array(v.id("addOns")),
    modifiers: v.optional(modifierSelectionValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const menuItem = await ctx.db.get(args.menuItemId);
    if (!menuItem) {
      throw new Error("Menu item not found");
    }

    const selectedTemperature = args.modifiers?.temperature || undefined;
    const selectedSweetness = args.modifiers?.sweetness || undefined;

    const allowedTemperature =
      menuItem.itemModifierEligibility?.temperature || [];
    const allowedSweetness =
      menuItem.itemModifierEligibility?.sweetness || [];

    if (
      selectedTemperature &&
      !allowedTemperature.some((id) => id === selectedTemperature)
    ) {
      throw new Error("Temperature modifier not allowed for this item");
    }

    if (
      selectedSweetness &&
      !allowedSweetness.some((id) => id === selectedSweetness)
    ) {
      throw new Error("Sweetness modifier not allowed for this item");
    }

    // Get add-ons
    const addOnDetails = [];
    let addOnTotal = 0;
    for (const addOnId of args.addOns) {
      const addOn = await ctx.db.get(addOnId);
      if (addOn) {
        addOnDetails.push({
          addOnId,
          price: addOn.price,
        });
        addOnTotal += addOn.price;
      }
    }

    // Calculate pricing
    let basePrice = menuItem.cogm;
    let appliedDiscount = undefined;
    const now = Date.now();

    if (menuItem.hasPromo && menuItem.promoActive && 
        menuItem.promoStartDate && menuItem.promoEndDate &&
        now >= menuItem.promoStartDate && now <= menuItem.promoEndDate) {
      
      if (menuItem.discountType === "percentage") {
        const discountAmount = basePrice * ((menuItem.discountValue || 0) / 100);
        basePrice = basePrice - discountAmount;
        appliedDiscount = {
          type: "percentage" as const,
          value: menuItem.discountValue || 0,
          amount: discountAmount,
        };
      } else if (menuItem.discountType === "fixed") {
        const discountAmount = Math.min(basePrice, menuItem.discountValue || 0);
        basePrice = Math.max(0, basePrice - discountAmount);
        appliedDiscount = {
          type: "fixed" as const,
          value: menuItem.discountValue || 0,
          amount: discountAmount,
        };
      }
    }

    const itemTotal = (basePrice + addOnTotal) * args.quantity;

    // Get or create cart
    let cart = await ctx.db
      .query("transactions")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "draft"))
      .unique();

    const modifierPayload =
      selectedTemperature || selectedSweetness
        ? {
            modifiers: {
              temperature: selectedTemperature,
              sweetness: selectedSweetness,
            },
          }
        : {};

    const newItem = {
      menuItemId: args.menuItemId,
      quantity: args.quantity,
      basePrice: menuItem.cogm,
      addOns: addOnDetails,
      appliedDiscount,
      itemTotal,
      ...modifierPayload,
    };

    if (!cart) {
      // Create new cart
      const totalDiscount = appliedDiscount?.amount || 0;
      await ctx.db.insert("transactions", {
        status: "draft",
        userId,
        items: [newItem],
        subtotal: itemTotal + (totalDiscount * args.quantity),
        totalDiscount: totalDiscount * args.quantity,
        total: itemTotal,
        cogs: menuItem.cogm * args.quantity,
      });
    } else {
      // Update existing cart
      const updatedItems = [...cart.items, newItem];
      const subtotal = updatedItems.reduce((sum, item) => sum + (item.basePrice + item.addOns.reduce((addOnSum, addOn) => addOnSum + addOn.price, 0)) * item.quantity, 0);
      const itemDiscount = updatedItems.reduce((sum, item) => sum + ((item.appliedDiscount?.amount || 0) * item.quantity), 0);
      const transactionDiscountAmount = cart.transactionDiscount?.amount || 0;
      const totalDiscount = itemDiscount + transactionDiscountAmount;
      const total = subtotal - totalDiscount;
      const cogs = updatedItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);

      await ctx.db.patch(cart._id, {
        items: updatedItems,
        subtotal,
        totalDiscount,
        total,
        cogs,
      });
    }
  },
});

export const applyTransactionDiscount = mutation({
  args: {
    type: v.union(v.literal("percentage"), v.literal("fixed")),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const cart = await ctx.db
      .query("transactions")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "draft"))
      .unique();

    if (!cart) {
      throw new Error("No active cart found");
    }

    const subtotal = cart.subtotal;
    const itemDiscount = cart.items.reduce((sum, item) => sum + ((item.appliedDiscount?.amount || 0) * item.quantity), 0);
    
    let transactionDiscountAmount = 0;
    if (args.type === "percentage") {
      transactionDiscountAmount = subtotal * (args.value / 100);
    } else {
      transactionDiscountAmount = Math.min(subtotal, args.value);
    }

    const transactionDiscount = {
      type: args.type,
      value: args.value,
      amount: transactionDiscountAmount,
    };

    const totalDiscount = itemDiscount + transactionDiscountAmount;
    const total = Math.max(0, subtotal - totalDiscount);

    await ctx.db.patch(cart._id, {
      transactionDiscount,
      totalDiscount,
      total,
    });
  },
});

export const removeTransactionDiscount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const cart = await ctx.db
      .query("transactions")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "draft"))
      .unique();

    if (!cart) {
      throw new Error("No active cart found");
    }

    const itemDiscount = cart.items.reduce((sum, item) => sum + ((item.appliedDiscount?.amount || 0) * item.quantity), 0);
    const total = cart.subtotal - itemDiscount;

    await ctx.db.patch(cart._id, {
      transactionDiscount: undefined,
      totalDiscount: itemDiscount,
      total,
    });
  },
});

export const updateCartItemQuantity = mutation({
  args: {
    itemIndex: v.number(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const cart = await ctx.db
      .query("transactions")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "draft"))
      .unique();

    if (!cart) {
      throw new Error("No active cart found");
    }

    const updatedItems = [...cart.items];
    if (args.quantity <= 0) {
      updatedItems.splice(args.itemIndex, 1);
    } else {
      const item = updatedItems[args.itemIndex];
      const baseItemPrice = item.basePrice + item.addOns.reduce((sum, addOn) => sum + addOn.price, 0);
      const discountedPrice = item.appliedDiscount ? 
        (item.appliedDiscount.type === "percentage" ? 
          baseItemPrice * (1 - item.appliedDiscount.value / 100) :
          Math.max(0, baseItemPrice - item.appliedDiscount.value)) :
        baseItemPrice;
      
      updatedItems[args.itemIndex] = {
        ...item,
        quantity: args.quantity,
        itemTotal: discountedPrice * args.quantity,
      };
    }

    if (updatedItems.length === 0) {
      await ctx.db.delete(cart._id);
      return;
    }

    const subtotal = updatedItems.reduce((sum, item) => sum + (item.basePrice + item.addOns.reduce((addOnSum, addOn) => addOnSum + addOn.price, 0)) * item.quantity, 0);
    const itemDiscount = updatedItems.reduce((sum, item) => sum + ((item.appliedDiscount?.amount || 0) * item.quantity), 0);
    const transactionDiscountAmount = cart.transactionDiscount?.amount || 0;
    const totalDiscount = itemDiscount + transactionDiscountAmount;
    const total = subtotal - totalDiscount;
    const cogs = updatedItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);

    await ctx.db.patch(cart._id, {
      items: updatedItems,
      subtotal,
      totalDiscount,
      total,
      cogs,
    });
  },
});

export const clearCart = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const cart = await ctx.db
      .query("transactions")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "draft"))
      .unique();

    if (cart) {
      await ctx.db.delete(cart._id);
    }
  },
});

export const checkout = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const cart = await ctx.db
      .query("transactions")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "draft"))
      .unique();

    if (!cart) {
      throw new Error("No active cart found");
    }

    await ctx.db.patch(cart._id, {
      status: "completed",
    });

    return cart._id;
  },
});

export const getCompletedTransactions = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let query = ctx.db
      .query("transactions")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .order("desc");

    if (args.startDate && args.endDate) {
      query = query.filter((q) => 
        q.gte(q.field("_creationTime"), args.startDate!) &&
        q.lte(q.field("_creationTime"), args.endDate!)
      );
    }

    const transactions = await query.take(args.limit || 10);
    
    // Populate menu item details
    const populatedTransactions = [];
    for (const transaction of transactions) {
      const populatedItems = [];
      for (const item of transaction.items) {
        const menuItem = await ctx.db.get(item.menuItemId);
        populatedItems.push({
          ...item,
          menuItem,
        });
      }
      populatedTransactions.push({
        ...transaction,
        items: populatedItems,
      });
    }

    return populatedTransactions;
  },
});

export const getTransactionById = query({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const transaction = await ctx.db.get(args.id);
    if (!transaction) {
      return null;
    }

    // Populate menu item details
    const populatedItems = [];
    for (const item of transaction.items) {
      const menuItem = await ctx.db.get(item.menuItemId);
      const populatedAddOns = [];
      for (const addOn of item.addOns) {
        const addOnDetails = await ctx.db.get(addOn.addOnId);
        populatedAddOns.push({
          ...addOn,
          details: addOnDetails,
        });
      }
      populatedItems.push({
        ...item,
        menuItem,
        addOns: populatedAddOns,
        modifierDetails: {
          temperature: item.modifiers?.temperature
            ? await ctx.db.get(item.modifiers.temperature)
            : null,
          sweetness: item.modifiers?.sweetness
            ? await ctx.db.get(item.modifiers.sweetness)
            : null,
        },
      });
    }

    return {
      ...transaction,
      items: populatedItems,
    };
  },
});
