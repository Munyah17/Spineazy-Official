"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { USE_MOCK_DATA } from "@/lib/mock/flag";

export function ClaimButton({
  promotionId,
  amount,
  wageringRequired,
  claimed,
  signedIn,
}: {
  promotionId: string;
  amount: number;
  wageringRequired: number;
  claimed: boolean;
  signedIn: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isClaimed, setIsClaimed] = useState(claimed);

  async function handleClaim() {
    if (!signedIn) {
      router.push("/sign-in?next=/promotions");
      return;
    }

    if (USE_MOCK_DATA) {
      // MOCK: remove this branch once real user_bonuses inserts are live.
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 400));
      setLoading(false);
      setIsClaimed(true);
      toast.success("Bonus claimed!");
      return;
    }

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      router.push("/sign-in?next=/promotions");
      return;
    }

    const { error } = await supabase.from("user_bonuses").insert({
      user_id: user.id,
      promotion_id: promotionId,
      amount,
      wagering_required: wageringRequired,
    });
    setLoading(false);

    if (error) {
      toast.error("Couldn't claim this bonus", { description: error.message });
      return;
    }

    setIsClaimed(true);
    toast.success("Bonus claimed!");
    router.refresh();
  }

  return (
    <Button size="sm" disabled={loading || isClaimed} onClick={handleClaim} variant={isClaimed ? "secondary" : "default"}>
      {isClaimed ? "Claimed" : loading ? "Claiming…" : "Claim Now"}
    </Button>
  );
}
