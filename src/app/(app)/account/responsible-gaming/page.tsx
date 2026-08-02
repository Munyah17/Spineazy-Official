import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ResponsibleGamingPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-3 py-4 lg:px-0 lg:py-6">
      <div className="flex items-center gap-3">
        <Link href="/account" className="text-muted-foreground hover:text-foreground" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Responsible Gaming</h1>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            Spineazy is committed to safer play. Gambling should always be entertainment, never a way to make
            money or escape problems.
          </p>
          <p>
            If you feel your play is becoming a problem, contact our support team to set deposit limits, take a
            cooling-off break, or self-exclude from your account entirely.
          </p>
          <p>You must be 18 years or older to hold an account and play on Spineazy.</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p className="font-semibold text-foreground">Need help?</p>
          <p className="text-muted-foreground">
            Email <span className="text-foreground">support@spineazy.com</span> to request a deposit limit,
            time-out, or self-exclusion.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
