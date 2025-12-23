import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Shield, ShieldOff, Trash2, Mail, Calendar } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface User {
  id: string;
  email: string;
  created_at: string;
  app_metadata: {
    role?: string;
  };
  user_metadata: {
    display_name?: string;
  };
}

export default function UserManagement() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        showToast('Nincs aktív munkamenet', 'error');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        showToast('Hiba a felhasználók betöltésekor', 'error');
      } else {
        const usersWithAuth = await Promise.all(
          (data || []).map(async (user) => {
            const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
            return {
              id: user.id,
              email: user.email,
              created_at: user.created_at,
              app_metadata: authUser?.user?.app_metadata || {},
              user_metadata: authUser?.user?.user_metadata || {},
            };
          })
        );
        setUsers(usersWithAuth);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      showToast('Hiba a felhasználók betöltésekor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (userId: string, currentRole?: string) => {
    setActionLoading(userId);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin-user`;
      const newRole = currentRole === 'admin' ? 'user' : 'admin';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Jogosultság módosítás sikertelen');
      }

      showToast(
        newRole === 'admin' ? 'Admin jogosultság megadva!' : 'Admin jogosultság elvéve!',
        'success'
      );
      fetchUsers();
    } catch (error) {
      console.error('Toggle admin error:', error);
      showToast(
        error instanceof Error ? error.message : 'Hiba a jogosultság módosításakor',
        'error'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a felhasználót?')) {
      return;
    }

    setActionLoading(userId);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user?.id === userId) {
        showToast('Nem törölheted saját magad!', 'error');
        return;
      }

      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);

      if (deleteAuthError) {
        throw deleteAuthError;
      }

      const { error: deleteDbError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteDbError) {
        throw deleteDbError;
      }

      showToast('Felhasználó törölve!', 'success');
      fetchUsers();
    } catch (error) {
      console.error('Delete user error:', error);
      showToast(
        error instanceof Error ? error.message : 'Hiba a felhasználó törlésekor',
        'error'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Felhasználók kezelése</h2>
          <p className="text-gray-600 mt-1">
            Összes felhasználó: {users.length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-vintage-cream-light rounded-lg border border-gray-200">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nincs felhasználó</p>
        </div>
      ) : (
        <div className="bg-vintage-cream-light rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Felhasználó
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Regisztráció
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Szerepkör
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.user_metadata?.display_name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(user.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.app_metadata?.role === 'admin' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Felhasználó
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleAdminRole(user.id, user.app_metadata?.role)}
                        disabled={actionLoading === user.id}
                        className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                          user.app_metadata?.role === 'admin'
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {user.app_metadata?.role === 'admin' ? (
                          <>
                            <ShieldOff className="w-4 h-4" />
                            Admin eltávolítása
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4" />
                            Admin hozzáadása
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        disabled={actionLoading === user.id}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                        Törlés
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
