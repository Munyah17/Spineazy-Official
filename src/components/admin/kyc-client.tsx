"use client";

import { useEffect, useState } from "react";
import { FileCheck, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type DocRow = {
  id: string;
  user_id: string;
  full_name: string;
  doc_type: "id_front" | "id_back" | "proof_of_address" | "selfie";
  storage_path: string;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  created_at: string;
};

const DOC_LABEL: Record<DocRow["doc_type"], string> = {
  id_front: "ID (front)",
  id_back: "ID (back)",
  proof_of_address: "Proof of address",
  selfie: "Selfie",
};

const FILTERS: { label: string; value: DocRow["status"] }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export function AdminKycClient() {
  const supabase = createClient();
  const [filter, setFilter] = useState<DocRow["status"]>("pending");
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const { data } = await supabase.rpc("fn_get_kyc_queue", { p_status: filter, p_limit: 100 });
      const rows = (data as unknown as DocRow[]) ?? [];
      setDocs(rows);
      setLoading(false);

      const entries = await Promise.all(
        rows.map(async (d) => {
          const { data: signed } = await supabase.storage.from("kyc-documents").createSignedUrl(d.storage_path, 300);
          return [d.id, signed?.signedUrl ?? ""] as const;
        })
      );
      setPreviews(Object.fromEntries(entries));
    })();
  }, [supabase, filter]);

  async function review(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    const { error } = await supabase.rpc("fn_review_kyc_document", { p_document_id: id, p_status: status });
    if (!error) {
      await supabase.rpc("fn_log_admin_action", {
        p_action: "kyc_document_reviewed",
        p_target_type: "kyc_document",
        p_target_id: id,
        p_meta: { status },
      });
    }
    setBusyId(null);
    if (error) {
      toast.error("Couldn't review document", { description: error.message });
      return;
    }
    toast.success(status === "approved" ? "Document approved" : "Document rejected");
    setDocs((d) => d.filter((doc) => doc.id !== id));
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
      <div className="flex items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              filter === f.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : docs.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex flex-col gap-2">
                {previews[d.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[d.id]} alt={DOC_LABEL[d.doc_type]} className="aspect-video w-full rounded-lg object-cover" />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                    Preview unavailable
                  </div>
                )}
                <p className="text-sm font-semibold text-foreground">{d.full_name}</p>
                <p className="text-xs text-muted-foreground">{DOC_LABEL[d.doc_type]}</p>
                {d.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" disabled={busyId === d.id} onClick={() => review(d.id, "approved")} className="flex-1">
                      <Check className="size-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" disabled={busyId === d.id} onClick={() => review(d.id, "rejected")} className="flex-1 text-destructive hover:text-destructive">
                      <X className="size-3.5" /> Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
          <FileCheck className="size-4 shrink-0" />
          No documents in this view.
        </p>
      )}
    </div>
  );
}
