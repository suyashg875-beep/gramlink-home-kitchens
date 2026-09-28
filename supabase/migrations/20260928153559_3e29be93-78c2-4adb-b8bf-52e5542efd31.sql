create type public.app_role as enum ('admin','seller','customer');
create type public.seller_status as enum ('pending','verified','rejected');
create type public.order_status as enum ('pending','accepted','preparing','ready','completed','rejected','cancelled');

create table public.profiles (
  id uuid primary key,
  full_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles readable" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create policy "own profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare r text := new.raw_user_meta_data->>'role';
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), coalesce(new.raw_user_meta_data->>'phone',''));
  if r in ('customer','seller') then
    insert into public.user_roles (user_id, role) values (new.id, r::public.app_role);
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.choose_role(_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if _role not in ('customer','seller') then raise exception 'Invalid role'; end if;
  if exists (select 1 from public.user_roles where user_id = auth.uid()) then raise exception 'Role already set'; end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), _role::public.app_role);
end $$;
revoke execute on function public.choose_role(text) from public, anon;
grant execute on function public.choose_role(text) to authenticated;

create table public.seller_profiles (
  user_id uuid primary key,
  business_name text not null,
  about text not null default '',
  village_or_area text not null,
  pincode text not null,
  fssai_number text,
  document_urls text[] not null default '{}',
  status public.seller_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.seller_profiles to anon;
grant select, insert, update on public.seller_profiles to authenticated;
grant all on public.seller_profiles to service_role;
alter table public.seller_profiles enable row level security;

create policy "verified sellers public" on public.seller_profiles for select to anon, authenticated
  using (status = 'verified' or user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "seller inserts own" on public.seller_profiles for insert to authenticated
  with check (user_id = auth.uid() and public.has_role(auth.uid(),'seller'));
create policy "seller updates own" on public.seller_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admin updates sellers" on public.seller_profiles for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.guard_seller_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.has_role(auth.uid(),'admin') then
    new.updated_at := now(); return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'pending';
  else
    if new.status is distinct from old.status then
      raise exception 'Only admins can change verification status';
    end if;
    new.user_id := old.user_id;
    if old.status = 'rejected' then new.status := 'pending'; end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger seller_status_guard before insert or update on public.seller_profiles
  for each row execute function public.guard_seller_status();

create or replace function public.is_verified_seller(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.seller_profiles where user_id = _uid and status = 'verified')
$$;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_profiles(user_id) on delete cascade,
  name text not null,
  category text not null check (category in ('Pickles','Papad','Masalas','Sweets','Snacks','Other')),
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_available boolean not null default true,
  is_published boolean not null default false,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;

create policy "public sees published from verified" on public.products for select to anon, authenticated
  using ((is_published and public.is_verified_seller(seller_id)) or seller_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "seller insert own products" on public.products for insert to authenticated
  with check (seller_id = auth.uid() and public.has_role(auth.uid(),'seller'));
create policy "seller update own products" on public.products for update to authenticated
  using (seller_id = auth.uid()) with check (seller_id = auth.uid());
create policy "seller delete own products" on public.products for delete to authenticated
  using (seller_id = auth.uid());

create or replace function public.guard_product_publish()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_published and not public.is_verified_seller(new.seller_id) then
    raise exception 'Only verified sellers can publish products';
  end if;
  return new;
end $$;
create trigger product_publish_guard before insert or update on public.products
  for each row execute function public.guard_product_publish();

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  seller_id uuid not null references public.seller_profiles(user_id),
  customer_name text not null,
  phone text not null,
  address text not null,
  total numeric(10,2) not null,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "order parties read" on public.orders for select to authenticated
  using (customer_id = auth.uid() or seller_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  price numeric(10,2) not null,
  quantity integer not null check (quantity > 0)
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "order items read" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
    and (o.customer_id = auth.uid() or o.seller_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

create or replace function public.place_order(_items jsonb, _name text, _phone text, _address text)
returns uuid[] language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  it jsonb; p public.products%rowtype; q int;
  seller uuid; oid uuid; ids uuid[] := '{}';
begin
  if uid is null then raise exception 'Please log in'; end if;
  if coalesce(trim(_name),'') = '' or coalesce(trim(_phone),'') = '' or coalesce(trim(_address),'') = '' then
    raise exception 'Name, phone and address are required';
  end if;
  if jsonb_array_length(_items) = 0 then raise exception 'Cart is empty'; end if;
  for seller in
    select distinct pr.seller_id from jsonb_array_elements(_items) e
    join public.products pr on pr.id = (e->>'product_id')::uuid
  loop
    insert into public.orders (customer_id, seller_id, customer_name, phone, address, total)
    values (uid, seller, trim(_name), trim(_phone), trim(_address), 0) returning id into oid;
    for it in select * from jsonb_array_elements(_items) loop
      select * into p from public.products where id = (it->>'product_id')::uuid for update;
      if not found or p.seller_id <> seller then continue; end if;
      q := (it->>'quantity')::int;
      if q is null or q < 1 then raise exception 'Invalid quantity'; end if;
      if not (p.is_published and p.is_available and public.is_verified_seller(p.seller_id)) then
        raise exception '% is not available', p.name;
      end if;
      if p.stock < q then raise exception 'Only % left for %', p.stock, p.name; end if;
      update public.products set stock = stock - q where id = p.id;
      insert into public.order_items (order_id, product_id, product_name, price, quantity)
      values (oid, p.id, p.name, p.price, q);
    end loop;
    update public.orders set total = (select coalesce(sum(price*quantity),0) from public.order_items where order_id = oid) where id = oid;
    ids := ids || oid;
  end loop;
  if array_length(ids,1) is null then raise exception 'No valid products'; end if;
  return ids;
end $$;
revoke execute on function public.place_order(jsonb,text,text,text) from public, anon;
grant execute on function public.place_order(jsonb,text,text,text) to authenticated;

create or replace function public.update_order_status(_order_id uuid, _status public.order_status)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype; ok boolean := false;
begin
  select * into o from public.orders where id = _order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if o.seller_id = auth.uid() then
    ok := (o.status = 'pending' and _status in ('accepted','rejected'))
       or (o.status = 'accepted' and _status = 'preparing')
       or (o.status = 'preparing' and _status = 'ready')
       or (o.status = 'ready' and _status = 'completed');
  elsif o.customer_id = auth.uid() then
    ok := (o.status = 'pending' and _status = 'cancelled');
  end if;
  if not ok then raise exception 'This status change is not allowed'; end if;
  update public.orders set status = _status, updated_at = now() where id = _order_id;
  if _status in ('rejected','cancelled') then
    update public.products p set stock = p.stock + oi.quantity
    from public.order_items oi where oi.order_id = _order_id and oi.product_id = p.id;
  end if;
end $$;
revoke execute on function public.update_order_status(uuid, public.order_status) from public, anon;
grant execute on function public.update_order_status(uuid, public.order_status) to authenticated;

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  customer_id uuid not null,
  seller_id uuid not null,
  customer_name text not null default '',
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);
grant select on public.reviews to anon;
grant select, insert on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "reviews public" on public.reviews for select to anon, authenticated using (true);
create policy "review own completed order" on public.reviews for insert to authenticated
  with check (customer_id = auth.uid() and exists (
    select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid() and o.status = 'completed'));

create or replace function public.fill_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select o.seller_id, split_part(o.customer_name,' ',1) into new.seller_id, new.customer_name
  from public.orders o where o.id = new.order_id;
  return new;
end $$;
create trigger review_fill before insert on public.reviews for each row execute function public.fill_review();

create policy "product images read" on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
create policy "sellers upload product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "sellers delete product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "docs owner or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'seller-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));
create policy "docs owner upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'seller-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "docs owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'seller-docs' and (storage.foldername(name))[1] = auth.uid()::text);