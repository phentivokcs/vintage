import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, MailOpen, Archive, Trash2, RefreshCw } from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'archived';
  created_at: string;
}

export default function ContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'archived'>('all');

  useEffect(() => {
    loadMessages();
  }, [filter]);

  async function loadMessages() {
    setLoading(true);

    let query = supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages(data || []);
    }

    setLoading(false);
  }

  async function updateStatus(id: string, status: 'new' | 'read' | 'archived') {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id);

    if (error) {
      alert('Hiba történt: ' + error.message);
    } else {
      loadMessages();
    }
  }

  async function deleteMessage(id: string) {
    if (!confirm('Biztosan törölni szeretnéd ezt az üzenetet?')) return;

    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Hiba történt: ' + error.message);
    } else {
      loadMessages();
    }
  }

  const newCount = messages.filter(m => m.status === 'new').length;

  if (loading) {
    return <div className="text-center py-8">Betöltés...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Kapcsolati üzenetek</h2>
          {newCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {newCount} új üzenet
            </p>
          )}
        </div>
        <button
          onClick={loadMessages}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw className="w-4 h-4" />
          Frissítés
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'all'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Összes ({messages.length})
        </button>
        <button
          onClick={() => setFilter('new')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'new'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Új ({messages.filter(m => m.status === 'new').length})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'read'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Olvasott ({messages.filter(m => m.status === 'read').length})
        </button>
        <button
          onClick={() => setFilter('archived')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'archived'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Archivált ({messages.filter(m => m.status === 'archived').length})
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-12 bg-vintage-cream-light rounded-lg">
          <p className="text-gray-500">Nincs üzenet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`bg-vintage-cream-light rounded-lg shadow-sm p-6 ${
                message.status === 'new' ? 'border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {message.status === 'new' ? (
                      <Mail className="w-5 h-5 text-blue-500" />
                    ) : (
                      <MailOpen className="w-5 h-5 text-gray-400" />
                    )}
                    <h3 className="text-lg font-semibold">{message.subject}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        message.status === 'new'
                          ? 'bg-blue-100 text-blue-700'
                          : message.status === 'read'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {message.status === 'new'
                        ? 'Új'
                        : message.status === 'read'
                        ? 'Olvasott'
                        : 'Archivált'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Feladó:</strong> {message.name}
                    </p>
                    <p>
                      <strong>Email:</strong>{' '}
                      <a
                        href={`mailto:${message.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {message.email}
                      </a>
                    </p>
                    <p>
                      <strong>Dátum:</strong>{' '}
                      {new Date(message.created_at).toLocaleString('hu-HU')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {message.status === 'new' && (
                    <button
                      onClick={() => updateStatus(message.id, 'read')}
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      title="Megjelölés olvasottként"
                    >
                      <MailOpen className="w-5 h-5" />
                    </button>
                  )}
                  {message.status !== 'archived' && (
                    <button
                      onClick={() => updateStatus(message.id, 'archived')}
                      className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                      title="Archiválás"
                    >
                      <Archive className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    title="Törlés"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
              </div>

              <div className="mt-4 pt-4 border-t">
                <a
                  href={`mailto:${message.email}?subject=Re: ${message.subject}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-vintage-red/90"
                >
                  <Mail className="w-4 h-4" />
                  Válasz küldése
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
