/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as addOns from "../addOns.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as itemModifiers from "../itemModifiers.js";
import type * as menuItems from "../menuItems.js";
import type * as resendOTP from "../resendOTP.js";
import type * as resendOTPPasswordReset from "../resendOTPPasswordReset.js";
import type * as router from "../router.js";
import type * as transactions from "../transactions.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  addOns: typeof addOns;
  analytics: typeof analytics;
  auth: typeof auth;
  http: typeof http;
  itemModifiers: typeof itemModifiers;
  menuItems: typeof menuItems;
  resendOTP: typeof resendOTP;
  resendOTPPasswordReset: typeof resendOTPPasswordReset;
  router: typeof router;
  transactions: typeof transactions;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
