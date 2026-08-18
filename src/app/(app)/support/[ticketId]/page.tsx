"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/auth/session-provider";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  sender_id: string;
  is_admin_reply: boolean;
  body: string;
  created_at: string;
};

type Ticket = {
  id: string;
  subject: string;
  status: "open" | "pending" | "closed";
};

const STATUS_STYLE: Record<Ticket["status"], string> = {
  open: "bg-destructive/15 text-destructive",
  pending: "bg-boost/15 text-boost",
  closed: "bg-muted text-muted-foreground",
};

export default function SupportTicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = use(params);
  const { profile } = useSession();
  const supabase = createClient();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase.from("support_tickets").select("id, subject, status").eq("id", ticketId).single(),
      supabase
        .from("support_messages")
        .select("id, sender_id, is_admin_reply, body, created_at")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true }),
    ]);
    setTicket(t ?? null);
    setMessages(m ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!profile) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, ticketId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !profile) return;
    setSending(true);

    const { error } = await supabase
      .from("support_messages")
      .insert({ ticket_id: ticketId, sender_id: profile.id, is_admin_reply: false, body: body.trim() });
    setSending(false);
    if (error) {
      toast.error("Couldn't send message", { description: error.message });
      return;
    }
    setBody("");
    await load();
  }

  if (!profile) return null;
  if (loading) return <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</p>;
  if (!ticket) return <p className="px-4 py-8 text-center text-sm text-muted-foreground">Ticket not found.</p>;

  return (
    <div className="mx-auto flex h-[calc(100svh-8rem)] w-full max-w-lg flex-col lg:h-[calc(100svh-4.5rem)]">
      <div className="flex items-center gap-3 border-b border-border px-3 py-3">
        <Link href="/support" className="text-muted-foreground hover:text-foreground" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{ticket.subject}</p>
        <Badge className={cn("shrink-0 border-0 capitalize", STATUS_STYLE[ticket.status])}>{ticket.status}</Badge>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-2 overflow-y-auto px-3 py-4">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", !m.is_admin_reply ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                !m.is_admin_reply ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              )}
            >
              {m.body}
            </div>
          </div>
        ))}
      </div>

      {ticket.status !== "closed" ? (
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-3">
          <Input placeholder="Message…" value={body} onChange={(e) => setBody(e.target.value)} />
          <Button type="submit" size="icon" disabled={sending} aria-label="Send">
            <Send className="size-4" />
          </Button>
        </form>
      ) : (
        <p className="border-t border-border p-3 text-center text-xs text-muted-foreground">
          This ticket is closed. Open a new one if you need further help.
        </p>
      )}
    </div>
  );
}
