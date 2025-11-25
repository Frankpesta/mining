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
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as deposits from "../deposits.js";
import type * as emails from "../emails.js";
import type * as hotWallets from "../hotWallets.js";
import type * as http from "../http.js";
import type * as initPlans from "../initPlans.js";
import type * as migrations from "../migrations.js";
import type * as miningOperations from "../miningOperations.js";
import type * as notifications from "../notifications.js";
import type * as plans from "../plans.js";
import type * as platformSettings from "../platformSettings.js";
import type * as prices from "../prices.js";
import type * as profiles from "../profiles.js";
import type * as referrals from "../referrals.js";
import type * as sessions from "../sessions.js";
import type * as tickets from "../tickets.js";
import type * as users from "../users.js";
import type * as usersAdmin from "../usersAdmin.js";
import type * as wallet from "../wallet.js";
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
  crons: typeof crons;
  dashboard: typeof dashboard;
  deposits: typeof deposits;
  emails: typeof emails;
  hotWallets: typeof hotWallets;
  http: typeof http;
  initPlans: typeof initPlans;
  migrations: typeof migrations;
  miningOperations: typeof miningOperations;
  notifications: typeof notifications;
  plans: typeof plans;
  platformSettings: typeof platformSettings;
  prices: typeof prices;
  profiles: typeof profiles;
  referrals: typeof referrals;
  sessions: typeof sessions;
  tickets: typeof tickets;
  users: typeof users;
  usersAdmin: typeof usersAdmin;
  wallet: typeof wallet;
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
