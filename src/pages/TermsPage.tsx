export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Általános Szerződési Feltételek</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-8">
          Utolsó frissítés: 2025. november 12.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Általános rendelkezések</h2>
          <p className="text-gray-700 mb-4">
            Jelen Általános Szerződési Feltételek (továbbiakban: ÁSZF) tartalmazzák a webshop működésének alapvető szabályait,
            a Szolgáltató és a Vásárló közötti jogviszonyt, jogokat és kötelezettségeket.
          </p>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700">
              <strong>Szolgáltató adatai:</strong><br />
              Név: Péntek Dávid EV<br />
              Székhely: 8446 Kislőd, Bocskay utca 14.<br />
              Adószám: 46362078-2-39<br />
              Email: info@vintagevibes.hu<br />
              Telefon: +36 30 123 4567
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. A szerződés tárgya</h2>
          <p className="text-gray-700 mb-4">
            A szerződés tárgya használt ruházati termékek online értékesítése a webshop felületén keresztül.
          </p>
          <p className="text-gray-700">
            A termékek jellemzőit, árait és elérhetőségét a weboldal termék oldalakon találod meg.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Rendelés menete</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>A vásárló kiválasztja a kívánt termékeket</li>
            <li>Kosárba helyezi őket</li>
            <li>Megadja a szállítási és számlázási adatokat</li>
            <li>Kiválasztja a fizetési és szállítási módot</li>
            <li>Visszaigazoló emailt kap a rendeléséről</li>
            <li>A fizetés beérkezése után feladjuk a csomagot</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Árak és fizetés</h2>
          <p className="text-gray-700 mb-4">
            A weboldal minden ára bruttó ár, tartalmazza az ÁFÁ-t. A szállítási díj a végösszeghez adódik hozzá.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Fizetési módok:</strong>
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Bankkártyás fizetés (Barion)</li>
            <li>Utánvét (készpénz a futárnál)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Szállítás</h2>
          <p className="text-gray-700 mb-4">
            A szállítási információkat a <a href="/szallitas" className="text-blue-600 hover:underline">Szállítási oldalon</a> találod meg részletesen.
          </p>
          <p className="text-gray-700">
            A szállítási határidők tájékoztató jellegűek, a pontos időpontokat a futárszolgálat határozza meg.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Elállási jog</h2>
          <p className="text-gray-700 mb-4">
            A fogyasztó a termék kézhezvételétől számított 14 napon belül indoklás nélkül elállhat a szerződéstől.
          </p>
          <p className="text-gray-700 mb-4">
            Részletes információk a <a href="/visszakuldés" className="text-blue-600 hover:underline">Visszaküldési oldalon</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Jótállás és szavatosság</h2>
          <p className="text-gray-700 mb-4">
            Használt termékek esetén nem vállalunk jótállást, de a fogyasztóvédelmi törvény szerinti szavatossági jogok érvényesek.
          </p>
          <p className="text-gray-700">
            Rejtett hibák esetén a Vásárló a vásárlástól számított 1 éven belül érvényesítheti szavatossági jogait.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Adatkezelés</h2>
          <p className="text-gray-700">
            Az adatkezelési tájékoztatót az <a href="/adatvedelem" className="text-blue-600 hover:underline">Adatvédelmi oldalon</a> találod meg.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Felelősség</h2>
          <p className="text-gray-700 mb-4">
            A Szolgáltató nem vállal felelősséget a weboldal működésében bekövetkező műszaki hibákért,
            amelyek a Vásárló eszközéből vagy internetkapcsolatából erednek.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Vitarendezés</h2>
          <p className="text-gray-700 mb-4">
            Amennyiben a Vásárló nem elégedett, először próbáljuk meg közvetlenül rendezni a vitát.
          </p>
          <p className="text-gray-700">
            Fogyasztói jogvita esetén a Vásárló jogosult a lakóhelye szerint illetékes békéltető testülethez fordulni.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Joghatóság</h2>
          <p className="text-gray-700">
            Jelen ÁSZF-re és a weboldal használatára a magyar jog az irányadó.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Egyéb rendelkezések</h2>
          <p className="text-gray-700">
            A Szolgáltató fenntartja a jogot az ÁSZF egyoldalú módosítására. A módosítások a közzététel napján lépnek hatályba.
          </p>
        </section>
      </div>
    </div>
  );
}
