/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as dashboard from "../dashboard.js";
import type * as deposits from "../deposits.js";
import type * as hotWallets from "../hotWallets.js";
import type * as miningOperations from "../miningOperations.js";
import type * as plans from "../plans.js";
import type * as platformSettings from "../platformSettings.js";
import type * as sessions from "../sessions.js";
import type * as users from "../users.js";
import type * as usersAdmin from "../usersAdmin.js";
import type * as withdrawals from "../withdrawals.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  dashboard: typeof dashboard;
  deposits: typeof deposits;
  hotWallets: typeof hotWallets;
  miningOperations: typeof miningOperations;
  plans: typeof plans;
  platformSettings: typeof platformSettings;
  sessions: typeof sessions;
  users: typeof users;
  usersAdmin: typeof usersAdmin;
  withdrawals: typeof withdrawals;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
