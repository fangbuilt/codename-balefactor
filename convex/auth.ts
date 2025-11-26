import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import { query } from "./_generated/server";
import { ResendOTP } from "./resendOTP";
import { ResendOTPPasswordReset } from "./resendOTPPasswordReset";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({ 
      reset: ResendOTPPasswordReset,
      verify: ResendOTP,
    }),
    Google,
    ResendOTP,
  ],
});

export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    const roleDoc = await ctx.db
      .query("userRoles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    return {
      ...user,
      role: roleDoc?.role ?? "staff",
    };
  },
});
