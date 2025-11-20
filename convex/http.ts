import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// HTTP endpoint to manually trigger mining operations processing
const processMiningOperations = httpAction(async (ctx) => {
  try {
    await ctx.runAction(internal.crons.processMiningOperationsAction, {});
    return new Response(
      JSON.stringify({
        success: true,
        message: "Mining operations processed successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
});

const sendTicketReplyEmail = httpAction(async (ctx, request) => {
  const { to, ticketSubject, ticketId, replyMessage, isAdminReply, userName } =
    await request.json();

  // Call internal action to send email
  await ctx.runAction(internal.emails.sendTicketReplyEmail, {
    to,
    ticketSubject,
    ticketId,
    replyMessage,
    isAdminReply,
    userName,
  });

  return new Response(
    JSON.stringify({
      success: true,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
});

const sendTicketStatusChangeEmail = httpAction(async (ctx, request) => {
  const { to, ticketSubject, ticketId, status, userName } = await request.json();

  await ctx.runAction(internal.emails.sendTicketStatusChangeEmail, {
    to,
    ticketSubject,
    ticketId,
    status,
    userName,
  });

  return new Response(
    JSON.stringify({
      success: true,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
});

http.route({
  path: "/sendTicketReplyEmail",
  method: "POST",
  handler: sendTicketReplyEmail,
});

http.route({
  path: "/sendTicketStatusChangeEmail",
  method: "POST",
  handler: sendTicketStatusChangeEmail,
});

http.route({
  path: "/processMiningOperations",
  method: "GET",
  handler: processMiningOperations,
});

http.route({
  path: "/processMiningOperations",
  method: "POST",
  handler: processMiningOperations,
});

export default http;
