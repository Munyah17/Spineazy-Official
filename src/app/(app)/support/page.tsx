"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LifeBuoy, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

type TicketRow = {
  id: string;
  subject: string;
  status: "open" | "pending" | "closed";
  updated_at: string;
};

const STATUS_STYLE: Record<TicketRow["status"], string> = {
  open: "bg-destructive/15 text-destructive",
  pending: "bg-boost/15 text-boost",
  closed: "bg-muted text-muted-foreground",
};

export default function SupportPage() {
  const { profile } = useSession();
  const supabase = createClient();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!profile) return;
    const { data } = await supabase
      .from("support_tickets")
      .select("id, subject, status, updated_at")
      .order("updated_at", { ascending: false });
    setTickets((data as unknown as TicketRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function handleCreate() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Enter a subject and message");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("fn_open_support_ticket", { p_subject: subject.trim(), p_body: body.trim() });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't open ticket", { description: error.message });
      return;
    }
    toast.success("Ticket sent to support");
    setOpen(false);
    setSubject("");
    setBody("");
    await load();
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Sign in to contact support.</p>
        <Button asChild>
          <Link href="/sign-in?next=/support">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-3 py-4 lg:px-0 lg:py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Support</h1>
          <p className="text-sm text-muted-foreground">Get help from the Spineazy team.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New Ticket
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : tickets.length > 0 ? (
        <div className="flex flex-col gap-2">
          {tickets.map((t) => (
            <Link key={t.id} href={`/support/${t.id}`}>
              <Card size="sm" className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-foreground">{t.subject}</span>
                  <Badge className={cn("shrink-0 border-0 capitalize", STATUS_STYLE[t.status])}>{t.status}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
          <LifeBuoy className="size-4 shrink-0" />
          No support tickets yet. Open one if you need help.
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Support Ticket</DialogTitle>
            <DialogDescription>Tell us what&apos;s going on — we&apos;ll get back to you here.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Deposit not reflecting" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="body">Message</Label>
              <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Describe the issue…" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={submitting} className="w-full">
              {submitting ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
