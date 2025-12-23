import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportRow {
  sku: string;
  title: string;
  brand?: string;
  category?: string;
  gender: string;
  clothingType: string;
  size: string;
  color?: string;
  condition: string;
  price: number;
  stock: number;
  description?: string;
  chestWidth?: string;
  waistWidth?: string;
  hipWidth?: string;
  shoulderWidth?: string;
  sleeveLength?: string;
  totalLength?: string;
  imageUrl1?: string;
  imageUrl2?: string;
  imageUrl3?: string;
}

export default function BulkImport() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csv = `SKU,Termék neve,Márka,Kategória,Nem,Ruha típus,Méret,Szín,Állapot,Ár,Készlet,Leírás,Mellbőség,Derékbőség,Csípőbőség,Vállszélesség,Ujjhossz,Teljes hossz,Kép URL 1,Kép URL 2,Kép URL 3
POLO-001,Nike sportpóló,Nike,Pólók,men,polo,M,Fekete,excellent,5990,1,Kiváló állapotú sportpóló,52,44,48,44,62,72,https://example.com/image1.jpg,,
JACKET-001,Adidas dzseki,Adidas,Kabátok,women,jacket,L,Kék,good,12990,2,Meleg téli dzseki,56,48,52,46,64,75,https://example.com/image2.jpg,https://example.com/image3.jpg,`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'termek_import_sablon.csv';
    link.click();
  };

  const parseCSV = (text: string): ImportRow[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    const headers = lines[0].split(',').map((h) => h.trim());

    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        if (!value) return;

        switch (header) {
          case 'SKU':
            row.sku = value;
            break;
          case 'Termék neve':
            row.title = value;
            break;
          case 'Márka':
            row.brand = value;
            break;
          case 'Kategória':
            row.category = value;
            break;
          case 'Nem':
            row.gender = value;
            break;
          case 'Ruha típus':
            row.clothingType = value;
            break;
          case 'Méret':
            row.size = value;
            break;
          case 'Szín':
            row.color = value;
            break;
          case 'Állapot':
            row.condition = value;
            break;
          case 'Ár':
            row.price = parseFloat(value);
            break;
          case 'Készlet':
            row.stock = parseInt(value);
            break;
          case 'Leírás':
            row.description = value;
            break;
          case 'Mellbőség':
            row.chestWidth = value;
            break;
          case 'Derékbőség':
            row.waistWidth = value;
            break;
          case 'Csípőbőség':
            row.hipWidth = value;
            break;
          case 'Vállszélesség':
            row.shoulderWidth = value;
            break;
          case 'Ujjhossz':
            row.sleeveLength = value;
            break;
          case 'Teljes hossz':
            row.totalLength = value;
            break;
          case 'Kép URL 1':
            row.imageUrl1 = value;
            break;
          case 'Kép URL 2':
            row.imageUrl2 = value;
            break;
          case 'Kép URL 3':
            row.imageUrl3 = value;
            break;
        }
      });

      return row;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResults({ success: 0, failed: 0, errors: [] });

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const row of rows) {
        try {
          let brandId = null;
          if (row.brand) {
            const { data: brand } = await supabase
              .from('brands')
              .select('id')
              .ilike('name', row.brand)
              .single();

            if (!brand) {
              const { data: newBrand } = await supabase
                .from('brands')
                .insert({
                  name: row.brand,
                  slug: row.brand.toLowerCase().replace(/\s+/g, '-'),
                })
                .select()
                .single();

              brandId = newBrand?.id;
            } else {
              brandId = brand.id;
            }
          }

          let categoryId = null;
          if (row.category) {
            const { data: category } = await supabase
              .from('categories')
              .select('id')
              .ilike('name', row.category)
              .single();

            if (!category) {
              const { data: newCategory } = await supabase
                .from('categories')
                .insert({
                  name: row.category,
                  slug: row.category.toLowerCase().replace(/\s+/g, '-'),
                })
                .select()
                .single();

              categoryId = newCategory?.id;
            } else {
              categoryId = category.id;
            }
          }

          const { data: product, error: productError } = await supabase
            .from('products')
            .insert({
              brand_id: brandId,
              category_id: categoryId,
              title: row.title,
              description: row.description || '',
              status: 'active',
            })
            .select()
            .single();

          if (productError) throw productError;

          const imageUrls: string[] = [];
          if (row.imageUrl1) imageUrls.push(row.imageUrl1);
          if (row.imageUrl2) imageUrls.push(row.imageUrl2);
          if (row.imageUrl3) imageUrls.push(row.imageUrl3);

          for (let i = 0; i < imageUrls.length; i++) {
            await supabase.from('product_images').insert({
              product_id: product.id,
              url: imageUrls[i],
              sort_order: i,
              is_primary: i === 0,
            });
          }

          const attributes: any = {
            size: row.size,
            condition: row.condition,
            gender: row.gender,
            clothing_type: row.clothingType,
          };

          if (row.color) attributes.color = row.color;
          if (row.chestWidth) attributes.chestWidth = row.chestWidth;
          if (row.waistWidth) attributes.waistWidth = row.waistWidth;
          if (row.hipWidth) attributes.hipWidth = row.hipWidth;
          if (row.shoulderWidth) attributes.shoulderWidth = row.shoulderWidth;
          if (row.sleeveLength) attributes.sleeveLength = row.sleeveLength;
          if (row.totalLength) attributes.totalLength = row.totalLength;

          const { error: variantError } = await supabase.from('variants').insert({
            product_id: product.id,
            sku: row.sku,
            price_gross: row.price,
            vat_rate: 27,
            attributes: attributes,
            stock_quantity: row.stock,
            status: 'active',
          });

          if (variantError) throw variantError;

          success++;
        } catch (error: any) {
          failed++;
          errors.push(`${row.sku || row.title}: ${error.message}`);
        }
      }

      setResults({ success, failed, errors });
    } catch (error: any) {
      alert('CSV feldolgozási hiba: ' + error.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Tömeges feltöltés lépései:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Töltsd le a CSV sablont</li>
          <li>Töltsd ki az Excel/CSV fájlt a termékinformációkkal</li>
          <li>Mentsd el CSV formátumban (UTF-8 kódolással)</li>
          <li>Töltsd fel a kitöltött fájlt</li>
        </ol>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-5 h-5" />
          Sablon letöltése
        </button>

        <label className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
          <Upload className="w-5 h-5" />
          CSV feltöltése
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={loading}
            className="hidden"
          />
        </label>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-gray-900 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Termékek importálása...</p>
          </div>
        </div>
      )}

      {!loading && (results.success > 0 || results.failed > 0) && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Sikeres: {results.success}</span>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Sikertelen: {results.failed}</span>
              </div>
            </div>
          </div>

          {results.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">Hibák:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                {results.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Mező leírások:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium">Kötelező mezők:</p>
            <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
              <li>SKU - egyedi azonosító</li>
              <li>Termék neve</li>
              <li>Nem: men, women, unisex, kids</li>
              <li>Ruha típus: polo, shirt, pants, jacket, sweater, hoodie, dress, skirt, shorts, hat, accessories</li>
              <li>Méret: pl. S, M, L, XL, 38, 40</li>
              <li>Állapot: new, excellent, good, fair</li>
              <li>Ár - forintban</li>
              <li>Készlet - darabszám</li>
            </ul>
          </div>

          <div>
            <p className="font-medium">Opcionális mezők:</p>
            <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
              <li>Márka, Kategória - automatikusan létrejön ha nem létezik</li>
              <li>Szín, Leírás</li>
              <li>Méretek cm-ben: Mellbőség, Derékbőség, Csípőbőség, Vállszélesség, Ujjhossz, Teljes hossz</li>
              <li>Kép URL 1-3 - képek URL-je (pl. https://...)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
