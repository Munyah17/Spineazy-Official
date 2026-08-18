"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  user_id: string;
  subject: string;
  status: "open" | "pending" | "closed";
};

export function AdminSupportThreadClient({ ticketId }: { ticketId: string }) {
  const supabase = createClient();
  const { profile } = useSession();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase.from("support_tickets").select("id, user_id, subject, status").eq("id", ticketId).single(),
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !profile) return;
    setSending(true);

    const { error } = await supabase
      .from("support_messages")
      .insert({ ticket_id: ticketId, sender_id: profile.id, is_admin_reply: true, body: body.trim() });
    setSending(false);
    if (error) {
      toast.error("Couldn't send reply", { description: error.message });
      return;
    }
    setBody("");
    await load();
  }

  async function closeTicket() {
    const { error } = await supabase.from("support_tickets").update({ status: "closed" }).eq("id", ticketId);
    if (error) {
      toast.error("Couldn't close ticket", { description: error.message });
      return;
    }
    toast.success("Ticket closed");
    setTicket((t) => (t ? { ...t, status: "closed" } : t));
  }

  if (loading) return <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</p>;
  if (!ticket) return <p className="px-4 py-8 text-center text-sm text-muted-foreground">Ticket not found.</p>;

  return (
    <div className="mx-auto flex h-[calc(100svh-4.5rem)] w-full max-w-2xl flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/admin/support" className="text-muted-foreground hover:text-foreground" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{ticket.subject}</p>
        {ticket.status !== "closed" && (
          <Button size="sm" variant="outline" onClick={closeTicket}>
            <X className="size-3.5" /> Close
          </Button>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-end gap-2 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.is_admin_reply ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                m.is_admin_reply ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              )}
            >
              {m.body}
            </div>
          </div>
        ))}
      </div>

      {ticket.status !== "closed" ? (
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-3">
          <Input placeholder="Reply…" value={body} onChange={(e) => setBody(e.target.value)} />
          <Button type="submit" size="icon" disabled={sending} aria-label="Send">
            <Send className="size-4" />
          </Button>
        </form>
      ) : (
        <p className="border-t border-border p-3 text-center text-xs text-muted-foreground">This ticket is closed.</p>
      )}
    </div>
  );
}
