import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * HTTP endpoint to trigger mining operations processing
 * Can be called by external cron services (e.g., cron-job.org, EasyCron)
 * 
 * Usage: POST/GET to /processMiningOperations
 */
const processMiningOperationsAction = httpAction(async (ctx, request) => {
  // Optional: Add authentication here if needed
  // const authHeader = request.headers.get("authorization");
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response("Unauthorized", { status: 401 });
  // }

  try {
    const result = await ctx.runMutation(internal.crons.processMiningOperationsMutation, {});
    
    return new Response(
      JSON.stringify({
        success: true,
        ...result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing mining operations:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

const http = httpRouter();

http.route({
  path: "/processMiningOperations",
  method: "GET",
  handler: processMiningOperationsAction,
});

http.route({
  path: "/processMiningOperations",
  method: "POST",
  handler: processMiningOperationsAction,
});

export default http;

