"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { USE_MOCK_DATA } from "@/lib/mock/flag";
import { useMockStore } from "@/lib/mock/store";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Wallet = Database["public"]["Tables"]["wallets"]["Row"];

type SessionContextValue = {
  userId: string | null;
  profile: Profile | null;
  wallet: Wallet | null;
  loading: boolean;
  refreshWallet: () => Promise<void>;
  signOut: () => Promise<void>;
  mockSignIn: () => void;
};

const SessionContext = createContext<SessionContextValue>({
  userId: null,
  profile: null,
  wallet: null,
  loading: true,
  refreshWallet: async () => {},
  signOut: async () => {},
  mockSignIn: () => {},
});

export function SessionProvider({
  children,
  initialProfile,
  initialWallet,
}: {
  children: React.ReactNode;
  initialProfile: Profile | null;
  initialWallet: Wallet | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [wallet, setWallet] = useState<Wallet | null>(initialWallet);
  const [loading, setLoading] = useState(false);
  // MOCK: remove this + the USE_MOCK_DATA branches below once real auth/wallet queries are live.
  const mockWallet = useMockStore((s) => s.wallet);
  const mockSignedIn = useMockStore((s) => s.signedIn);
  const setMockSignedIn = useMockStore((s) => s.setSignedIn);
  const effectiveProfile = USE_MOCK_DATA ? (mockSignedIn ? initialProfile : null) : profile;
  const effectiveWallet = USE_MOCK_DATA ? (mockSignedIn ? mockWallet : null) : wallet;

  const refreshWallet = async () => {
    if (USE_MOCK_DATA) return; // mock store updates reactively, nothing to refresh
    if (!profile) return;
    const { data } = await supabase.from("wallets").select("*").eq("user_id", profile.id).single();
    if (data) setWallet(data);
  };

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!profile) return;

    const channel = supabase
      .channel(`wallet-${profile.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${profile.id}` },
        (payload) => setWallet(payload.new as Wallet)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, supabase]);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setWallet(null);
        router.refresh();
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const signOut = async () => {
    if (USE_MOCK_DATA) {
      setMockSignedIn(false);
      router.push("/");
      return;
    }
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    router.push("/");
    router.refresh();
  };

  const mockSignIn = () => {
    if (!USE_MOCK_DATA) return;
    setMockSignedIn(true);
  };

  return (
    <SessionContext.Provider
      value={{
        userId: effectiveProfile?.id ?? null,
        profile: effectiveProfile,
        wallet: effectiveWallet,
        loading,
        refreshWallet,
        signOut,
        mockSignIn,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
