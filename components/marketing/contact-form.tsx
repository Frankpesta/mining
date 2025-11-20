"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactForm } from "@/app/(marketing)/contact/actions";
import { toast } from "sonner";
import { useEffect } from "react";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || "Thank you for contacting us! We'll get back to you soon.");
      // Reset form
      const form = document.getElementById("contact-form") as HTMLFormElement;
      if (form) {
        form.reset();
      }
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form id="contact-form" action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" placeholder="Jane Doe" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" name="email" type="email" placeholder="you@company.com" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="company" placeholder="HashFund Capital" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">How can we help?</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Tell us about your mining operation and goals…"
          rows={5}
          required
        />
      </div>
      <Button type="submit" className="justify-self-start" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit inquiry"}
      </Button>
    </form>
  );
}

