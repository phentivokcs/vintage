# API Integr

áció Beállítás

Ez a dokumentum részletezi, hogyan kell beállítani a szükséges API kulcsokat a webshop működéséhez.

## Szükséges API kulcsok

### 1. Barion Fizetési Rendszer

**Teszt környezet:**
- URL: https://api.test.barion.com
- Regisztráció: https://secure.test.barion.com/Register

**Éles környezet:**
- URL: https://api.barion.com
- Regisztráció: https://secure.barion.com/Register

**Környezeti változó:**
```
BARION_POS_KEY=your_barion_pos_key_here
```

**Beállítás Supabase-ben:**
1. Nyisd meg a Supabase projekt dashboard-ot
2. Settings → Edge Functions → Secrets
3. Add hozzá: `BARION_POS_KEY` = a Barion POSKey-ed

### 2. Billingo Számlázás

**API elérés:**
- URL: https://api.billingo.hu/v3
- API kulcs generálás: Billingo dashboard → Beállítások → API

**Környezeti változó:**
```
BILLINGO_API_KEY=your_billingo_api_key_here
```

**Beállítás Supabase-ben:**
1. Supabase dashboard → Settings → Edge Functions → Secrets
2. Add hozzá: `BILLINGO_API_KEY` = a Billingo API kulcsod

**Block ID beállítás:**
- A Billingo dashboard-on hozz létre egy számlablokkot
- A `billingo-invoice` Edge Function-ben a `block_id` értéket frissítsd (jelenleg: 0)

### 3. Packeta Szállítás ✅ BEÁLLÍTVA

**API elérés:**
- URL: https://www.zasilkovna.cz/api/rest
- Regisztráció: https://client.packeta.com/register

**Környezeti változók:**
```
PACKETA_API_KEY=cc2bcdc3c44fc306
PACKETA_API_PASSWORD=cc2bcdc3c44fc306a5310bd64e4b835d
```

**Státusz:** ✅ Már be van állítva a .env fájlban és működik!

### 4. Foxpost Szállítás (Opcionális)

**API elérés:**
- URL: https://foxpost.hu/
- Partner regisztráció szükséges

**Környezeti változó:**
```
FOXPOST_API_KEY=your_foxpost_api_key_here
```

### 5. Resend Email ✅ BEÁLLÍTVA

**API elérés:**
- URL: https://resend.com
- API kulcs: Dashboard → API Keys

**Környezeti változó:**
```
RESEND_API_KEY=re_K6bQCJmX_EDC1zkMk4oc9dxxTaLsCpMgP
```

**Státusz:** ✅ Már be van állítva és működik!

### 6. DPD Szállítás (Új!)

**API elérés:**
- URL: https://api.dpd.hu
- Partner regisztráció szükséges

**Környezeti változó:**
```
DPD_API_KEY=your_dpd_api_key_here
```

**Státusz:** Edge function létrehozva, API kulcs még hiányzik (mock módban működik)

## Edge Functions Deploy

Az Edge Functions már telepítve vannak:
- `barion-payment` - Barion fizetés indítása
- `barion-webhook` - Barion webhook kezelés
- `billingo-invoice` - Számla kiállítás
- `packeta-shipping` - Szállítás kezelés (Packeta/Foxpost) ✅
- `dpd-shipping` - DPD szállítás kezelés (Új!)
- `send-order-confirmation` - Rendelés megerősítő email ✅
- `send-contact-email` - Kapcsolat üzenet email ✅
- `send-newsletter-email` - Newsletter email

## Teszt adatok

### Barion teszt kártya
- Kártyaszám: 5559 9104 1100 0017
- Lejárat: 12/25
- CVV: 123

### Teszt rendelés flow
1. Termék hozzáadása kosárhoz
2. Pénztár → Adatok kitöltése
3. Barion teszt fizetés
4. Visszairányítás megerősítő oldalra
5. Számla kiállítás gomb → Billingo számla generálás
6. Szállítás indítása (admin funkció később)

## URL-ek

### Frontend
- Főoldal: /
- Pénztár: /penztar
- Rendelés megerősítés: /rendeles/:orderId/megerosites

### Edge Functions
- Barion fizetés: POST `/functions/v1/barion-payment`
- Barion webhook: POST `/functions/v1/barion-webhook`
- Billingo számla: POST `/functions/v1/billingo-invoice`
- Packeta pontok: GET `/functions/v1/packeta-shipping/pickup-points`
- Szállítmány létrehozás: POST `/functions/v1/packeta-shipping/create-shipment`
- Követés: GET `/functions/v1/packeta-shipping/track?tracking=XXX`

## Hibaelhárítás

### Barion hibák
- "Invalid POSKey" → Ellenőrizd a BARION_POS_KEY értékét
- "Invalid currency" → HUF támogatott
- Redirect nem működik → Ellenőrizd a RedirectUrl és CallbackUrl értékeket

### Billingo hibák
- "Unauthorized" → Ellenőrizd a BILLINGO_API_KEY-t
- "Invalid partner" → Partner létrehozás sikertelen, ellenőrizd az adatokat
- "Block not found" → Állítsd be a helyes block_id-t

### Packeta hibák
- "Invalid credentials" → Ellenőrizd az API_KEY és PASSWORD párost
- "Branch not found" → Érvénytelen pickup point ID

## Következő lépések

1. **API kulcsok beszerzése**: Regisztrálj mindhárom szolgáltatónál
2. **Secrets beállítása**: Add hozzá az API kulcsokat a Supabase-ben
3. **Teszt fizetés**: Próbálj ki egy teszt rendelést
4. **Számla tesztelés**: Ellenőrizd a számla generálást
5. **Admin panel**: Építsd ki az admin felületet termékfeltöltéshez és rendeléskezeléshez
