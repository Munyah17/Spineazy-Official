export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          deposit_id: string | null
          id: string
          rate: number
          referred_user_id: string
          status: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          deposit_id?: string | null
          id?: string
          rate: number
          referred_user_id: string
          status?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          deposit_id?: string | null
          id?: string
          rate?: number
          referred_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_deposit_id_fkey"
            columns: ["deposit_id"]
            isOneToOne: false
            referencedRelation: "deposits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          accent: Database["public"]["Enums"]["banner_accent"]
          active: boolean
          created_at: string
          created_by: string | null
          cta_href: string | null
          cta_label: string | null
          description: string | null
          display_order: number
          ends_at: string | null
          eyebrow: string | null
          id: string
          image_url: string | null
          kind: Database["public"]["Enums"]["banner_kind"]
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          accent?: Database["public"]["Enums"]["banner_accent"]
          active?: boolean
          created_at?: string
          created_by?: string | null
          cta_href?: string | null
          cta_label?: string | null
          description?: string | null
          display_order?: number
          ends_at?: string | null
          eyebrow?: string | null
          id?: string
          image_url?: string | null
          kind: Database["public"]["Enums"]["banner_kind"]
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          accent?: Database["public"]["Enums"]["banner_accent"]
          active?: boolean
          created_at?: string
          created_by?: string | null
          cta_href?: string | null
          cta_label?: string | null
          description?: string | null
          display_order?: number
          ends_at?: string | null
          eyebrow?: string | null
          id?: string
          image_url?: string | null
          kind?: Database["public"]["Enums"]["banner_kind"]
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bet_selections: {
        Row: {
          bet_id: string
          fixture_id: string
          fixture_label: string
          id: string
          market_id: string
          market_name: string
          odds_price: number
          outcome_id: string
          selection_name: string
          settled_at: string | null
          status: Database["public"]["Enums"]["selection_status"]
        }
        Insert: {
          bet_id: string
          fixture_id: string
          fixture_label: string
          id?: string
          market_id: string
          market_name: string
          odds_price: number
          outcome_id: string
          selection_name: string
          settled_at?: string | null
          status?: Database["public"]["Enums"]["selection_status"]
        }
        Update: {
          bet_id?: string
          fixture_id?: string
          fixture_label?: string
          id?: string
          market_id?: string
          market_name?: string
          odds_price?: number
          outcome_id?: string
          selection_name?: string
          settled_at?: string | null
          status?: Database["public"]["Enums"]["selection_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bet_selections_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_selections_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_selections_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_selections_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "odds_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      bets: {
        Row: {
          base_total_odds: number
          bet_type: Database["public"]["Enums"]["bet_type"]
          cash_out_value: number | null
          cashed_out_at: string | null
          id: string
          is_free_bet: boolean
          placed_at: string
          placement_group_id: string
          potential_payout: number
          settled_at: string | null
          stake: number
          status: Database["public"]["Enums"]["bet_status"]
          system_size: number | null
          total_odds: number
          user_id: string
          wallet_id: string
          winboost_enabled: boolean
          winboost_pct: number
        }
        Insert: {
          base_total_odds: number
          bet_type: Database["public"]["Enums"]["bet_type"]
          cash_out_value?: number | null
          cashed_out_at?: string | null
          id?: string
          is_free_bet?: boolean
          placed_at?: string
          placement_group_id?: string
          potential_payout: number
          settled_at?: string | null
          stake: number
          status?: Database["public"]["Enums"]["bet_status"]
          system_size?: number | null
          total_odds: number
          user_id: string
          wallet_id: string
          winboost_enabled?: boolean
          winboost_pct?: number
        }
        Update: {
          base_total_odds?: number
          bet_type?: Database["public"]["Enums"]["bet_type"]
          cash_out_value?: number | null
          cashed_out_at?: string | null
          id?: string
          is_free_bet?: boolean
          placed_at?: string
          placement_group_id?: string
          potential_payout?: number
          settled_at?: string | null
          stake?: number
          status?: Database["public"]["Enums"]["bet_status"]
          system_size?: number | null
          total_odds?: number
          user_id?: string
          wallet_id?: string
          winboost_enabled?: boolean
          winboost_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "bets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      booked_bets: {
        Row: {
          bet_code: string
          bet_type: Database["public"]["Enums"]["bet_type"]
          created_at: string
          expires_at: string
          id: string
          load_count: number
          loaded_at: string | null
          selections: Json
          status: Database["public"]["Enums"]["booked_bet_status"]
          total_odds: number
          user_id: string | null
        }
        Insert: {
          bet_code: string
          bet_type: Database["public"]["Enums"]["bet_type"]
          created_at?: string
          expires_at: string
          id?: string
          load_count?: number
          loaded_at?: string | null
          selections: Json
          status?: Database["public"]["Enums"]["booked_bet_status"]
          total_odds: number
          user_id?: string | null
        }
        Update: {
          bet_code?: string
          bet_type?: Database["public"]["Enums"]["bet_type"]
          created_at?: string
          expires_at?: string
          id?: string
          load_count?: number
          loaded_at?: string | null
          selections?: Json
          status?: Database["public"]["Enums"]["booked_bet_status"]
          total_odds?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booked_bets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      casino_demo_dice_rounds: {
        Row: {
          bet_amount: number
          client_seed: string
          created_at: string
          direction: string
          id: string
          multiplier: number
          nonce: number
          payout: number
          roll: number
          server_seed_hash: string
          session_id: string
          status: string
          target: number
          user_id: string
        }
        Insert: {
          bet_amount: number
          client_seed: string
          created_at?: string
          direction: string
          id?: string
          multiplier: number
          nonce: number
          payout?: number
          roll: number
          server_seed_hash: string
          session_id: string
          status: string
          target: number
          user_id: string
        }
        Update: {
          bet_amount?: number
          client_seed?: string
          created_at?: string
          direction?: string
          id?: string
          multiplier?: number
          nonce?: number
          payout?: number
          roll?: number
          server_seed_hash?: string
          session_id?: string
          status?: string
          target?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "casino_demo_dice_rounds_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "casino_demo_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casino_demo_dice_rounds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      casino_demo_seed_reveals: {
        Row: {
          client_seed: string
          id: string
          revealed_at: string
          rounds_used: number
          server_seed: string
          server_seed_hash: string
          session_id: string
          user_id: string
        }
        Insert: {
          client_seed: string
          id?: string
          revealed_at?: string
          rounds_used: number
          server_seed: string
          server_seed_hash: string
          session_id: string
          user_id: string
        }
        Update: {
          client_seed?: string
          id?: string
          revealed_at?: string
          rounds_used?: number
          server_seed?: string
          server_seed_hash?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "casino_demo_seed_reveals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "casino_demo_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casino_demo_seed_reveals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      casino_demo_crash_rounds: {
        Row: {
          cashed_out_at: number | null
          crash_point: number
          created_at: string
          id: string
          payout: number
          resolved_at: string | null
          session_id: string
          stake: number
          status: string
          user_id: string
        }
        Insert: {
          cashed_out_at?: number | null
          crash_point: number
          created_at?: string
          id?: string
          payout?: number
          resolved_at?: string | null
          session_id: string
          stake: number
          status?: string
          user_id: string
        }
        Update: {
          cashed_out_at?: number | null
          crash_point?: number
          created_at?: string
          id?: string
          payout?: number
          resolved_at?: string | null
          session_id?: string
          stake?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "casino_demo_crash_rounds_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "casino_demo_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casino_demo_crash_rounds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      casino_demo_sessions: {
        Row: {
          client_seed: string | null
          created_at: string
          demo_balance: number
          game_key: string
          id: string
          nonce: number
          server_seed: string | null
          server_seed_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_seed?: string | null
          created_at?: string
          demo_balance?: number
          game_key: string
          id?: string
          nonce?: number
          server_seed?: string | null
          server_seed_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_seed?: string | null
          created_at?: string
          demo_balance?: number
          game_key?: string
          id?: string
          nonce?: number
          server_seed?: string | null
          server_seed_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "casino_demo_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      casino_games: {
        Row: {
          active: boolean
          category: string | null
          demo_available: boolean
          display_order: number
          game_key: string
          id: string
          provider: string
          rtp: number | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          demo_available?: boolean
          display_order?: number
          game_key: string
          id?: string
          provider?: string
          rtp?: number | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          active?: boolean
          category?: string | null
          demo_available?: boolean
          display_order?: number
          game_key?: string
          id?: string
          provider?: string
          rtp?: number | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      casino_sessions: {
        Row: {
          balance_snapshot: number | null
          ended_at: string | null
          game_id: string
          id: string
          mode: Database["public"]["Enums"]["casino_mode"]
          session_token: string
          started_at: string
          user_id: string
        }
        Insert: {
          balance_snapshot?: number | null
          ended_at?: string | null
          game_id: string
          id?: string
          mode: Database["public"]["Enums"]["casino_mode"]
          session_token: string
          started_at?: string
          user_id: string
        }
        Update: {
          balance_snapshot?: number | null
          ended_at?: string | null
          game_id?: string
          id?: string
          mode?: Database["public"]["Enums"]["casino_mode"]
          session_token?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "casino_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "casino_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casino_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          id: string
          odds_api_key: string
          region: string | null
          sport_group_id: string
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          odds_api_key: string
          region?: string | null
          sport_group_id: string
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          odds_api_key?: string
          region?: string | null
          sport_group_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitions_sport_group_id_fkey"
            columns: ["sport_group_id"]
            isOneToOne: false
            referencedRelation: "sport_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          amount: number
          client_correlator: string | null
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          paynow_poll_url: string | null
          paynow_reference: string | null
          phone_number: string | null
          provider: string
          provider_payload: Json | null
          provider_transaction_id: string | null
          status: Database["public"]["Enums"]["deposit_status"]
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          client_correlator?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          paynow_poll_url?: string | null
          paynow_reference?: string | null
          phone_number?: string | null
          provider?: string
          provider_payload?: Json | null
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          client_correlator?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          paynow_poll_url?: string | null
          paynow_reference?: string | null
          phone_number?: string | null
          provider?: string
          provider_payload?: Json | null
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      fixtures: {
        Row: {
          away_score: number | null
          away_team: string
          commence_time: string
          competition_id: string
          created_at: string
          extra_markets_synced_at: string | null
          home_score: number | null
          home_team: string
          id: string
          is_featured: boolean
          last_synced_at: string | null
          minute: number | null
          odds_api_event_id: string | null
          status: Database["public"]["Enums"]["fixture_status"]
          updated_at: string
        }
        Insert: {
          away_score?: number | null
          away_team: string
          commence_time: string
          competition_id: string
          created_at?: string
          extra_markets_synced_at?: string | null
          home_score?: number | null
          home_team: string
          id?: string
          is_featured?: boolean
          last_synced_at?: string | null
          minute?: number | null
          odds_api_event_id?: string | null
          status?: Database["public"]["Enums"]["fixture_status"]
          updated_at?: string
        }
        Update: {
          away_score?: number | null
          away_team?: string
          commence_time?: string
          competition_id?: string
          created_at?: string
          extra_markets_synced_at?: string | null
          home_score?: number | null
          home_team?: string
          id?: string
          is_featured?: boolean
          last_synced_at?: string | null
          minute?: number | null
          odds_api_event_id?: string | null
          status?: Database["public"]["Enums"]["fixture_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          created_at: string
          display_order: number
          fixture_id: string
          id: string
          market_key: string
          market_name: string
          status: Database["public"]["Enums"]["market_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          fixture_id: string
          id?: string
          market_key: string
          market_name: string
          status?: Database["public"]["Enums"]["market_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          fixture_id?: string
          id?: string
          market_key?: string
          market_name?: string
          status?: Database["public"]["Enums"]["market_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "markets_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          reference_id: string | null
          reference_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      odds_outcomes: {
        Row: {
          bookmaker: string
          display_order: number
          id: string
          market_id: string
          name: string
          point: number | null
          price: number
          updated_at: string
        }
        Insert: {
          bookmaker?: string
          display_order?: number
          id?: string
          market_id: string
          name: string
          point?: number | null
          price: number
          updated_at?: string
        }
        Update: {
          bookmaker?: string
          display_order?: number
          id?: string
          market_id?: string
          name?: string
          point?: number | null
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "odds_outcomes_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          id: string
          last_login_at: string | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          id: string
          last_login_at?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          id?: string
          last_login_at?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          active: boolean
          banner_url: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          min_odds: number | null
          min_selections: number | null
          starts_at: string
          terms: string | null
          title: string
          type: Database["public"]["Enums"]["promo_type"]
          value: number | null
          wagering_requirement: number | null
        }
        Insert: {
          active?: boolean
          banner_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          min_odds?: number | null
          min_selections?: number | null
          starts_at?: string
          terms?: string | null
          title: string
          type: Database["public"]["Enums"]["promo_type"]
          value?: number | null
          wagering_requirement?: number | null
        }
        Update: {
          active?: boolean
          banner_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          min_odds?: number | null
          min_selections?: number | null
          starts_at?: string
          terms?: string | null
          title?: string
          type?: Database["public"]["Enums"]["promo_type"]
          value?: number | null
          wagering_requirement?: number | null
        }
        Relationships: []
      }
      sport_groups: {
        Row: {
          active: boolean
          display_order: number
          icon: string | null
          id: string
          key: string
          name: string
        }
        Insert: {
          active?: boolean
          display_order?: number
          icon?: string | null
          id?: string
          key: string
          name: string
        }
        Update: {
          active?: boolean
          display_order?: number
          icon?: string | null
          id?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      user_bonuses: {
        Row: {
          amount: number
          created_at: string
          expires_at: string | null
          id: string
          promotion_id: string | null
          status: Database["public"]["Enums"]["bonus_status"]
          user_id: string
          wagering_progress: number
          wagering_required: number
        }
        Insert: {
          amount: number
          created_at?: string
          expires_at?: string | null
          id?: string
          promotion_id?: string | null
          status?: Database["public"]["Enums"]["bonus_status"]
          user_id: string
          wagering_progress?: number
          wagering_required?: number
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          promotion_id?: string | null
          status?: Database["public"]["Enums"]["bonus_status"]
          user_id?: string
          wagering_progress?: number
          wagering_required?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_bonuses_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bonuses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["wallet_tx_status"]
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["wallet_tx_status"]
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["wallet_tx_status"]
          type?: Database["public"]["Enums"]["wallet_tx_type"]
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_user_a_id_fkey"
            columns: ["user_a_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_threads_user_b_id_fkey"
            columns: ["user_b_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          red_packet_id: string | null
          sender_id: string
          thread_id: string
          voucher_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          red_packet_id?: string | null
          sender_id: string
          thread_id: string
          voucher_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          red_packet_id?: string | null
          sender_id?: string
          thread_id?: string
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_red_packet_fkey"
            columns: ["red_packet_id"]
            isOneToOne: false
            referencedRelation: "red_packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_voucher_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      red_packets: {
        Row: {
          amount: number
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
          thread_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          recipient_id: string
          sender_id: string
          thread_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "red_packets_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          amount: number
          code: string
          created_at: string
          id: string
          issuer_id: string
          recipient_id: string
          redeemed_at: string | null
          status: string
          thread_id: string | null
        }
        Insert: {
          amount: number
          code: string
          created_at?: string
          id?: string
          issuer_id: string
          recipient_id: string
          redeemed_at?: string | null
          status?: string
          thread_id?: string | null
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          id?: string
          issuer_id?: string
          recipient_id?: string
          redeemed_at?: string | null
          status?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      fund_protection_violations: {
        Row: {
          attempted_amount: number
          available_profit_balance: number
          created_at: string
          deposited_balance_at_attempt: number
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          attempted_amount: number
          available_profit_balance: number
          created_at?: string
          deposited_balance_at_attempt?: number
          id?: string
          kind?: string
          user_id: string
        }
        Update: {
          attempted_amount?: number
          available_profit_balance?: number
          created_at?: string
          deposited_balance_at_attempt?: number
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fund_protection_violations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          bonus_balance: number
          created_at: string
          currency: string
          deposited_balance: number
          id: string
          locked_balance: number
          profit_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          bonus_balance?: number
          created_at?: string
          currency?: string
          deposited_balance?: number
          id?: string
          locked_balance?: number
          profit_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          bonus_balance?: number
          created_at?: string
          currency?: string
          deposited_balance?: number
          id?: string
          locked_balance?: number
          profit_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount: number
          completed_at: string | null
          currency: string
          destination: Json
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          provider_reference: string | null
          rejection_reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          currency?: string
          destination: Json
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          provider_reference?: string | null
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          currency?: string
          destination?: Json
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          provider_reference?: string | null
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          provider: string
          transaction_id: string
          action: string
          created_at: string
        }
        Insert: {
          provider: string
          transaction_id: string
          action: string
          created_at?: string
        }
        Update: {
          provider?: string
          transaction_id?: string
          action?: string
          created_at?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          id: number
          admin_id: string
          action: string
          target_type: string
          target_id: string | null
          meta: Json
          created_at: string
        }
        Insert: {
          id?: number
          admin_id: string
          action: string
          target_type: string
          target_id?: string | null
          meta?: Json
          created_at?: string
        }
        Update: {
          id?: number
          admin_id?: string
          action?: string
          target_type?: string
          target_id?: string | null
          meta?: Json
          created_at?: string
        }
        Relationships: []
      }
      responsible_gaming_limits: {
        Row: {
          user_id: string
          daily_deposit_limit: number | null
          weekly_deposit_limit: number | null
          monthly_deposit_limit: number | null
          self_exclude_until: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          daily_deposit_limit?: number | null
          weekly_deposit_limit?: number | null
          monthly_deposit_limit?: number | null
          self_exclude_until?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          daily_deposit_limit?: number | null
          weekly_deposit_limit?: number | null
          monthly_deposit_limit?: number | null
          self_exclude_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          id: string
          user_id: string
          subject: string
          status: Database["public"]["Enums"]["support_ticket_status"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          status?: Database["public"]["Enums"]["support_ticket_status"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          status?: Database["public"]["Enums"]["support_ticket_status"]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          id: string
          ticket_id: string
          sender_id: string
          is_admin_reply: boolean
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          sender_id: string
          is_admin_reply?: boolean
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          sender_id?: string
          is_admin_reply?: boolean
          body?: string
          created_at?: string
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          id: string
          user_id: string
          doc_type: Database["public"]["Enums"]["kyc_doc_type"]
          storage_path: string
          status: Database["public"]["Enums"]["kyc_status"]
          reviewed_by: string | null
          reviewed_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          doc_type: Database["public"]["Enums"]["kyc_doc_type"]
          storage_path: string
          status?: Database["public"]["Enums"]["kyc_status"]
          reviewed_by?: string | null
          reviewed_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          doc_type?: Database["public"]["Enums"]["kyc_doc_type"]
          storage_path?: string
          status?: Database["public"]["Enums"]["kyc_status"]
          reviewed_by?: string | null
          reviewed_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_staff_member: {
        Args: {
          p_department?: string
          p_email: string
          p_first_name: string
          p_gender?: string
          p_last_name: string
          p_password: string
          p_role: string
          p_staff_title?: string
        }
        Returns: string
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      fn_get_affiliate_stats: { Args: never; Returns: Json }
      fn_get_recent_referrals: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          full_name: string
          created_at: string
          status: Database["public"]["Enums"]["account_status"]
          commission: number
        }[]
      }
      fn_get_admin_stats: { Args: never; Returns: Json }
      fn_get_admin_activity: {
        Args: { p_limit?: number }
        Returns: { kind: string; label: string; amount: number | null; created_at: string }[]
      }
      fn_get_pending_withdrawals: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          user_id: string
          full_name: string
          amount: number
          method: Database["public"]["Enums"]["payment_method"]
          destination: Json
          requested_at: string
        }[]
      }
      fn_get_super_admin_stats: { Args: never; Returns: Json }
      fn_get_deposits_vs_withdrawals: {
        Args: { p_days?: number }
        Returns: { day: string; deposits: number; withdrawals: number }[]
      }
      fn_get_top_games: {
        Args: { p_limit?: number }
        Returns: { game_key: string; title: string; turnover: number }[]
      }
      fn_record_referral_commission: {
        Args: { p_referred_user_id: string; p_deposit_id: string; p_amount: number }
        Returns: undefined
      }
      fn_resolve_referral_code: { Args: { p_code: string }; Returns: string }
      fn_search_users: {
        Args: { p_query: string; p_limit?: number }
        Returns: { id: string; full_name: string; avatar_url: string | null }[]
      }
      fn_guard_withdrawal_request: { Args: { p_amount: number }; Returns: boolean }
      fn_get_admin_fund_violations: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          user_id: string
          full_name: string
          kind: string
          attempted_amount: number
          available_profit_balance: number
          deposited_balance_at_attempt: number
          created_at: string
        }[]
      }
      fn_get_users: {
        Args: { p_search?: string; p_limit?: number }
        Returns: {
          id: string
          full_name: string
          email: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["account_status"]
          created_at: string
          last_login_at: string | null
          balance: number
        }[]
      }
      fn_set_user_status: {
        Args: { p_user_id: string; p_status: Database["public"]["Enums"]["account_status"] }
        Returns: undefined
      }
      fn_get_or_create_thread: { Args: { p_other_user_id: string }; Returns: string }
      fn_send_chat_message: { Args: { p_thread_id: string; p_body: string }; Returns: string }
      fn_send_red_packet: {
        Args: { p_recipient_id: string; p_amount: number; p_thread_id: string }
        Returns: Json
      }
      fn_issue_voucher: {
        Args: { p_recipient_id: string; p_amount: number; p_thread_id: string }
        Returns: Json
      }
      fn_redeem_voucher: { Args: { p_voucher_id: string }; Returns: Json }
      fn_approve_withdrawal: {
        Args: { p_withdrawal_id: string }
        Returns: undefined
      }
      fn_book_bet: {
        Args: {
          p_bet_type: Database["public"]["Enums"]["bet_type"]
          p_selections: Json
        }
        Returns: Json
      }
      fn_cash_out: { Args: { p_bet_id: string }; Returns: Json }
      fn_cash_out_preview: { Args: { p_bet_id: string }; Returns: Json }
      fn_choose: { Args: { k: number; n: number }; Returns: number }
      fn_complete_deposit: {
        Args: { p_deposit_id: string }
        Returns: undefined
      }
      fn_expire_booked_bets: { Args: never; Returns: number }
      fn_fail_deposit: { Args: { p_deposit_id: string }; Returns: undefined }
      fn_load_booked_bet: { Args: { p_bet_code: string }; Returns: Json }
      fn_lookup_email_by_phone: { Args: { p_phone: string }; Returns: string }
      fn_place_bet: {
        Args: {
          p_bet_type: Database["public"]["Enums"]["bet_type"]
          p_selections: Json
          p_stake: number
          p_system_size?: number
          p_winboost?: boolean
        }
        Returns: Json
      }
      fn_reject_withdrawal: {
        Args: { p_reason: string; p_withdrawal_id: string }
        Returns: undefined
      }
      fn_request_withdrawal: {
        Args: {
          p_amount: number
          p_destination: Json
          p_method: Database["public"]["Enums"]["payment_method"]
        }
        Returns: string
      }
      fn_settle_bet: { Args: { p_bet_id: string }; Returns: Json }
      fn_settle_selection: {
        Args: {
          p_selection_id: string
          p_status: Database["public"]["Enums"]["selection_status"]
        }
        Returns: undefined
      }
      fn_wallet_credit: {
        Args: {
          p_amount: number
          p_created_by?: string
          p_description: string
          p_reference_id: string
          p_reference_type: string
          p_status?: Database["public"]["Enums"]["wallet_tx_status"]
          p_type: Database["public"]["Enums"]["wallet_tx_type"]
          p_user_id: string
        }
        Returns: string
      }
      fn_wallet_debit: {
        Args: {
          p_amount: number
          p_created_by?: string
          p_description: string
          p_reference_id: string
          p_reference_type: string
          p_status?: Database["public"]["Enums"]["wallet_tx_status"]
          p_type: Database["public"]["Enums"]["wallet_tx_type"]
          p_user_id: string
        }
        Returns: string
      }
      generate_bet_code: { Args: never; Returns: string }
      get_my_school_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      fn_check_rate_limit: {
        Args: { p_key: string; p_max_attempts: number; p_window_seconds: number }
        Returns: boolean
      }
      fn_log_admin_action: {
        Args: { p_action: string; p_target_type: string; p_target_id?: string | null; p_meta?: Json }
        Returns: undefined
      }
      fn_get_admin_audit_log: {
        Args: { p_limit?: number }
        Returns: {
          id: number
          admin_id: string
          admin_name: string
          action: string
          target_type: string
          target_id: string | null
          meta: Json
          created_at: string
        }[]
      }
      fn_set_deposit_limits: {
        Args: { p_daily: number | null; p_weekly: number | null; p_monthly: number | null }
        Returns: undefined
      }
      fn_set_self_exclusion: { Args: { p_days: number }; Returns: undefined }
      fn_check_deposit_allowed: {
        Args: { p_user_id: string; p_amount: number }
        Returns: { allowed: boolean; reason: string | null }[]
      }
      fn_open_support_ticket: { Args: { p_subject: string; p_body: string }; Returns: string }
      fn_get_support_tickets: {
        Args: { p_status?: Database["public"]["Enums"]["support_ticket_status"] | null; p_limit?: number }
        Returns: {
          id: string
          user_id: string
          full_name: string
          subject: string
          status: Database["public"]["Enums"]["support_ticket_status"]
          created_at: string
          updated_at: string
          last_message: string | null
        }[]
      }
      fn_get_kyc_queue: {
        Args: { p_status?: Database["public"]["Enums"]["kyc_status"] | null; p_limit?: number }
        Returns: {
          id: string
          user_id: string
          full_name: string
          doc_type: Database["public"]["Enums"]["kyc_doc_type"]
          storage_path: string
          status: Database["public"]["Enums"]["kyc_status"]
          notes: string | null
          created_at: string
        }[]
      }
      fn_review_kyc_document: {
        Args: {
          p_document_id: string
          p_status: Database["public"]["Enums"]["kyc_status"]
          p_notes?: string | null
        }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "banned"
      banner_accent: "primary" | "boost" | "info"
      banner_kind: "hero_slide" | "announcement"
      bet_status:
        | "open"
        | "won"
        | "lost"
        | "void"
        | "cashed_out"
        | "partially_cashed_out"
      bet_type: "single" | "multiple" | "system"
      bonus_status: "active" | "completed" | "expired" | "forfeited"
      booked_bet_status: "active" | "loaded" | "expired" | "cancelled"
      casino_mode: "demo" | "real"
      deposit_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      fixture_status:
        | "upcoming"
        | "live"
        | "finished"
        | "cancelled"
        | "postponed"
      market_status: "open" | "suspended" | "closed"
      notification_type:
        | "bet_won"
        | "bet_lost"
        | "bet_settled"
        | "deposit"
        | "withdrawal"
        | "bonus"
        | "promo"
        | "system"
      payment_method:
        | "ecocash"
        | "onemoney"
        | "innbucks"
        | "omari"
        | "mukuru"
        | "visa"
        | "mastercard"
        | "bank_transfer"
      promo_type:
        | "welcome_bonus"
        | "deposit_bonus"
        | "free_bet"
        | "odds_boost"
        | "cashback"
      selection_status: "pending" | "won" | "lost" | "void"
      kyc_doc_type: "id_front" | "id_back" | "proof_of_address" | "selfie"
      kyc_status: "pending" | "approved" | "rejected"
      support_ticket_status: "open" | "pending" | "closed"
      user_role: "user" | "admin" | "super_admin"
      wallet_tx_status: "pending" | "completed" | "failed" | "reversed"
      wallet_tx_type:
        | "deposit"
        | "withdrawal"
        | "bet_stake"
        | "bet_payout"
        | "bet_refund"
        | "bonus_credit"
        | "bonus_debit"
        | "cashout"
        | "adjustment"
        | "booking_release"
        | "gift_sent"
        | "gift_received"
        | "voucher_issued"
        | "voucher_redeemed"
      withdrawal_status:
        | "pending"
        | "approved"
        | "processing"
        | "completed"
        | "rejected"
        | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "suspended", "banned"],
      banner_accent: ["primary", "boost", "info"],
      banner_kind: ["hero_slide", "announcement"],
      bet_status: [
        "open",
        "won",
        "lost",
        "void",
        "cashed_out",
        "partially_cashed_out",
      ],
      bet_type: ["single", "multiple", "system"],
      bonus_status: ["active", "completed", "expired", "forfeited"],
      booked_bet_status: ["active", "loaded", "expired", "cancelled"],
      casino_mode: ["demo", "real"],
      deposit_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      fixture_status: [
        "upcoming",
        "live",
        "finished",
        "cancelled",
        "postponed",
      ],
      market_status: ["open", "suspended", "closed"],
      notification_type: [
        "bet_won",
        "bet_lost",
        "bet_settled",
        "deposit",
        "withdrawal",
        "bonus",
        "promo",
        "system",
      ],
      payment_method: [
        "ecocash",
        "onemoney",
        "innbucks",
        "omari",
        "mukuru",
        "visa",
        "mastercard",
        "bank_transfer",
      ],
      promo_type: [
        "welcome_bonus",
        "deposit_bonus",
        "free_bet",
        "odds_boost",
        "cashback",
      ],
      selection_status: ["pending", "won", "lost", "void"],
      kyc_doc_type: ["id_front", "id_back", "proof_of_address", "selfie"],
      kyc_status: ["pending", "approved", "rejected"],
      support_ticket_status: ["open", "pending", "closed"],
      user_role: ["user", "admin", "super_admin"],
      wallet_tx_status: ["pending", "completed", "failed", "reversed"],
      wallet_tx_type: [
        "deposit",
        "withdrawal",
        "bet_stake",
        "bet_payout",
        "bet_refund",
        "bonus_credit",
        "bonus_debit",
        "cashout",
        "adjustment",
        "booking_release",
        "gift_sent",
        "gift_received",
        "voucher_issued",
        "voucher_redeemed",
      ],
      withdrawal_status: [
        "pending",
        "approved",
        "processing",
        "completed",
        "rejected",
        "failed",
      ],
    },
  },
} as const
