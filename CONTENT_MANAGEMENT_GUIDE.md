# Tartalom Kezelés - Használati Útmutató

## Bevezetés

A tartalom kezelő rendszer lehetővé teszi, hogy az admin felületen keresztül **kód írása nélkül** módosítsd a webshop vizuális és szöveges tartalmát. Minden változtatás azonnal élesben látható a frissítés után.

## Elérés

1. Lépj be az admin felületre: `/admin`
2. Jelszó: `admin2024`
3. Kattints a **"Tartalom Kezelés"** fülre

## Funkciók Áttekintése

### 🖼️ 1. Főoldal (Hero Banner)

**Mit tudsz változtatni:**
- **Banner Kép**: A főoldal háttérképe
  - Drag & drop vagy file browse
  - Max 5 MB
  - Ajánlott méret: 1920x1080 px
- **Fő Cím**: Nagy betűs főcím
- **Alcím**: Leírás a cím alatt
- **Gomb Szöveg**: Call-to-action gomb felirata
- **Gomb Link**: Hová vigyen a gomb (pl. `/products`)

**Használat:**
1. Kép feltöltéséhez kattints a keretbe vagy húzd be a képet
2. Előnézet megjelenik automatikusan
3. Módosítsd a szövegeket
4. Kattints a **"Mentés"** gombra

---

### 🎯 2. Promóciós Bannerek

**3 promóciós banner szerkeszthető.**

**Minden bannernél beállítható:**
- **Kép**: Promóciós banner képe
- **Cím**: Banner címe (pl. "Új Érkezések")
- **Link**: Hová vigyen a banner (pl. `/products?sort=newest`)
- **Aktív**: Checkbox - kapcsold be/ki a bannert

**Példa használat:**
```
Banner #1: Új Érkezések
- Kép: új kollekció fotója
- Link: /products?sort=newest
- ✅ Aktív

Banner #2: Black Friday
- Kép: akciós banner
- Link: /products?sale=true
- ✅ Aktív

Banner #3: Nyári leárazás
- Kép: nyári termékek
- Link: /products?season=summer
- ❌ Inaktív (nem jelenik meg)
```

---

### 👔👗 3. Kategória Header Képek

**Férfi és Női kategóriákhoz külön-külön:**
- **Header Kép**: Nagy banner kép a kategória tetején
- **Cím**: Kategória neve
- **Leírás**: Rövid ismertető szöveg

**Tipp:** Használj magas minőségű lifestyle képeket, amik reprezentálják a stílust.

---

### 📧 4. Lábléc (Footer)

**Üzlet Információk:**
- Üzlet neve
- Rövid leírás
- Email cím
- Telefonszám
- Fizikai cím

**Social Media:**
- Facebook URL
- Instagram URL
- TikTok URL

**Egyéb:**
- "Rólunk" szöveg (hosszabb bemutatkozás)
- Copyright szöveg

---

### 🔍 5. SEO Beállítások

**Meta Tagek:**
- **Meta Title**: Böngésző címsorban megjelenő szöveg (max 60 karakter)
- **Meta Description**: Keresőben megjelenő leírás (max 160 karakter)
- **Kulcsszavak**: Vesszővel elválasztott kulcsszavak

**Open Graph (Social Media):**
- **OG Title**: Facebook/Twitter megosztásnál megjelenő cím
- **OG Description**: Social media leírás
- **OG Image**: Social media kép (ajánlott: 1200x630 px)

**Tipp:** Jól megírt SEO növeli a Google találati esélyeket!

---

### 📰 6. Hírlevel Szekció

**Beállítható elemek:**
- Cím (pl. "Iratkozz fel hírlevelünkre")
- Leírás
- Gomb szöveg
- Input placeholder szöveg
- Sikeres feliratkozás üzenet
- Adatvédelmi szöveg

---

### 🎨 7. Design Elemek

**Logó:**
- Feltölthető a webshop logója
- Használat: Header-ben és email-ekben

**Színek (Color Picker):**
- **Elsődleges szín**: Fő brand szín
- **Másodlagos szín**: Kiegészítő szín
- **Kiemelő szín**: Akciók, figyelemfelkeltés
- **Siker szín**: Zöld (megerősítések)
- **Hiba szín**: Piros (hibaüzenetek)

⚠️ **Figyelem:** A színek változtatása még nem alkalmazza automatikusan az egész oldalon. Ez egy jövőbeli feature.

---

## Képfeltöltés Követelmények

### ✅ Támogatott formátumok
- JPG / JPEG
- PNG
- WEBP
- SVG
- GIF

### 📏 Ajánlott méretek
| Típus | Méret |
|-------|-------|
| Hero Banner | 1920x1080 px |
| Promó Banner | 800x600 px |
| Kategória Header | 1600x400 px |
| Logó | 200x80 px |
| OG Image | 1200x630 px |

### 🔒 Limitek
- **Max fájlméret:** 5 MB
- **Tárhely:** Supabase CDN (gyors betöltés)

---

## Gyakori Műveletek

### Kép cseréje
1. Navigálj a megfelelő szekcióhoz
2. Kattints a "Drag & Drop" területre
3. Válaszd ki az új képet
4. Előnézet után kattints **"Mentés"**

### Szöveg módosítása
1. Írd át a szöveges mezőket
2. Kattints **"Mentés"**
3. Cache frissül 5 perc alatt automatikusan

### Banner ki/bekapcsolása
1. Promóciók fülre
2. Checkbox be/ki kapcsolása
3. **"Mentés"**

### Alaphelyzet visszaállítása
1. Navigálj a módosítani kívánt szekcióhoz
2. Kattints **"Alaphelyzet"** gombra
3. Erősítsd meg a műveletet
4. Eredeti értékek visszaállnak

---

## Cache & Frissítés

### Automatikus cache
- **Élettartam:** 5 perc
- **Tárhely:** localStorage (gyors betöltés)
- **Realtime:** Supabase Realtime figyeli a változásokat

### Manuális frissítés
Ha nem látod azonnal a változtatásokat:
1. Nyomd meg `Ctrl + F5` (teljes újratöltés)
2. Vagy várj 5 percet

---

## Történet & Audit Log

Minden változtatás naplózva van:
- Ki módosította
- Mikor
- Mit változtatott
- Régi és új érték

**Megtekintés:** Database → `content_history` tábla

---

## Hibaelhárítás

### Kép nem töltődik fel
- ✅ Ellenőrizd a fájlméretet (max 5 MB)
- ✅ Ellenőrizd a formátumot (JPG, PNG, WEBP, SVG)
- ✅ Próbáld újra feltölteni
- ✅ Nézd meg a böngésző konzolt (F12)

### Változtatások nem látszanak
- ✅ Kattintottál "Mentés"-re?
- ✅ Frissítsd az oldalt (Ctrl + F5)
- ✅ Várj 5 percet a cache lejártára

### "Hiba történt" üzenet
- ✅ Ellenőrizd az internet kapcsolatot
- ✅ Jelentkezz be újra
- ✅ Próbáld újra 1 perc múlva

---

## Best Practices

### 📸 Képek
- ✅ Használj magas minőségű, profi fotókat
- ✅ Optimalizáld a képeket online eszközzel (pl. TinyPNG)
- ✅ Egységes stílus (filter, színvilág)

### ✍️ Szövegek
- ✅ Rövid, tömör mondatok
- ✅ Kerüld a túl hosszú címeket
- ✅ Figyelj a helyesírásra
- ✅ Hívó szavak használata (CTA)

### 🎨 Design
- ✅ Konzisztens színpaletta
- ✅ Jó kontrasztarány (olvashatóság)
- ✅ Ne használj túl sok különböző színt

### 🔍 SEO
- ✅ Releváns kulcsszavak
- ✅ Egyedi meta description minden oldalhoz
- ✅ Ne másold le más oldalak szövegét

---

## Technikai Háttér (Fejlesztőknek)

### Database Séma
```sql
site_content (
  section: hero | promo | footer | seo | newsletter | design | category
  key: egyedi azonosító
  value: jsonb (rugalmas struktúra)
  content_type: text | url | color | json | boolean
)

site_assets (
  asset_key: hero_banner | logo | promo_1 | ...
  file_path: storage path
  public_url: CDN URL
  file_size, mime_type, width, height
)
```

### Storage Bucket
- **Bucket név:** `site-assets`
- **Public:** ✅ Yes
- **RLS:** ✅ Authenticated users can upload/update

### Frontend Használat
```typescript
import { useSiteContent } from '../contexts/SiteContentContext';

function MyComponent() {
  const { content, loading } = useSiteContent();

  return (
    <div>
      <h1>{content.hero.title}</h1>
      <img src={content.hero.bannerImage} />
    </div>
  );
}
```

---

## Támogatás

Kérdés esetén:
- 📧 Email: admin@webshop.hu
- 📞 Telefon: +36 20 123 4567

**Dokumentáció frissítve:** 2025-01-06
