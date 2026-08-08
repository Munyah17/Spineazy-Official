#!/usr/bin/env node
// One-time provisioning script for the admin/super-admin accounts.
// Run this yourself once you have real Supabase credentials -- Claude has
// no access to your live project and cannot run this for you.
//
// Usage (from the repo root, with your REAL .env values loaded):
//   SUPER_ADMIN_PASSWORD='...' ADMIN_PASSWORD='...' node scripts/provision-admin-accounts.mjs
//
// Add --force-reassign only if you want an email that's already registered
// to a DIFFERENT account to be freed up for this one. That DELETES the
// existing auth user, which cascades (per the schema's on delete cascade
// foreign keys) to their profile, wallet, transactions, bets, and chat
// history. There is no undo. Without the flag, an already-registered email
// is skipped and reported, nothing is deleted.
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
// environment (same values as your real .env.local, never the placeholder
// ones committed to this repo).

import { createClient } from "@supabase/supabase-js";

const ACCOUNTS = [
  { email: "munyamuzvidziwa19@gmail.com", fullName: "Munyah Griezmann", role: "super_admin", passwordEnv: "SUPER_ADMIN_PASSWORD" },
  { email: "munyah777@gmail.com", fullName: "Munyaradzi Griezmann", role: "admin", passwordEnv: "ADMIN_PASSWORD" },
];

const forceReassign = process.argv.includes("--force-reassign");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey || url.includes("placeholder")) {
  console.error(
    "Missing or placeholder NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Export your REAL project's values before running this script."
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function findUserByEmail(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function run() {
  for (const account of ACCOUNTS) {
    const password = process.env[account.passwordEnv];
    if (!password) {
      console.error(`Skipping ${account.email}: set ${account.passwordEnv} in the environment first.`);
      continue;
    }

    const existing = await findUserByEmail(account.email);
    if (existing) {
      if (!forceReassign) {
        console.log(
          `${account.email} already exists (user ${existing.id}). Re-run with --force-reassign to delete ` +
            "and recreate it -- that wipes their wallet/history. Skipping for now."
        );
        continue;
      }
      console.log(`Deleting existing account for ${account.email} (user ${existing.id})...`);
      const { error: deleteError } = await admin.auth.admin.deleteUser(existing.id);
      if (deleteError) {
        console.error(`Failed to delete ${account.email}:`, deleteError.message);
        continue;
      }
    }

    console.log(`Creating ${account.email}...`);
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: account.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: account.fullName },
    });
    if (createError) {
      console.error(`Failed to create ${account.email}:`, createError.message);
      continue;
    }

    // Give the profiles-on-signup trigger a moment to create the row.
    await new Promise((resolve) => setTimeout(resolve, 800));

    const { data: updated, error: roleError } = await admin
      .from("profiles")
      .update({ role: account.role })
      .eq("id", created.user.id)
      .select("id");

    if (roleError) {
      console.error(`Created ${account.email} but couldn't set role:`, roleError.message);
    } else if (!updated || updated.length === 0) {
      console.warn(
        `Created ${account.email} but no profiles row was found to update -- check whether a ` +
          "handle-new-user trigger exists, or set the role manually."
      );
    } else {
      console.log(`✓ ${account.email} created as ${account.role}`);
    }
  }
}

run();
