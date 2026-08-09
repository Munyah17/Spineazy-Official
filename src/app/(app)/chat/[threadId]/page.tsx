"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gift, Ticket, Send, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/auth/session-provider";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  sender_id: string;
  kind: "text" | "red_packet" | "voucher";
  body: string | null;
  voucher_id: string | null;
  created_at: string;
  red_packets: { amount: number } | null;
  vouchers: { amount: number; code: string; status: string; recipient_id: string } | null;
};

export default function ChatThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = use(params);
  const { profile, wallet, refreshWallet } = useSession();
  const supabase = createClient();

  const [otherName, setOtherName] = useState("Player");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [giftDialog, setGiftDialog] = useState<"red_packet" | "voucher" | null>(null);
  const [giftAmount, setGiftAmount] = useState("");
  const [giftBusy, setGiftBusy] = useState(false);

  async function loadMessages() {
    const { data } = await supabase
      .from("chat_messages")
      .select("id, sender_id, kind, body, voucher_id, created_at, red_packets(amount), vouchers(amount, code, status, recipient_id)")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    setMessages((data as unknown as ChatMessage[]) ?? []);
  }

  useEffect(() => {
    if (!profile) return;

    (async () => {
      const { data: thread } = await supabase
        .from("chat_threads")
        .select("user_a_id, user_b_id")
        .eq("id", threadId)
        .single();

      if (thread) {
        const otherId = thread.user_a_id === profile.id ? thread.user_b_id : thread.user_a_id;
        const { data: otherProfile } = await supabase.from("profiles").select("full_name").eq("id", otherId).single();
        if (otherProfile) setOtherName(otherProfile.full_name);
      }

      await loadMessages();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, threadId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);

    const { error } = await supabase.rpc("fn_send_chat_message", { p_thread_id: threadId, p_body: body });
    setSending(false);
    if (error) {
      toast.error("Message not sent", { description: error.message });
      return;
    }
    setBody("");
    await loadMessages();
  }

  async function handleSendGift() {
    const amount = Number(giftAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setGiftBusy(true);

    const { data: thread } = await supabase.from("chat_threads").select("user_a_id, user_b_id").eq("id", threadId).single();
    const recipientId = thread ? (thread.user_a_id === profile!.id ? thread.user_b_id : thread.user_a_id) : null;
    if (!recipientId) {
      setGiftBusy(false);
      toast.error("Couldn't find the other player");
      return;
    }

    const rpc = giftDialog === "red_packet" ? "fn_send_red_packet" : "fn_issue_voucher";
    const { error } = await supabase.rpc(rpc, {
      p_recipient_id: recipientId,
      p_amount: amount,
      p_thread_id: threadId,
    });
    setGiftBusy(false);

    if (error) {
      if (error.message.includes("insufficient_profit_balance")) {
        toast.error("You can't gift deposited funds", {
          description: "Only your withdrawable winnings can be sent as a Red Packet. Send a voucher instead so they can place bets with it.",
        });
      } else if (error.message.includes("insufficient_deposited_balance")) {
        toast.error("Not enough deposited balance for a voucher of that size");
      } else {
        toast.error("Couldn't send", { description: error.message });
      }
      return;
    }

    toast.success(giftDialog === "red_packet" ? "Red Packet sent!" : "Voucher sent!");
    setGiftDialog(null);
    setGiftAmount("");
    await Promise.all([loadMessages(), refreshWallet()]);
  }

  async function handleRedeem(voucherId: string) {
    const { error } = await supabase.rpc("fn_redeem_voucher", { p_voucher_id: voucherId });
    if (error) {
      toast.error("Couldn't redeem voucher", { description: error.message });
      return;
    }
    toast.success("Voucher redeemed — added to your bet-only balance");
    await Promise.all([loadMessages(), refreshWallet()]);
  }

  if (!profile) return null;

  return (
    <div className="mx-auto flex h-[calc(100svh-8rem)] w-full max-w-lg flex-col lg:h-[calc(100svh-4.5rem)]">
      <div className="flex items-center gap-3 border-b border-border px-3 py-3">
        <Link href="/chat" className="text-muted-foreground hover:text-foreground" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <p className="text-sm font-semibold text-foreground">{otherName}</p>
        <span className="ml-auto text-xs text-muted-foreground">
          Withdrawable {formatMoney(wallet?.profit_balance ?? 0)}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-2 overflow-y-auto px-3 py-4">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">Say hello 👋</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === profile.id;
            if (m.kind === "text") {
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                      mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {m.body}
                  </div>
                </div>
              );
            }
            if (m.kind === "red_packet" && m.red_packets) {
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-boost/25 to-boost/5 px-4 py-2.5 text-sm ring-1 ring-boost/30">
                    <Gift className="size-4 text-boost" />
                    <span className="font-semibold text-foreground">
                      {mine ? "You sent" : "Received"} a Red Packet · {formatMoney(m.red_packets.amount)}
                    </span>
                  </div>
                </div>
              );
            }
            if (m.kind === "voucher" && m.vouchers) {
              const canRedeem = !mine && m.vouchers.recipient_id === profile.id && m.vouchers.status === "issued";
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className="flex flex-col gap-1.5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 px-4 py-2.5 text-sm ring-1 ring-primary/30">
                    <span className="flex items-center gap-2 font-semibold text-foreground">
                      <Ticket className="size-4 text-primary" />
                      Voucher · {formatMoney(m.vouchers.amount)}
                    </span>
                    <span className="text-xs text-muted-foreground">Bets only, not withdrawable · {m.vouchers.code}</span>
                    {canRedeem && (
                      <Button size="sm" className="mt-1 w-fit" onClick={() => handleRedeem(m.voucher_id!)}>
                        <Check className="size-3.5" /> Redeem
                      </Button>
                    )}
                    {m.vouchers.status === "redeemed" && (
                      <span className="text-xs font-medium text-win">Redeemed</span>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border p-3">
        <Button type="button" variant="ghost" size="icon" aria-label="Send Red Packet" onClick={() => setGiftDialog("red_packet")}>
          <Gift className="size-5 text-boost" />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Send Voucher" onClick={() => setGiftDialog("voucher")}>
          <Ticket className="size-5 text-primary" />
        </Button>
        <form onSubmit={handleSend} className="flex flex-1 items-center gap-2">
          <Input placeholder="Message…" value={body} onChange={(e) => setBody(e.target.value)} />
          <Button type="submit" size="icon" disabled={sending} aria-label="Send">
            <Send className="size-4" />
          </Button>
        </form>
      </div>

      <Dialog open={giftDialog !== null} onOpenChange={(open) => !open && setGiftDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{giftDialog === "red_packet" ? "Send a Red Packet" : "Send a Voucher"}</DialogTitle>
            <DialogDescription>
              {giftDialog === "red_packet"
                ? `From your withdrawable winnings (${formatMoney(wallet?.profit_balance ?? 0)} available). Recipient can withdraw it.`
                : `From your deposited balance (${formatMoney(wallet?.deposited_balance ?? 0)} available). Recipient can only use it to place bets.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="giftAmount">Amount</Label>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="giftAmount"
                type="number"
                min={1}
                step="0.01"
                className="pl-6"
                value={giftAmount}
                onChange={(e) => setGiftAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSendGift} disabled={giftBusy} className="w-full">
              {giftBusy ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
