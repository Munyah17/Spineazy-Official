import { Gift, PiggyBank, Ticket, TrendingUp, Percent } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { Card, CardContent } from "@/components/ui/card";
import { ClaimButton } from "@/components/promotions/claim-button";
import { formatMoney } from "@/lib/format";
import type { Database } from "@/types/database";

type PromoType = Database["public"]["Enums"]["promo_type"];

const TYPE_META: Record<PromoType, { label: string; icon: typeof Gift }> = {
  welcome_bonus: { label: "Welcome Bonus", icon: Gift },
  deposit_bonus: { label: "Deposit Bonus", icon: PiggyBank },
  free_bet: { label: "Free Bet", icon: Ticket },
  odds_boost: { label: "Odds Boost", icon: TrendingUp },
  cashback: { label: "Cashback", icon: Percent },
};

export default async function PromotionsPage() {
  const publicClient = createPublicClient();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = Boolean(user);

  const [{ data: promoData }, claimedRes] = await Promise.all([
    publicClient.from("promotions").select("*").eq("active", true).order("starts_at", { ascending: false }),
    user
      ? supabase.from("user_bonuses").select("promotion_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { promotion_id: string | null }[] }),
  ]);
  const promotions = promoData ?? [];
  const claimedIds = new Set((claimedRes.data ?? []).map((b) => b.promotion_id));

  return (
    <div className="flex flex-col gap-5 px-3 py-4 lg:px-6 lg:py-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Promotions</h1>
        <p className="text-sm text-muted-foreground">Bonuses, cashback and boosts across casino and sportsbook.</p>
      </div>

      {promotions && promotions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promo) => {
            const meta = TYPE_META[promo.type];
            return (
              <Card key={promo.id} className="overflow-hidden">
                <div className="flex h-28 items-center justify-center bg-gradient-to-br from-primary/30 via-primary/10 to-transparent">
                  <meta.icon className="size-10 text-primary" />
                </div>
                <CardContent className="flex flex-col gap-2">
                  <span className="w-fit rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                    {meta.label}
                  </span>
                  <h3 className="text-base font-bold text-foreground">{promo.title}</h3>
                  {promo.description && <p className="text-sm text-muted-foreground">{promo.description}</p>}
                  <div className="mt-1 flex items-center justify-between">
                    {promo.value != null && (
                      <span className="text-sm font-semibold text-win">
                        {promo.type === "cashback" || promo.type === "odds_boost"
                          ? `${promo.value}%`
                          : formatMoney(promo.value)}
                      </span>
                    )}
                    <ClaimButton
                      promotionId={promo.id}
                      amount={promo.value ?? 0}
                      wageringRequired={promo.wagering_requirement ?? 0}
                      claimed={claimedIds.has(promo.id)}
                      signedIn={signedIn}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
          No active promotions right now — check back soon.
        </p>
      )}
    </div>
  );
}
