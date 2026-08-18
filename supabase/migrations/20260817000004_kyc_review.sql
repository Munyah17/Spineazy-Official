-- Spineazy: KYC document upload + admin review queue. Files live in a
-- private Storage bucket; only the owner and admins can read them (via
-- signed URLs generated server-side, never a public URL).

do $$ begin
  create type public.kyc_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.kyc_doc_type as enum ('id_front', 'id_back', 'proof_of_address', 'selfie');
exception when duplicate_object then null; end $$;

create table if not exists public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  doc_type public.kyc_doc_type not null,
  storage_path text not null,
  status public.kyc_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.kyc_documents enable row level security;

drop policy if exists kyc_documents_select on public.kyc_documents;
create policy kyc_documents_select on public.kyc_documents
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists kyc_documents_insert on public.kyc_documents;
create policy kyc_documents_insert on public.kyc_documents
  for insert to authenticated
  with check (user_id = auth.uid());

-- Review actions (status/notes/reviewed_by/reviewed_at) go through
-- fn_review_kyc_document below rather than a direct client update, so no
-- UPDATE policy is granted here.

insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

drop policy if exists kyc_storage_insert_own on storage.objects;
create policy kyc_storage_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists kyc_storage_select_own_or_admin on storage.objects;
create policy kyc_storage_select_own_or_admin on storage.objects
  for select to authenticated
  using (bucket_id = 'kyc-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create or replace function public.fn_get_kyc_queue(p_status public.kyc_status default 'pending', p_limit int default 50)
returns table (
  id uuid,
  user_id uuid,
  full_name text,
  doc_type public.kyc_doc_type,
  storage_path text,
  status public.kyc_status,
  notes text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select d.id, d.user_id, p.full_name, d.doc_type, d.storage_path, d.status, d.notes, d.created_at
  from public.kyc_documents d
  join public.profiles p on p.id = d.user_id
  where p_status is null or d.status = p_status
  order by d.created_at asc
  limit p_limit;
end;
$$;

grant execute on function public.fn_get_kyc_queue(public.kyc_status, int) to authenticated;

create or replace function public.fn_review_kyc_document(p_document_id uuid, p_status public.kyc_status, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_status = 'pending' then
    raise exception 'Review must set approved or rejected';
  end if;

  update public.kyc_documents
  set status = p_status, notes = p_notes, reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_document_id;
end;
$$;

grant execute on function public.fn_review_kyc_document(uuid, public.kyc_status, text) to authenticated;
