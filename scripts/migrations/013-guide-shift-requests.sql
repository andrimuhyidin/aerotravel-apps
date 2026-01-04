-- 013-guide-shift-requests.sql
-- Guide shift swap / coverage requests

create table if not exists public.guide_shift_requests (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  from_guide_id uuid not null references public.users(id),
  to_guide_id uuid not null references public.users(id),
  status text not null default 'pending', -- pending | approved | rejected | cancelled
  reason text,
  admin_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references public.users(id)
);

create index if not exists idx_guide_shift_requests_from_guide
  on public.guide_shift_requests (from_guide_id);

create index if not exists idx_guide_shift_requests_to_guide
  on public.guide_shift_requests (to_guide_id);

comment on table public.guide_shift_requests is 'Requests from guides to swap or handover a trip to another guide';


