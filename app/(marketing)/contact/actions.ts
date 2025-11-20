"use server";

import { revalidatePath } from "next/cache";
import { getConvexClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";
import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";

const ContactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function submitContactForm(
  prevState: { success: boolean; error?: string; message?: string } | null,
  formData: FormData,
) {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    message: formData.get("message"),
  };

  const parsed = ContactFormSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid form data",
    };
  }

  try {
    const convex = getConvexClient();
    const currentUser = await getCurrentUser();
    
    // Create ticket from contact form
    await convex.mutation(api.tickets.createTicket, {
      userId: currentUser?.user._id,
      email: parsed.data.email,
      name: parsed.data.name,
      subject: `Contact Form: ${parsed.data.name}`,
      message: parsed.data.message,
      company: parsed.data.company,
      priority: "medium",
    });

    revalidatePath("/contact");
    return {
      success: true,
      message: "Thank you for contacting us! We'll get back to you soon.",
    };
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return {
      success: false,
      error: "Failed to submit form. Please try again.",
    };
  }
}

