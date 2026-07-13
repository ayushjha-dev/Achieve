-- 1. Create Certificates Table
create table public.certificates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  organization text,
  category text,
  issue_date date,
  file_path text not null,
  file_type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on Certificates Table
alter table public.certificates enable row level security;

-- Certificates RLS Policies
create policy "Users can view their own certificates"
  on public.certificates for select
  using (auth.uid() = user_id);

create policy "Users can insert their own certificates"
  on public.certificates for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own certificates"
  on public.certificates for update
  using (auth.uid() = user_id);

create policy "Users can delete their own certificates"
  on public.certificates for delete
  using (auth.uid() = user_id);


-- 2. Create Storage Bucket for Certificates
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do nothing;


-- 3. Storage Objects RLS Policies (for folder structure auth.uid()/*)
create policy "Users can upload certificate files to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'certificates' 
    and auth.uid()::text = split_part(name, '/', 1)
  );

create policy "Users can view their own certificate files"
  on storage.objects for select
  using (
    bucket_id = 'certificates' 
    and auth.uid()::text = split_part(name, '/', 1)
  );

create policy "Users can update their own certificate files"
  on storage.objects for update
  using (
    bucket_id = 'certificates' 
    and auth.uid()::text = split_part(name, '/', 1)
  );

create policy "Users can delete their own certificate files"
  on storage.objects for delete
  using (
    bucket_id = 'certificates' 
    and auth.uid()::text = split_part(name, '/', 1)
  );
