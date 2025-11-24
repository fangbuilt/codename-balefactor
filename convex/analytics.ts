import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const getWeeklySales = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // Friday
    endOfWeek.setHours(23, 59, 59, 999);

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .filter((q) => 
        q.and(
          q.gte(q.field("_creationTime"), startOfWeek.getTime()),
          q.lte(q.field("_creationTime"), endOfWeek.getTime())
        )
      )
      .collect();

    const dailySales = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
    };

    transactions.forEach((transaction) => {
      const date = new Date(transaction._creationTime);
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      if (dayName in dailySales) {
        dailySales[dayName as keyof typeof dailySales] += transaction.total;
      }
    });

    return Object.entries(dailySales).map(([day, total]) => ({
      day,
      total,
    }));
  },
});

export const getMonthlySales = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .filter((q) => q.gte(q.field("_creationTime"), thirtyDaysAgo.getTime()))
      .collect();

    const dailySales: Record<string, number> = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction._creationTime);
      const dateKey = date.toISOString().split("T")[0];
      dailySales[dateKey] = (dailySales[dateKey] || 0) + transaction.total;
    });

    return Object.entries(dailySales)
      .map(([date, total]) => ({
        date,
        total,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const getMenuItemRanking = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let query = ctx.db
      .query("transactions")
      .withIndex("by_status", (q) => q.eq("status", "completed"));

    if (args.startDate && args.endDate) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field("_creationTime"), args.startDate!),
          q.lte(q.field("_creationTime"), args.endDate!)
        )
      );
    }

    const transactions = await query.collect();

    const itemStats: Record<string, { quantity: number; revenue: number; name: string }> = {};

    for (const transaction of transactions) {
      for (const item of transaction.items) {
        const menuItem = await ctx.db.get(item.menuItemId);
        if (menuItem) {
          const key = menuItem._id;
          if (!itemStats[key]) {
            itemStats[key] = {
              quantity: 0,
              revenue: 0,
              name: menuItem.name,
            };
          }
          itemStats[key].quantity += item.quantity;
          itemStats[key].revenue += item.itemTotal;
        }
      }
    }

    return Object.values(itemStats)
      .sort((a, b) => b.quantity - a.quantity);
  },
});
