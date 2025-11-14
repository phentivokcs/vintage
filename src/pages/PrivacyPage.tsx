export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Adatvédelmi nyilatkozat</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-8">
          Utolsó frissítés: 2025. november 12.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Bevezetés</h2>
          <p className="text-gray-700 mb-4">
            Köszönjük, hogy felkeresed weboldalunkat. Fontosnak tartjuk személyes adataid védelmét,
            ezért jelen tájékoztatóban részletesen ismertetjük, hogyan gyűjtjük, használjuk és védjük az adataidat.
          </p>
          <p className="text-gray-700">
            Adatkezelésünk megfelel a GDPR (Általános Adatvédelmi Rendelet) előírásainak.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Adatkezelő adatai</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700">
              <strong>Név:</strong> Péntek Dávid EV<br />
              <strong>Székhely:</strong> 8446 Kislőd, Bocskay utca 14.<br />
              <strong>Email:</strong> info@vintagevibes.hu<br />
              <strong>Adószám:</strong> 46362078-2-39
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Kezelt adatok köre</h2>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">3.1. Regisztráció során:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Email cím</li>
              <li>Jelszó (titkosítva tároljuk)</li>
              <li>Regisztráció időpontja</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">3.2. Rendelés során:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Név</li>
              <li>Szállítási cím</li>
              <li>Számlázási cím</li>
              <li>Telefonszám</li>
              <li>Email cím</li>
              <li>Rendelési előzmények</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">3.3. Automatikusan gyűjtött adatok:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>IP cím</li>
              <li>Böngésző típusa</li>
              <li>Operációs rendszer</li>
              <li>Látogatás időpontja</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Adatkezelés célja és jogalapja</h2>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Rendelések teljesítése</strong><br />
                Jogalap: Szerződés teljesítése<br />
                Megőrzés: 8 év (számviteli kötelezettség)
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Ügyfélszolgálat</strong><br />
                Jogalap: Jogos érdek<br />
                Megőrzés: A probléma megoldásáig
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Hírlevél küldése</strong><br />
                Jogalap: Önkéntes hozzájárulás<br />
                Megőrzés: A hozzájárulás visszavonásáig
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Adattovábbítás</h2>
          <p className="text-gray-700 mb-4">
            Adataidat csak az alábbi esetekben továbbítjuk harmadik félnek:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>
              <strong>Futárszolgálat:</strong> Név, cím, telefonszám a kézbesítéshez
            </li>
            <li>
              <strong>Fizetési szolgáltató (Barion):</strong> Fizetés lebonyolításához
            </li>
            <li>
              <strong>Számlázó rendszer (Billingo):</strong> Számla kiállításához
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Adatbiztonság</h2>
          <p className="text-gray-700 mb-4">
            Komoly lépéseket teszünk az adatok védelme érdekében:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>SSL titkosítás a weboldalon</li>
            <li>Jelszavak titkosított tárolása</li>
            <li>Rendszeres biztonsági mentések</li>
            <li>Hozzáférés-korlátozás</li>
            <li>Biztonságos adatbázis</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Érintetti jogok</h2>
          <p className="text-gray-700 mb-4">
            Jogosult vagy az alábbi jogok gyakorlására:
          </p>

          <div className="space-y-3">
            <div>
              <strong className="text-gray-900">Hozzáférési jog:</strong>
              <p className="text-gray-700">Tájékoztatást kérhetsz az általunk kezelt adataidról</p>
            </div>

            <div>
              <strong className="text-gray-900">Helyesbítéshez való jog:</strong>
              <p className="text-gray-700">Kérheted pontatlan adataid javítását</p>
            </div>

            <div>
              <strong className="text-gray-900">Törléshez való jog:</strong>
              <p className="text-gray-700">Kérheted adataid törlését (bizonyos feltételek mellett)</p>
            </div>

            <div>
              <strong className="text-gray-900">Adathordozhatósághoz való jog:</strong>
              <p className="text-gray-700">Kérheted adataid géppel olvasható formátumban</p>
            </div>

            <div>
              <strong className="text-gray-900">Tiltakozáshoz való jog:</strong>
              <p className="text-gray-700">Tiltakozhatsz adataid kezelése ellen</p>
            </div>
          </div>

          <p className="text-gray-700 mt-4">
            Jogaid gyakorlásához írj nekünk: <strong>info@vintagevibes.hu</strong>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Sütik (Cookies)</h2>
          <p className="text-gray-700 mb-4">
            Weboldalunk sütiket használ a felhasználói élmény javítása érdekében.
          </p>

          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700 mb-2">
              <strong>Feltétlenül szükséges sütik:</strong> Weboldal működéséhez
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Funkcionális sütik:</strong> Bejelentkezés, kosár megjegyzése
            </p>
            <p className="text-gray-700">
              <strong>Statisztikai sütik:</strong> Látogatottság mérése (hozzájárulás alapján)
            </p>
          </div>

          <p className="text-gray-700 mt-4">
            A sütiket bármikor törölheted a böngésző beállításaiban.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Panaszkezelés</h2>
          <p className="text-gray-700 mb-4">
            Ha úgy érzed, hogy megsértettük adatvédelmi jogaidat, panasszal fordulhatsz:
          </p>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700">
              <strong>Nemzeti Adatvédelmi és Információszabadság Hatóság</strong><br />
              Cím: 1055 Budapest, Falk Miksa utca 9-11.<br />
              Telefon: +36 1 391 1400<br />
              Email: ugyfelszolgalat@naih.hu<br />
              Web: <a href="https://www.naih.hu" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.naih.hu</a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Módosítások</h2>
          <p className="text-gray-700">
            Fenntartjuk a jogot jelen adatvédelmi nyilatkozat módosítására.
            A módosításokról weboldalunkon tájékoztatunk.
          </p>
        </section>
      </div>
    </div>
  );
}
