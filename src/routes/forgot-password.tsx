import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset your password — NewsPilot AI" },
      { name: "description", content: "Request a password reset link for NewsPilot AI." },
      { property: "og:title", content: "Reset your password — NewsPilot AI" },
      { property: "og:description", content: "Request a password reset link for NewsPilot AI." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="font-headline text-2xl text-foreground">Forgot your password?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll email you a link to choose a new one.
        </p>
        {sent ? (
          <p className="mt-6 rounded-md border border-border bg-muted p-4 text-sm text-foreground">
            If an account exists for {email}, a reset link is on its way.
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <p className="mt-5 text-center text-sm">
          <Link to="/auth" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
