import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, Save, RotateCcw, ImageIcon, AlertCircle, Check, Trash2 } from 'lucide-react';

interface ContentSection {
  id: string;
  section: string;
  key: string;
  value: any;
  content_type: string;
}

interface Asset {
  id: string;
  asset_key: string;
  public_url: string;
  file_size?: number;
  mime_type?: string;
}

export default function ContentManagement() {
  const [activeTab, setActiveTab] = useState<'hero' | 'promo' | 'category' | 'footer' | 'seo' | 'newsletter' | 'design'>('hero');
  const [content, setContent] = useState<Record<string, ContentSection>>({});
  const [assets, setAssets] = useState<Record<string, Asset>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const [contentData, assetsData] = await Promise.all([
        supabase.from('site_content').select('*'),
        supabase.from('site_assets').select('*'),
      ]);

      if (contentData.data) {
        const contentMap: Record<string, ContentSection> = {};
        contentData.data.forEach((item: any) => {
          contentMap[`${item.section}.${item.key}`] = item;
        });
        setContent(contentMap);
      }

      if (assetsData.data) {
        const assetsMap: Record<string, Asset> = {};
        assetsData.data.forEach((asset: any) => {
          assetsMap[asset.asset_key] = asset;
        });
        setAssets(assetsMap);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      showMessage('error', 'Hiba történt a tartalom betöltése közben');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getValue = (section: string, key: string, defaultValue: any = '') => {
    const item = content[`${section}.${key}`];
    if (!item) return defaultValue;

    if (item.content_type === 'json' && item.value?.hu) return item.value.hu;
    if (item.content_type === 'boolean' && item.value?.value !== undefined) return item.value.value;
    if (item.content_type === 'color' && item.value?.value) return item.value.value;
    if (item.content_type === 'url' && item.value?.value !== undefined) return item.value.value;
    if (item.content_type === 'text' && item.value?.value !== undefined) return item.value.value;
    return item.value;
  };

  const updateValue = (section: string, key: string, value: any, contentType: string = 'json') => {
    let formattedValue;
    if (contentType === 'json') {
      formattedValue = { hu: value };
    } else if (contentType === 'boolean') {
      formattedValue = { value };
    } else if (contentType === 'color' || contentType === 'url' || contentType === 'text') {
      formattedValue = { value };
    } else {
      formattedValue = value;
    }

    setContent(prev => ({
      ...prev,
      [`${section}.${key}`]: {
        ...prev[`${section}.${key}`],
        section,
        key,
        value: formattedValue,
        content_type: contentType,
      },
    }));
  };

  const handleImageUpload = async (assetKey: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Csak képfájlokat lehet feltölteni');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'A fájl mérete nem lehet nagyobb 5 MB-nál');
      return;
    }

    setUploading(prev => ({ ...prev, [assetKey]: true }));

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${assetKey}-${Date.now()}.${fileExt}`;
      const filePath = `site-assets/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      const { error: assetError } = await supabase
        .from('site_assets')
        .upsert({
          asset_key: assetKey,
          file_path: filePath,
          public_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
        }, { onConflict: 'asset_key' });

      if (assetError) throw assetError;

      setAssets(prev => ({
        ...prev,
        [assetKey]: {
          id: '',
          asset_key: assetKey,
          public_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
        },
      }));

      showMessage('success', 'Kép sikeresen feltöltve');
    } catch (error: any) {
      console.error('Upload error:', error);
      showMessage('error', `Feltöltési hiba: ${error.message}`);
    } finally {
      setUploading(prev => ({ ...prev, [assetKey]: false }));
    }
  };

  const handleImageDelete = async (assetKey: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a képet?')) return;

    try {
      const asset = assets[assetKey];
      if (!asset) return;

      const { error: storageError } = await supabase.storage
        .from('site-assets')
        .remove([asset.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('site_assets')
        .delete()
        .eq('asset_key', assetKey);

      if (dbError) throw dbError;

      setAssets(prev => {
        const newAssets = { ...prev };
        delete newAssets[assetKey];
        return newAssets;
      });

      showMessage('success', 'Kép sikeresen törölve');
    } catch (error: any) {
      console.error('Delete error:', error);
      showMessage('error', `Törlési hiba: ${error.message}`);
    }
  };

  const saveSection = async () => {
    setSaving(true);
    try {
      const sectionContent = Object.values(content).filter(
        item => item.section === activeTab
      );

      const updates = sectionContent.map(item => ({
        section: item.section,
        key: item.key,
        value: item.value,
        content_type: item.content_type,
      }));

      const { error } = await supabase
        .from('site_content')
        .upsert(updates, { onConflict: 'section,key' });

      if (error) throw error;

      localStorage.removeItem('site_content');
      localStorage.removeItem('site_content_timestamp');

      showMessage('success', 'Módosítások sikeresen elmentve');
      await loadContent();
    } catch (error: any) {
      console.error('Save error:', error);
      showMessage('error', `Mentési hiba: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetSection = async () => {
    if (!confirm('Biztosan vissza szeretnéd állítani az alapértelmezett értékeket?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_content')
        .delete()
        .eq('section', activeTab);

      if (error) throw error;

      showMessage('success', 'Alapértelmezett értékek visszaállítva');
      await loadContent();
    } catch (error: any) {
      console.error('Reset error:', error);
      showMessage('error', `Hiba történt: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Tartalom betöltése...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'hero', label: 'Főoldal' },
            { id: 'promo', label: 'Promóciók' },
            { id: 'category', label: 'Kategóriák' },
            { id: 'footer', label: 'Lábléc' },
            { id: 'seo', label: 'SEO' },
            { id: 'newsletter', label: 'Hírlevel' },
            { id: 'design', label: 'Design' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'hero' && (
          <HeroSection
            getValue={getValue}
            updateValue={updateValue}
            assets={assets}
            handleImageUpload={handleImageUpload}
            handleImageDelete={handleImageDelete}
            uploading={uploading}
          />
        )}
        {activeTab === 'promo' && (
          <PromoSection
            getValue={getValue}
            updateValue={updateValue}
            assets={assets}
            handleImageUpload={handleImageUpload}
            handleImageDelete={handleImageDelete}
            uploading={uploading}
          />
        )}
        {activeTab === 'category' && (
          <CategorySection
            getValue={getValue}
            updateValue={updateValue}
            assets={assets}
            handleImageUpload={handleImageUpload}
            handleImageDelete={handleImageDelete}
            uploading={uploading}
          />
        )}
        {activeTab === 'footer' && (
          <FooterSection getValue={getValue} updateValue={updateValue} />
        )}
        {activeTab === 'seo' && (
          <SEOSection
            getValue={getValue}
            updateValue={updateValue}
            assets={assets}
            handleImageUpload={handleImageUpload}
            handleImageDelete={handleImageDelete}
            uploading={uploading}
          />
        )}
        {activeTab === 'newsletter' && (
          <NewsletterSection getValue={getValue} updateValue={updateValue} />
        )}
        {activeTab === 'design' && (
          <DesignSection
            getValue={getValue}
            updateValue={updateValue}
            assets={assets}
            handleImageUpload={handleImageUpload}
            handleImageDelete={handleImageDelete}
            uploading={uploading}
          />
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={resetSection}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Alaphelyzet
          </button>
          <button
            onClick={saveSection}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Mentés...' : 'Mentés'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageUpload({
  assetKey,
  currentUrl,
  onUpload,
  onDelete,
  uploading
}: {
  assetKey: string;
  currentUrl?: string;
  onUpload: (key: string, file: File) => void;
  onDelete?: (key: string) => void;
  uploading: boolean;
}) {
  return (
    <div className="space-y-2">
      {currentUrl && (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden group">
          <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
          {onDelete && (
            <button
              onClick={() => onDelete(assetKey)}
              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
              title="Kép törlése"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      <label className="block">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(assetKey, file);
          }}
          className="hidden"
          disabled={uploading}
        />
        <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors ${uploading ? 'opacity-50' : ''}`}>
          {uploading ? (
            <div className="text-gray-600">Feltöltés...</div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <div className="text-sm text-gray-600">
                Kattints ide vagy húzd ide a képet
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Max 5 MB, JPG, PNG, WEBP
              </div>
            </>
          )}
        </div>
      </label>
    </div>
  );
}

function HeroSection({ getValue, updateValue, assets, handleImageUpload, handleImageDelete, uploading }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Főoldali Hero Banner</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Banner Kép
        </label>
        <ImageUpload
          assetKey="hero_banner"
          currentUrl={assets.hero_banner?.public_url}
          onUpload={handleImageUpload}
          onDelete={handleImageDelete}
          uploading={uploading.hero_banner}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fő Cím
        </label>
        <input
          type="text"
          value={getValue('hero', 'title')}
          onChange={(e) => updateValue('hero', 'title', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Fenntartható Divat, Egyedi Stílus"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Alcím
        </label>
        <textarea
          value={getValue('hero', 'subtitle')}
          onChange={(e) => updateValue('hero', 'subtitle', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Fedezd fel gondosan válogatott használt ruháinkat..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gomb Szöveg
          </label>
          <input
            type="text"
            value={getValue('hero', 'cta_text')}
            onChange={(e) => updateValue('hero', 'cta_text', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Böngészés"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gomb Link
          </label>
          <input
            type="text"
            value={getValue('hero', 'cta_link')}
            onChange={(e) => updateValue('hero', 'cta_link', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="/products"
          />
        </div>
      </div>
    </div>
  );
}

function PromoSection({ getValue, updateValue, assets, handleImageUpload, handleImageDelete, uploading }: any) {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Promóciós Bannerek</h2>

      {[1, 2, 3].map((num) => (
        <div key={num} className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Promó Banner #{num}</h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={getValue('promo', `banner_${num}_active`, false)}
                onChange={(e) => updateValue('promo', `banner_${num}_active`, e.target.checked, 'boolean')}
                className="rounded"
              />
              <span className="text-sm">Aktív</span>
            </label>
          </div>

          <ImageUpload
            assetKey={`promo_${num}`}
            currentUrl={assets[`promo_${num}`]?.public_url}
            onUpload={handleImageUpload}
            onDelete={handleImageDelete}
            uploading={uploading[`promo_${num}`]}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cím
            </label>
            <input
              type="text"
              value={getValue('promo', `banner_${num}_title`)}
              onChange={(e) => updateValue('promo', `banner_${num}_title`, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link
            </label>
            <input
              type="text"
              value={getValue('promo', `banner_${num}_link`)}
              onChange={(e) => updateValue('promo', `banner_${num}_link`, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="/products?sort=newest"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CategorySection({ getValue, updateValue, assets, handleImageUpload, handleImageDelete, uploading }: any) {
  const categoryConfigs = [
    { key: 'men', title: 'Férfi Ruházat (Header)', hasLink: false },
    { key: 'women', title: 'Női Ruházat (Header)', hasLink: false },
    { key: 'tops', title: 'Felsők Kategória', hasLink: true },
    { key: 'accessories', title: 'Kiegészítők Kategória', hasLink: true },
    { key: 'shoes', title: 'Cipők & Táskák Kategória', hasLink: true },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Kategória Képek és Szövegek</h2>

      {categoryConfigs.map((config) => (
        <div key={config.key} className="border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-medium">{config.title}</h3>

          <ImageUpload
            assetKey={`category_${config.key}`}
            currentUrl={assets[`category_${config.key}`]?.public_url}
            onUpload={handleImageUpload}
            onDelete={handleImageDelete}
            uploading={uploading[`category_${config.key}`]}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cím
            </label>
            <input
              type="text"
              value={getValue('category', `${config.key}_title`)}
              onChange={(e) => updateValue('category', `${config.key}_title`, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leírás
            </label>
            <textarea
              value={getValue('category', `${config.key}_description`)}
              onChange={(e) => updateValue('category', `${config.key}_description`, e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {config.hasLink && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link
              </label>
              <input
                type="text"
                value={getValue('category', `${config.key}_link`)}
                onChange={(e) => updateValue('category', `${config.key}_link`, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="/kategoria/felsok"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FooterSection({ getValue, updateValue }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Lábléc Beállítások</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Üzlet Neve
          </label>
          <input
            type="text"
            value={getValue('footer', 'shop_name')}
            onChange={(e) => updateValue('footer', 'shop_name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={getValue('footer', 'email')}
            onChange={(e) => updateValue('footer', 'email', e.target.value, 'text')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rövid Leírás
        </label>
        <textarea
          value={getValue('footer', 'shop_description')}
          onChange={(e) => updateValue('footer', 'shop_description', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefon
          </label>
          <input
            type="tel"
            value={getValue('footer', 'phone')}
            onChange={(e) => updateValue('footer', 'phone', e.target.value, 'text')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cím
          </label>
          <input
            type="text"
            value={getValue('footer', 'address')}
            onChange={(e) => updateValue('footer', 'address', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Social Media Linkek</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facebook
            </label>
            <input
              type="url"
              value={getValue('footer', 'facebook_url')}
              onChange={(e) => updateValue('footer', 'facebook_url', e.target.value, 'url')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="https://facebook.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instagram
            </label>
            <input
              type="url"
              value={getValue('footer', 'instagram_url')}
              onChange={(e) => updateValue('footer', 'instagram_url', e.target.value, 'url')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="https://instagram.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TikTok
            </label>
            <input
              type="url"
              value={getValue('footer', 'tiktok_url')}
              onChange={(e) => updateValue('footer', 'tiktok_url', e.target.value, 'url')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="https://tiktok.com/@..."
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rólunk Szöveg
        </label>
        <textarea
          value={getValue('footer', 'about_text')}
          onChange={(e) => updateValue('footer', 'about_text', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Copyright Szöveg
        </label>
        <input
          type="text"
          value={getValue('footer', 'copyright')}
          onChange={(e) => updateValue('footer', 'copyright', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>
    </div>
  );
}

function SEOSection({ getValue, updateValue, assets, handleImageUpload, handleImageDelete, uploading }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">SEO Beállítások</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Meta Title
        </label>
        <input
          type="text"
          value={getValue('seo', 'meta_title')}
          onChange={(e) => updateValue('seo', 'meta_title', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          maxLength={60}
        />
        <div className="text-xs text-gray-500 mt-1">
          {getValue('seo', 'meta_title', '').length}/60 karakter
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Meta Description
        </label>
        <textarea
          value={getValue('seo', 'meta_description')}
          onChange={(e) => updateValue('seo', 'meta_description', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          maxLength={160}
        />
        <div className="text-xs text-gray-500 mt-1">
          {getValue('seo', 'meta_description', '').length}/160 karakter
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kulcsszavak (vesszővel elválasztva)
        </label>
        <input
          type="text"
          value={getValue('seo', 'meta_keywords')}
          onChange={(e) => updateValue('seo', 'meta_keywords', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Open Graph Title
        </label>
        <input
          type="text"
          value={getValue('seo', 'og_title')}
          onChange={(e) => updateValue('seo', 'og_title', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Open Graph Description
        </label>
        <textarea
          value={getValue('seo', 'og_description')}
          onChange={(e) => updateValue('seo', 'og_description', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Open Graph Kép (1200x630 px ajánlott)
        </label>
        <ImageUpload
          assetKey="og_image"
          currentUrl={assets.og_image?.public_url}
          onUpload={handleImageUpload}
          onDelete={handleImageDelete}
          uploading={uploading.og_image}
        />
      </div>
    </div>
  );
}

function NewsletterSection({ getValue, updateValue }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Hírlevel Beállítások</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cím
        </label>
        <input
          type="text"
          value={getValue('newsletter', 'title')}
          onChange={(e) => updateValue('newsletter', 'title', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Leírás
        </label>
        <textarea
          value={getValue('newsletter', 'description')}
          onChange={(e) => updateValue('newsletter', 'description', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gomb Szöveg
          </label>
          <input
            type="text"
            value={getValue('newsletter', 'button_text')}
            onChange={(e) => updateValue('newsletter', 'button_text', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Placeholder
          </label>
          <input
            type="text"
            value={getValue('newsletter', 'placeholder')}
            onChange={(e) => updateValue('newsletter', 'placeholder', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sikeres Feliratkozás Üzenet
        </label>
        <textarea
          value={getValue('newsletter', 'success_message')}
          onChange={(e) => updateValue('newsletter', 'success_message', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Adatvédelmi Szöveg
        </label>
        <textarea
          value={getValue('newsletter', 'privacy_text')}
          onChange={(e) => updateValue('newsletter', 'privacy_text', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>
    </div>
  );
}

function DesignSection({ getValue, updateValue, assets, handleImageUpload, handleImageDelete, uploading }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Design Elemek</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logó
        </label>
        <ImageUpload
          assetKey="logo"
          currentUrl={assets.logo?.public_url}
          onUpload={handleImageUpload}
          onDelete={handleImageDelete}
          uploading={uploading.logo}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Felsők Méretmutató Kép
          </label>
          <ImageUpload
            assetKey="size_guide_tops"
            currentUrl={assets.size_guide_tops?.public_url}
            onUpload={handleImageUpload}
            onDelete={handleImageDelete}
            uploading={uploading.size_guide_tops}
          />
          <p className="text-xs text-gray-500 mt-1">
            Ez jelenik meg a felsők (hoodie, sweater, jacket, polo, shirt) mérettáblázatánál
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nadrágok Méretmutató Kép
          </label>
          <ImageUpload
            assetKey="size_guide_pants"
            currentUrl={assets.size_guide_pants?.public_url}
            onUpload={handleImageUpload}
            onDelete={handleImageDelete}
            uploading={uploading.size_guide_pants}
          />
          <p className="text-xs text-gray-500 mt-1">
            Ez jelenik meg a nadrágok mérettáblázatánál
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Elsődleges Szín
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={getValue('design', 'primary_color', '#2563eb')}
              onChange={(e) => updateValue('design', 'primary_color', e.target.value, 'color')}
              className="h-10 w-20"
            />
            <input
              type="text"
              value={getValue('design', 'primary_color', '#2563eb')}
              onChange={(e) => updateValue('design', 'primary_color', e.target.value, 'color')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Másodlagos Szín
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={getValue('design', 'secondary_color', '#7c3aed')}
              onChange={(e) => updateValue('design', 'secondary_color', e.target.value, 'color')}
              className="h-10 w-20"
            />
            <input
              type="text"
              value={getValue('design', 'secondary_color', '#7c3aed')}
              onChange={(e) => updateValue('design', 'secondary_color', e.target.value, 'color')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kiemelő Szín
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={getValue('design', 'accent_color', '#f59e0b')}
              onChange={(e) => updateValue('design', 'accent_color', e.target.value, 'color')}
              className="h-10 w-20"
            />
            <input
              type="text"
              value={getValue('design', 'accent_color', '#f59e0b')}
              onChange={(e) => updateValue('design', 'accent_color', e.target.value, 'color')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Siker Szín
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={getValue('design', 'success_color', '#10b981')}
              onChange={(e) => updateValue('design', 'success_color', e.target.value, 'color')}
              className="h-10 w-20"
            />
            <input
              type="text"
              value={getValue('design', 'success_color', '#10b981')}
              onChange={(e) => updateValue('design', 'success_color', e.target.value, 'color')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hiba Szín
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={getValue('design', 'error_color', '#ef4444')}
              onChange={(e) => updateValue('design', 'error_color', e.target.value, 'color')}
              className="h-10 w-20"
            />
            <input
              type="text"
              value={getValue('design', 'error_color', '#ef4444')}
              onChange={(e) => updateValue('design', 'error_color', e.target.value, 'color')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
