export default function ReturnsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Visszaküldési és csere információk</h1>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">14 napos elállási jog</h2>
          <p className="text-gray-700 mb-4">
            A fogyasztóvédelmi törvény szerint 14 napon belül indoklás nélkül elállhatsz a vásárlástól.
          </p>
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
            <p className="text-gray-700">
              <strong>Fontos:</strong> A termék csak akkor küldhető vissza, ha:
            </p>
            <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1">
              <li>Eredeti csomagolásában van</li>
              <li>Címkéi sértetlenek</li>
              <li>Nem viselt állapotú</li>
              <li>Tiszta és szagtalan</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Visszaküldés menete</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>
              <strong>Jelentkezz be a fiókodba</strong> és nyisd meg a rendelésed részleteit
            </li>
            <li>
              <strong>Jelöld meg</strong> a visszaküldeni kívánt termékeket
            </li>
            <li>
              <strong>Kérj visszaküldési kódot</strong> az online felületen
            </li>
            <li>
              <strong>Csomagold vissza</strong> a terméket eredeti állapotban
            </li>
            <li>
              <strong>Küldd vissza</strong> a megadott címre
            </li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Visszaküldési cím</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700">
              <strong>Péntek Dávid EV</strong><br />
              8446 Kislőd<br />
              Bocskay utca 14.<br />
              Magyarország
            </p>
            <p className="text-gray-600 mt-4">
              A csomagra kérjük írd rá a visszaküldési kódot!
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Visszatérítés</h2>
          <p className="text-gray-700 mb-4">
            A termék beérkezését és ellenőrzését követően <strong>5 munkanapon belül</strong> visszautaljuk a vételárat az eredeti fizetési módra.
          </p>
          <p className="text-gray-700 mb-4">
            A visszaküldés díját nem áll módunkban megtéríteni, kivéve ha hibás vagy nem megfelelő terméket kaptál.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Csere</h2>
          <p className="text-gray-700 mb-4">
            Ha cserére van szükséged (például méret vagy szín miatt), kérjük küld vissza az eredeti terméket, és adj le egy új rendelést a kívánt változatra.
          </p>
          <p className="text-gray-700">
            Ez biztosítja, hogy a leggyorsabban megkapd az új terméket.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Hibás termék</h2>
          <p className="text-gray-700 mb-4">
            Ha hibás vagy sérült terméket kaptál, azonnal vedd fel velünk a kapcsolatot!
          </p>
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
            <p className="text-gray-700">
              Hibás termék esetén:
            </p>
            <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1">
              <li>A visszaküldés díját mi álljuk</li>
              <li>Azonnal cserélünk vagy visszatérítünk</li>
              <li>Készíts fotót a hibáról segítségképp</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Kapcsolat</h2>
          <p className="text-gray-700">
            Kérdés esetén keress minket bizalommal az ügyfélszolgálaton keresztül.
          </p>
        </section>
      </div>
    </div>
  );
}
