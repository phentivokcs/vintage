import { useState, useRef, useEffect } from 'react';
import { Camera, Ruler, Mic, MicOff, Check, X, Bluetooth } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Category = 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'accessories';

interface MeasurementField {
  name: string;
  label: string;
  unit: string;
}

const categoryMeasurements: Record<Category, MeasurementField[]> = {
  tops: [
    { name: 'chest_width', label: 'Mellbőség', unit: 'cm' },
    { name: 'length', label: 'Hosszúság', unit: 'cm' },
    { name: 'shoulder_width', label: 'Válltól vállig', unit: 'cm' },
    { name: 'sleeve_length', label: 'Ujjhossz', unit: 'cm' }
  ],
  bottoms: [
    { name: 'waist', label: 'Derékbőség', unit: 'cm' },
    { name: 'length', label: 'Hosszúság', unit: 'cm' },
    { name: 'inseam', label: 'Belső varrás', unit: 'cm' },
    { name: 'hip_width', label: 'Csípőbőség', unit: 'cm' }
  ],
  dresses: [
    { name: 'chest_width', label: 'Mellbőség', unit: 'cm' },
    { name: 'waist', label: 'Derékbőség', unit: 'cm' },
    { name: 'length', label: 'Hosszúság', unit: 'cm' },
    { name: 'shoulder_width', label: 'Válltól vállig', unit: 'cm' }
  ],
  outerwear: [
    { name: 'chest_width', label: 'Mellbőség', unit: 'cm' },
    { name: 'length', label: 'Hosszúság', unit: 'cm' },
    { name: 'shoulder_width', label: 'Válltól vállig', unit: 'cm' },
    { name: 'sleeve_length', label: 'Ujjhossz', unit: 'cm' }
  ],
  accessories: []
};

export default function QuickUpload() {
  const [category, setCategory] = useState<Category>('tops');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<'excellent' | 'good' | 'fair'>('good');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [activeMeasurement, setActiveMeasurement] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [btDevice, setBtDevice] = useState<BluetoothDevice | null>(null);
  const [btConnected, setBtConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'hu-HU';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDescription(prev => prev + ' ' + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      alert('Kamera hozzáférés sikertelen');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setImages(prev => [...prev, file]);
            const preview = URL.createObjectURL(blob);
            setImagePreviews(prev => [...prev, preview]);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
    files.forEach(file => {
      const preview = URL.createObjectURL(file);
      setImagePreviews(prev => [...prev, preview]);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const connectBluetooth = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service']
      });
      setBtDevice(device);
      setBtConnected(true);

      alert('BT eszköz csatlakoztatva! (Demo mód - valós mérőszalag integráció fejlesztés alatt)');
    } catch (err) {
      alert('Bluetooth csatlakozás sikertelen');
    }
  };

  const handleMeasurementInput = (field: string, value: string) => {
    setMeasurements(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const imageUrls: string[] = [];

      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        imageUrls.push(publicUrl);
      }

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name,
          category,
          price: parseFloat(price),
          description,
          images: imageUrls,
          status: 'available'
        })
        .select()
        .single();

      if (productError) throw productError;

      const { error: variantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: product.id,
          size: 'Egyedi',
          condition,
          condition_details: JSON.stringify(measurements),
          stock: 1,
          status: 'available'
        });

      if (variantError) throw variantError;

      setSuccess(true);
      setTimeout(() => {
        setName('');
        setPrice('');
        setDescription('');
        setImages([]);
        setImagePreviews([]);
        setMeasurements({});
        setSuccess(false);
      }, 2000);

    } catch (err) {
      console.error('Feltöltési hiba:', err);
      alert('Hiba történt a feltöltés során');
    } finally {
      setLoading(false);
    }
  };

  const currentMeasurements = categoryMeasurements[category];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gyors Feltöltés</h2>
          {btConnected && (
            <div className="flex items-center gap-2 text-green-600">
              <Bluetooth className="w-5 h-5" />
              <span className="text-sm">Csatlakoztatva</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Kategória
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['tops', 'bottoms', 'dresses', 'outerwear', 'accessories'] as Category[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-4 px-6 rounded-lg text-lg font-medium transition-colors ${
                    category === cat
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'tops' && 'Felsők'}
                  {cat === 'bottoms' && 'Alsók'}
                  {cat === 'dresses' && 'Ruhák'}
                  {cat === 'outerwear' && 'Kabátok'}
                  {cat === 'accessories' && 'Kiegészítők'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Fotók
            </label>

            {!cameraActive ? (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={startCamera}
                  className="py-4 px-6 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 text-lg"
                >
                  <Camera className="w-6 h-6" />
                  Kamera
                </button>
                <label className="py-4 px-6 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 text-lg cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  Galéria
                </label>
              </div>
            ) : (
              <div className="mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg mb-3"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="py-4 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg"
                  >
                    Készít
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="py-4 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 text-lg"
                  >
                    Bezár
                  </button>
                </div>
              </div>
            )}

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Termék neve
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
              placeholder="pl. Vintage Tommy Hilfiger pulóver"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Ár (Ft)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
              placeholder="8990"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Állapot
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['excellent', 'good', 'fair'] as const).map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => setCondition(cond)}
                  className={`py-4 px-6 rounded-lg text-lg font-medium transition-colors ${
                    condition === cond
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cond === 'excellent' && 'Kiváló'}
                  {cond === 'good' && 'Jó'}
                  {cond === 'fair' && 'Elfogadható'}
                </button>
              ))}
            </div>
          </div>

          {currentMeasurements.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-lg font-semibold text-gray-900">
                  Méretek
                </label>
                {!btConnected && (
                  <button
                    type="button"
                    onClick={connectBluetooth}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Bluetooth className="w-4 h-4" />
                    BT Mérőszalag
                  </button>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Ruler className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">Mérési útmutató:</p>
                    <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                      {currentMeasurements.map((field) => (
                        <li key={field.name}>• {field.label}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {currentMeasurements.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        value={measurements[field.name] || ''}
                        onChange={(e) => handleMeasurementInput(field.name, e.target.value)}
                        onFocus={() => setActiveMeasurement(field.name)}
                        className={`flex-1 px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-gray-900 ${
                          activeMeasurement === field.name ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        placeholder="0"
                      />
                      <span className="text-gray-600 font-medium">{field.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Leírás
            </label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                placeholder="Termék részletes leírása..."
              />
              {recognitionRef.current && (
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`absolute bottom-3 right-3 p-3 rounded-full ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || images.length === 0}
            className={`w-full py-5 text-xl font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              loading || images.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : success
                ? 'bg-green-600 text-white'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {loading ? (
              'Feltöltés...'
            ) : success ? (
              <>
                <Check className="w-6 h-6" />
                Sikeres!
              </>
            ) : (
              'Termék mentése'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
