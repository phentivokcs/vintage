# Admin Setup Guide

## Admin Autentikáció

Az admin panel most biztonságos Supabase Auth-ot használ. Az admin role az `auth.users.raw_app_meta_data` JSON mezőben van tárolva, amelyet a felhasználók NEM tudnak módosítani.

## Admin User Létrehozása

### 1. Módszer: Supabase Dashboard SQL Editor

1. Nyisd meg a Supabase Dashboard-ot
2. Menj a "SQL Editor" részhez
3. Futtasd le ezt az SQL-t:

```sql
-- 1. Először hozz létre egy új felhasználót (vagy használj egy meglévőt)
-- FONTOS: Cseréld le az email címet és jelszót!

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com', -- CSERÉLD LE AZ EMAIL CÍMET
  crypt('your-secure-password-here', gen_salt('bf')), -- CSERÉLD LE A JELSZÓT
  NOW(),
  '{"role": "admin"}'::jsonb, -- Ez az ADMIN ROLE!
  '{}'::jsonb,
  NOW(),
  NOW(),
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@example.com'
);

-- 2. VAGY ha már van felhasználód, akkor csak add hozzá az admin role-t:

UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com'; -- CSERÉLD LE AZ EMAIL CÍMET
```

### 2. Módszer: Supabase CLI

Ha használod a Supabase CLI-t:

```bash
# Először hozd létre a felhasználót a Supabase Dashboard-on keresztül
# Aztán frissítsd az app_metadata-t:

supabase db execute "UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{\"role\": \"admin\"}'::jsonb WHERE email = 'admin@example.com';"
```

### 3. Admin Role Eltávolítása

Ha el szeretnéd távolítani valakit az admin-ból:

```sql
UPDATE auth.users
SET raw_app_meta_data =
  raw_app_meta_data - 'role'
WHERE email = 'user@example.com';
```

## Admin Jogosultságok

Az admin felhasználók a következő műveleteket végezhetik:

- Termékek feltöltése, szerkesztése, törlése
- Rendelések megtekintése és kezelése
- Kuponok és akciók kezelése
- Flash sale-ek kezelése
- Üzenetek megtekintése
- Értékelések moderálása
- Tartalom szerkesztése
- Teljes admin panel hozzáférés

## Biztonság

- Az admin role az `app_metadata`-ban van, amit NEM módosíthatnak a felhasználók
- Csak a Service Role API kulcs tudja módosítani
- A JWT token tartalmazza az admin státuszt a gyors policy ellenőrzéshez
- RLS policy-k védik az összes táblát
- Nincs hardcoded jelszó a kódban

## Troubleshooting

### "Nincs admin jogosultságod" hiba

1. Ellenőrizd, hogy az `auth.users` táblában a `raw_app_meta_data` tartalmazza-e: `{"role": "admin"}`
2. Jelentkezz ki és be újra
3. Ellenőrizd a JWT tokent: `console.log(session.user.app_metadata)`

### Nem tudsz bejelentkezni

1. Ellenőrizd, hogy az email cím és jelszó helyes-e
2. Nézd meg a Supabase Dashboard > Authentication > Users részét
3. Ellenőrizd, hogy az email confirmed-e

### SQL Query Példa ellenőrzésre

```sql
-- Ellenőrizd, hogy egy user admin-e:
SELECT
  email,
  raw_app_meta_data->>'role' as role
FROM auth.users
WHERE email = 'admin@example.com';
```
