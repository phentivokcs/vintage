# Webshop Setup Checklist

Ez a checklist végigvezet mindenen, ami szükséges a webshop teljes működéséhez.

## ✅ Már kész

### Infrastruktúra
- [x] Supabase projekt létrehozva
- [x] Database sémák és migrációk telepítve
- [x] Edge functions deployolva
- [x] Frontend build működik
- [x] RLS policy-k beállítva

### Email & Szállítás
- [x] Resend API kulcs beállítva
- [x] Packeta API kulcs beállítva
- [x] Email küldő functionök működnek

### Funkciók
- [x] Kosár rendszer
- [x] Rendelés leadás
- [x] Admin panel
- [x] Termék feltöltés
- [x] Értékelési rendszer
- [x] Kupon rendszer
- [x] Flash sale rendszer
- [x] Newsletter feliratkozás

## 🔄 API kulcsok beállítása

### 1. Billingo Számlázás (RÉSZBEN KÉSZ)

**Státusz:** API kulcs van, de block_id hiányzik

**Lépések:**
1. [x] Regisztráció: https://www.billingo.hu
2. [x] API kulcs generálás: Dashboard → Beállítások → API
3. [x] API kulcs hozzáadva a dokumentációhoz
4. [ ] **KÖVETKEZŐ:** API kulcs beállítása Supabase-ben:
   - Supabase Dashboard → Settings → Edge Functions → Secrets
   - Add hozzá: `BILLINGO_API_KEY` = `47f4bd18-b99c-11f0-9c25-02cdfb5103ff`
5. [ ] **KÖVETKEZŐ:** Számlablokk létrehozása Billingo dashboard-on
6. [ ] **KÖVETKEZŐ:** Block ID frissítése az edge functionben:
   - Fájl: `supabase/functions/billingo-invoice/index.ts`
   - Sor: 166
   - Változó: `block_id: 0` → `block_id: <valódi_block_id>`

### 2. Barion Fizetési Rendszer (HIÁNYZIK)

**Státusz:** Nincs API kulcs

**Lépések:**
1. [ ] Teszt regisztráció: https://secure.test.barion.com/Register
2. [ ] POSKey megszerzése a dashboard-ról
3. [ ] API kulcs beállítása Supabase-ben:
   - Supabase Dashboard → Settings → Edge Functions → Secrets
   - Add hozzá: `BARION_POS_KEY` = <your_key>
4. [ ] Teszt fizetés kipróbálása:
   - Kártyaszám: 5559 9104 1100 0017
   - Lejárat: 12/25
   - CVV: 123
5. [ ] **ÉLES:** Éles regisztráció: https://secure.barion.com/Register
6. [ ] Webhook URL beállítása Barion dashboard-on:
   - URL: `https://glbbcuceohohtqpxmjdk.supabase.co/functions/v1/barion-webhook`

### 3. DPD Szállítás (HIÁNYZIK)

**Státusz:** Edge function kész, de API kulcs hiányzik (mock módban működik)

**Lépések:**
1. [ ] Partner regisztráció: https://www.dpd.com/hu/hu/csomagkuldes/partner-regisztracio/
2. [ ] API kulcs megszerzése
3. [ ] API kulcs beállítása Supabase-ben:
   - Supabase Dashboard → Settings → Edge Functions → Secrets
   - Add hozzá: `DPD_API_KEY` = <your_key>
4. [ ] Teszt szállítmány létrehozása

### 4. Foxpost Szállítás (OPCIONÁLIS)

**Státusz:** Nincs implementálva

**Lépések:**
1. [ ] Partner regisztráció: https://foxpost.hu/
2. [ ] API dokumentáció megszerzése
3. [ ] Edge function létrehozása (ha szükséges)
4. [ ] API kulcs beállítása

## 🔧 Billingo Beállítás Részletesen

### Supabase Secret Hozzáadása

```bash
# 1. Módszer: Supabase Dashboard UI
1. Nyisd meg: https://supabase.com/dashboard/project/glbbcuceohohtqpxmjdk
2. Settings → Edge Functions → Secrets
3. Kattints: "Add new secret"
4. Name: BILLINGO_API_KEY
5. Value: 47f4bd18-b99c-11f0-9c25-02cdfb5103ff
6. Mentés
```

### Block ID Megszerzése

1. Jelentkezz be a Billingo dashboard-ra: https://app.billingo.hu
2. Menj a "Beállítások" → "Számlablokkok" menüpontba
3. Hozz létre egy új blokkot vagy válassz egy meglévőt
4. A blokk ID-ja látható lesz a listában (pl: 123456)

### Edge Function Módosítása

A block_id frissítése után deployold újra az edge functiont:

```bash
# A módosított function újra deploying-ja automatikusan megtörténik
# amikor szerkeszted a fájlt
```

## 🧪 Tesztelés

### Billingo Teszt
```bash
# Tesztelés curl-el (rendelés létrehozása után)
curl -X POST https://glbbcuceohohtqpxmjdk.supabase.co/functions/v1/billingo-invoice \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "your-order-id"}'
```

### Barion Teszt
1. Adj hozzá egy terméket a kosárhoz
2. Menj a pénztárhoz
3. Töltsd ki az adatokat
4. Válaszd a Barion fizetést
5. Használd a teszt kártyát
6. Ellenőrizd a visszairányítást

### DPD Teszt
Mock módban most is működik, éles teszteléshez API kulcs szükséges.

## 📋 Admin User Létrehozása

Ha még nem hoztál létre admin usert, kövesd az ADMIN_SETUP.md útmutatót.

**Gyors módszer:**
```sql
-- Supabase Dashboard → SQL Editor
UPDATE auth.users
SET raw_app_meta_data = '{"role": "admin"}'::jsonb
WHERE email = 'your-email@example.com';
```

## 🚀 Production Checklist

Mielőtt élesbe raknád:

1. [ ] Minden API kulcs beállítva Supabase Secrets-ben
2. [ ] Barion ÉLES kulcs használata (nem teszt)
3. [ ] Billingo block_id beállítva
4. [ ] Admin user létrehozva
5. [ ] Email küldés tesztelve
6. [ ] Teszt rendelés végigvitele
7. [ ] Számlakiállítás tesztelve
8. [ ] Szállítás tesztelve
9. [ ] Frontend deploy Vercel-re
10. [ ] Domain beállítás
11. [ ] SSL tanúsítvány
12. [ ] GDPR compliance ellenőrzés (adatok EU-ban?)

## 📞 Support Linkek

- **Barion:** support@barion.com | https://docs.barion.com
- **Billingo:** ugyfelszolgalat@billingo.hu | https://www.billingo.hu/api-docs
- **Packeta:** support@packeta.com
- **DPD:** https://www.dpd.com/hu/hu/kapcsolat/
- **Supabase:** https://supabase.com/docs

## 🎯 Következő Teendők Prioritás Szerint

1. **Kritikus (fizetés működéséhez):**
   - Barion API kulcs beszerzése és beállítása
   - Billingo block_id beállítása
   - Billingo API kulcs Supabase-be rakása

2. **Fontos (full funkció):**
   - DPD API kulcs beszerzése
   - Teszt rendelések végrehajtása
   - Minden flow ellenőrzése

3. **Nice to have:**
   - Foxpost integráció
   - Bundle size optimalizálás
   - SEO beállítások finomhangolása
