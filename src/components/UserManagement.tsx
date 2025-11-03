import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus, Edit, Trash2, Shield, Eye, Pencil, FileText, X, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface Permission {
  id: string;
  user_id: string;
  module: string;
  can_view: boolean;
  can_edit: boolean;
  can_create: boolean;
  can_delete: boolean;
}

interface ModulePermissions {
  module: string;
  label: string;
  icon: any;
  can_view: boolean;
  can_edit: boolean;
  can_create: boolean;
  can_delete: boolean;
}

const MODULES = [
  { module: 'dashboard', label: 'Dashboard', icon: FileText },
  { module: 'contracts', label: 'Contratos', icon: FileText },
  { module: 'managing_units', label: 'Unidades Gestoras', icon: FileText },
  { module: 'reports', label: 'Relatórios', icon: FileText },
];

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ username: '', password: '' });
  const [permissions, setPermissions] = useState<Record<string, ModulePermissions[]>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('*');

      if (permissionsError) throw permissionsError;

      setUsers(usersData || []);

      const permissionsMap: Record<string, ModulePermissions[]> = {};
      (usersData || []).forEach(user => {
        const userPerms = (permissionsData || []).filter(p => p.user_id === user.id);
        permissionsMap[user.id] = MODULES.map(module => {
          const existingPerm = userPerms.find(p => p.module === module.module);
          return {
            module: module.module,
            label: module.label,
            icon: module.icon,
            can_view: existingPerm?.can_view || false,
            can_edit: existingPerm?.can_edit || false,
            can_create: existingPerm?.can_create || false,
            can_delete: existingPerm?.can_delete || false,
          };
        });
      });

      setPermissions(permissionsMap);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar usuários",
        variant: "destructive",
      });
    }
  };

  const handleSaveUser = async () => {
    if (!userForm.username || !userForm.password) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingUser) {
        const updateData: any = { username: userForm.username };
        if (userForm.password) {
          updateData.password = userForm.password;
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingUser.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso",
        });
      } else {
        const { data, error } = await supabase
          .from('users')
          .insert([{
            username: userForm.username,
            password: userForm.password,
            role: 'user',
            is_active: true
          }])
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const defaultPermissions = MODULES.map(module => ({
            user_id: data.id,
            module: module.module,
            can_view: false,
            can_edit: false,
            can_create: false,
            can_delete: false,
          }));

          await supabase.from('user_permissions').insert(defaultPermissions);
        }

        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso",
        });
      }

      setUserForm({ username: '', password: '' });
      setIsAddingUser(false);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar usuário",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({ username: user.username, password: '' });
    setIsAddingUser(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso",
      });
      loadUsers();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir usuário",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Usuário ${!user.is_active ? 'ativado' : 'desativado'} com sucesso`,
      });
      loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do usuário",
        variant: "destructive",
      });
    }
  };

  const handlePermissionChange = (userId: string, moduleIndex: number, field: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [userId]: prev[userId].map((perm, idx) =>
        idx === moduleIndex ? { ...perm, [field]: value } : perm
      )
    }));
  };

  const handleSavePermissions = async (userId: string) => {
    try {
      const userPermissions = permissions[userId];

      for (const perm of userPermissions) {
        const { error } = await supabase
          .from('user_permissions')
          .upsert({
            user_id: userId,
            module: perm.module,
            can_view: perm.can_view,
            can_edit: perm.can_edit,
            can_create: perm.can_create,
            can_delete: perm.can_delete,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,module'
          });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Permissões atualizadas com sucesso",
      });
      setEditingPermissions(null);
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar permissões",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Gerenciar Usuários
          </CardTitle>
          <Button
            onClick={() => {
              setIsAddingUser(true);
              setEditingUser(null);
              setUserForm({ username: '', password: '' });
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAddingUser && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold mb-4">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input
                  id="username"
                  value={userForm.username}
                  onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Digite o nome de usuário"
                />
              </div>
              <div>
                <Label htmlFor="password">
                  {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Digite a senha"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingUser(false);
                  setEditingUser(null);
                  setUserForm({ username: '', password: '' });
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveUser} className="bg-blue-600 hover:bg-blue-700">
                {editingUser ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {users.filter(user => user.role !== 'admin').map(user => (
            <div key={user.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Users className={`w-5 h-5 ${user.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-semibold">{user.username}</p>
                    <p className="text-sm text-gray-500">
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(user)}
                  >
                    {user.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditUser(user)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingPermissions(editingPermissions === user.id ? null : user.id)}
                    className="text-blue-600"
                  >
                    <Shield className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {editingPermissions === user.id && permissions[user.id] && (
                <div className="mt-4 border-t pt-4">
                  <h5 className="font-semibold mb-3 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-blue-600" />
                    Permissões por Módulo
                  </h5>
                  <div className="space-y-3">
                    {permissions[user.id].map((perm, idx) => (
                      <div key={perm.module} className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium mb-2">{perm.label}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <label className="flex items-center space-x-2 text-sm">
                            <Checkbox
                              checked={perm.can_view}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(user.id, idx, 'can_view', checked as boolean)
                              }
                            />
                            <Eye className="w-4 h-4 text-gray-500" />
                            <span>Visualizar</span>
                          </label>
                          <label className="flex items-center space-x-2 text-sm">
                            <Checkbox
                              checked={perm.can_edit}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(user.id, idx, 'can_edit', checked as boolean)
                              }
                            />
                            <Pencil className="w-4 h-4 text-gray-500" />
                            <span>Editar</span>
                          </label>
                          <label className="flex items-center space-x-2 text-sm">
                            <Checkbox
                              checked={perm.can_create}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(user.id, idx, 'can_create', checked as boolean)
                              }
                            />
                            <Plus className="w-4 h-4 text-gray-500" />
                            <span>Criar</span>
                          </label>
                          <label className="flex items-center space-x-2 text-sm">
                            <Checkbox
                              checked={perm.can_delete}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(user.id, idx, 'can_delete', checked as boolean)
                              }
                            />
                            <Trash2 className="w-4 h-4 text-gray-500" />
                            <span>Excluir</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={() => handleSavePermissions(user.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Salvar Permissões
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {users.filter(user => user.role !== 'admin').length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Nenhum usuário cadastrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
