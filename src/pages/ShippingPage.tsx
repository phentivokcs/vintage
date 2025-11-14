export default function ShippingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Szállítási információk</h1>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Szállítási módok</h2>
          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <h3 className="text-xl font-semibold mb-2">Packeta csomagpont</h3>
            <p className="text-gray-700 mb-2">
              Szállítási díj: <strong>990 Ft</strong>
            </p>
            <p className="text-gray-700 mb-2">
              Szállítási idő: <strong>2-4 munkanap</strong>
            </p>
            <p className="text-gray-600">
              Válassz több mint 2000 csomagpont közül országszerte. A csomag átadásakor SMS és email értesítést küldünk.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Házhozszállítás</h3>
            <p className="text-gray-700 mb-2">
              Szállítási díj: <strong>1490 Ft</strong>
            </p>
            <p className="text-gray-700 mb-2">
              Szállítási idő: <strong>2-4 munkanap</strong>
            </p>
            <p className="text-gray-600">
              Kényelmes házhozszállítás a megadott címre. A futár telefonon egyeztet az átadás időpontjáról.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Ingyenes szállítás</h2>
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
            <p className="text-gray-700">
              <strong>15 000 Ft feletti rendelés esetén a szállítás ingyenes!</strong>
            </p>
            <p className="text-gray-600 mt-2">
              Az ingyenes szállítás mindkét szállítási módra vonatkozik.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Szállítási területek</h2>
          <p className="text-gray-700 mb-4">
            Jelenleg Magyarország területére szállítunk. A csomag átvételekor személyazonosság igazolása szükséges.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Nyomon követés</h2>
          <p className="text-gray-700 mb-4">
            Rendelésed feladását követően email-ben küldjük a követési számot, amellyel nyomon követheted a csomag útját.
          </p>
          <p className="text-gray-700">
            A fiókodban is megtalálod az összes rendelésed státuszát és követési információit.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Kérdésed van?</h2>
          <p className="text-gray-700">
            Ha bármilyen kérdésed van a szállítással kapcsolatban, lépj velünk kapcsolatba ügyfélszolgálatunkon.
          </p>
        </section>
      </div>
    </div>
  );
}
