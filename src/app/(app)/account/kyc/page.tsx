"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/auth/session-provider";
import { cn } from "@/lib/utils";

type DocType = "id_front" | "id_back" | "proof_of_address" | "selfie";

const DOC_TYPES: { type: DocType; label: string; hint: string }[] = [
  { type: "id_front", label: "ID / Passport (front)", hint: "Clear photo of the front" },
  { type: "id_back", label: "ID (back)", hint: "Clear photo of the back" },
  { type: "proof_of_address", label: "Proof of Address", hint: "Utility bill or bank statement, last 3 months" },
  { type: "selfie", label: "Selfie", hint: "A clear photo of your face" },
];

type DocRow = { doc_type: DocType; status: "pending" | "approved" | "rejected" };

const STATUS_ICON: Record<DocRow["status"], React.ReactNode> = {
  pending: <Clock className="size-4 text-boost" />,
  approved: <CheckCircle2 className="size-4 text-win" />,
  rejected: <XCircle className="size-4 text-destructive" />,
};

export default function KycPage() {
  const { profile } = useSession();
  const supabase = createClient();
  const [docs, setDocs] = useState<Record<DocType, DocRow["status"] | null>>({
    id_front: null,
    id_back: null,
    proof_of_address: null,
    selfie: null,
  });
  const [uploading, setUploading] = useState<DocType | null>(null);
  const fileInputs = useRef<Record<DocType, HTMLInputElement | null>>({} as Record<DocType, HTMLInputElement | null>);

  async function load() {
    if (!profile) return;
    const { data } = await supabase
      .from("kyc_documents")
      .select("doc_type, status")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: true });
    const next: Record<DocType, DocRow["status"] | null> = { id_front: null, id_back: null, proof_of_address: null, selfie: null };
    for (const row of (data as unknown as DocRow[]) ?? []) next[row.doc_type] = row.status;
    setDocs(next);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function handleUpload(docType: DocType, file: File) {
    if (!profile) return;
    setUploading(docType);

    const path = `${profile.id}/${docType}-${Date.now()}.${file.name.split(".").pop() ?? "jpg"}`;
    const { error: uploadError } = await supabase.storage.from("kyc-documents").upload(path, file);
    if (uploadError) {
      setUploading(null);
      toast.error("Upload failed", { description: uploadError.message });
      return;
    }

    const { error } = await supabase.from("kyc_documents").insert({ user_id: profile.id, doc_type: docType, storage_path: path });
    setUploading(null);
    if (error) {
      toast.error("Couldn't save document", { description: error.message });
      return;
    }

    toast.success("Document submitted for review");
    await load();
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Sign in to verify your identity.</p>
        <Button asChild>
          <Link href="/sign-in?next=/account/kyc">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-3 py-4 lg:px-0 lg:py-6">
      <div className="flex items-center gap-3">
        <Link href="/account" className="text-muted-foreground hover:text-foreground" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Verify Identity</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Upload the documents below to verify your account. This helps us keep withdrawals fast and your account secure.
      </p>

      <div className="flex flex-col gap-3">
        {DOC_TYPES.map((d) => {
          const status = docs[d.type];
          return (
            <Card key={d.type}>
              <CardContent className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{d.label}</p>
                  <p className="text-xs text-muted-foreground">{d.hint}</p>
                </div>
                {status && status !== "rejected" ? (
                  <span className={cn("flex items-center gap-1.5 text-xs font-medium capitalize")}>
                    {STATUS_ICON[status]}
                    {status}
                  </span>
                ) : (
                  <>
                    {status === "rejected" && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                        {STATUS_ICON.rejected} Rejected
                      </span>
                    )}
                    <input
                      ref={(el) => {
                        fileInputs.current[d.type] = el;
                      }}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(d.type, file);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={uploading === d.type}
                      onClick={() => fileInputs.current[d.type]?.click()}
                    >
                      <Upload className="size-3.5" />
                      {uploading === d.type ? "Uploading…" : status === "rejected" ? "Re-upload" : "Upload"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
