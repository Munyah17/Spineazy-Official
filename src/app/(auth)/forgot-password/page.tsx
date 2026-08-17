"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: allowed } = await supabase.rpc("fn_check_rate_limit", {
      p_key: `reset:${email.trim().toLowerCase()}`,
      p_max_attempts: 5,
      p_window_seconds: 900,
    });
    if (allowed === false) {
      setLoading(false);
      toast.error("Too many attempts", { description: "Please wait a while and try again." });
      return;
    }

    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    // Always show success, regardless of whether the email exists -- avoids
    // leaking which emails are registered.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <MailCheck className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-bold">Check your email</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            If an account exists for {email}, we&apos;ve sent a link to reset your password.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/sign-in">Back to Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-xl font-bold">Forgot Password?</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending…" : "Send Reset Link"}
        </Button>
      </form>

      <Link href="/sign-in" className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary">
        <ArrowLeft className="size-4" />
        Back to Sign In
      </Link>
    </div>
  );
}
