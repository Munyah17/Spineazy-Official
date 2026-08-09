"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/auth/session-provider";
import { initials } from "@/lib/format";

type ThreadRow = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  last_message_at: string;
};

type UserResult = { id: string; full_name: string; avatar_url: string | null };

export default function ChatPage() {
  const { profile } = useSession();
  const supabase = createClient();
  const router = useRouter();
  const [threads, setThreads] = useState<(ThreadRow & { otherName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    (async () => {
      const { data: rows } = await supabase
        .from("chat_threads")
        .select("id, user_a_id, user_b_id, last_message_at")
        .order("last_message_at", { ascending: false });

      if (!rows || rows.length === 0) {
        setThreads([]);
        setLoading(false);
        return;
      }

      const otherIds = rows.map((r) => (r.user_a_id === profile.id ? r.user_b_id : r.user_a_id));
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", otherIds);
      const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

      setThreads(
        rows.map((r) => ({
          ...r,
          otherName: nameById.get(r.user_a_id === profile.id ? r.user_b_id : r.user_a_id) ?? "Player",
        }))
      );
      setLoading(false);
    })();
  }, [profile, supabase]);

  useEffect(() => {
    const trimmed = query.trim();
    const timer = setTimeout(async () => {
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }

      setSearching(true);

      const { data } = await supabase.rpc("fn_search_users", { p_query: query.trim(), p_limit: 8 });
      setResults((data as unknown as UserResult[]) ?? []);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, supabase]);

  async function startChat(otherUserId: string) {
    setStarting(otherUserId);

    const { data: threadId, error } = await supabase.rpc("fn_get_or_create_thread", {
      p_other_user_id: otherUserId,
    });
    setStarting(null);

    if (error || !threadId) {
      toast.error("Couldn't start chat", { description: error?.message });
      return;
    }

    router.push(`/chat/${threadId}`);
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Sign in to use Chat &amp; Pay.</p>
        <Button asChild>
          <Link href="/sign-in?next=/chat">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-3 py-4 lg:px-0 lg:py-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Chat &amp; Pay</h1>
        <p className="text-sm text-muted-foreground">
          Send a message, gift winnings with a Red Packet, or send a voucher for bets only.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="userSearch">Find a player</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="userSearch"
            placeholder="Search by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {query.trim().length >= 2 && (
          <div className="mt-1 flex flex-col gap-1">
            {searching ? (
              <p className="px-1 py-2 text-xs text-muted-foreground">Searching…</p>
            ) : results.length > 0 ? (
              results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={starting !== null}
                  onClick={() => startChat(u.id)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-accent disabled:opacity-60"
                >
                  <Avatar size="sm">
                    <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                      {initials(u.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{u.full_name}</span>
                </button>
              ))
            ) : (
              <p className="px-1 py-2 text-xs text-muted-foreground">No players found.</p>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : threads.length > 0 ? (
        <div className="flex flex-col gap-2">
          {threads.map((t) => (
            <Link key={t.id} href={`/chat/${t.id}`}>
              <Card size="sm" className="flex-row items-center gap-3 px-4 transition-colors hover:bg-accent">
                <Avatar>
                  <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                    {initials(t.otherName)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-semibold text-foreground">{t.otherName}</span>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
          <MessageCircle className="size-4 shrink-0" />
          No conversations yet. Search for a player above to start one.
        </p>
      )}
    </div>
  );
}
