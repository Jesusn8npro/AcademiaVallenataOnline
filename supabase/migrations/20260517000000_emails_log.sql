create table if not exists public.emails_log (
  id uuid default gen_random_uuid() primary key,
  tipo text not null,
  destinatario text not null,
  nombre text,
  estado text not null default 'enviado',
  resend_id text,
  extra jsonb,
  created_at timestamptz default now() not null
);

alter table public.emails_log enable row level security;

create policy "admins_ver_emails_log"
  on public.emails_log for select
  using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );
