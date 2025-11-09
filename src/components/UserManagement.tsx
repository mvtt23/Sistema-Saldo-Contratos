import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Edit, Trash2, Shield, Eye, Pencil, FileText, X, Check } from "lucide-react";

interface User {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface ModulePermission {
  module: string;
  label: string;
  icon: any;
  can_view: boolean;
  can_edit: boolean;
  can_create: boolean;
  can_delete: boolean;
}

export function UserManagement() {
  const { toast, dismiss } = useToast();
  const { 
    users, 
    permissions, 
    loading, 
    fetchUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    updateUserPermissions 
  } = useUserManagement();

  // Buscar usuários quando o componente for montado
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'viewer' });
  const [userPermissions, setUserPermissions] = useState<ModulePermission[]>([]);

  // Inicializar permissões quando o usuário for selecionado para edição
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({ 
      username: user.username, 
      password: '', // Não exibir senha existente
      role: user.role 
    });
    setIsAddingUser(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.username) {
      toast({ title: "Erro", description: "Preencha o nome de usuário", variant: "destructive" });
      return;
    }

    if (!editingUser && !userForm.password) {
      toast({ title: "Erro", description: "Preencha a senha", variant: "destructive" });
      return;
    }

    let success = false;

    if (editingUser) {
      success = await updateUser(editingUser.id, {
        username: userForm.username,
        role: userForm.role,
        ...(userForm.password && { password: userForm.password })
      });
    } else {
      const newUser = await createUser({
        username: userForm.username,
        password: userForm.password,
        role: userForm.role
      });
      if (newUser) {
        success = true;
      }
    }
    
    if (success) {
      setIsAddingUser(false);
      setEditingUser(null);
      setUserForm({ username: '', password: '', role: 'viewer' });
    }
  };

  const handleDeleteUser = (user: User) => {
    const toastId = toast({
      title: "Confirmação de Exclusão",
      description: `Tem certeza que deseja excluir o usuário "${user.username}"?`,
      variant: "destructive",
      action: (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => dismiss(toastId)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              dismiss(toastId);
              await deleteUser(user.id);
            }}
          >
            Confirmar Exclusão
          </Button>
        </div>
      ),
      duration: 1000000, // Manter aberto até interação
    }).id;
  };

  const handleToggleActive = async (user: User) => {
    const success = await updateUser(user.id, { is_active: !user.is_active });
    if (success) {
      // O fetchUsers será chamado automaticamente dentro do updateUser
    }
  };

  const handleEditPermissions = (userId: string) => {
    setEditingPermissions(userId);
    // Buscar as permissões atuais do usuário
    const currentPermissions = permissions[userId] || [];
    setUserPermissions(currentPermissions);
  };

  const handlePermissionChange = (moduleIndex: number, field: string, value: boolean) => {
    setUserPermissions(prev => 
      prev.map((perm, idx) =>
        idx === moduleIndex ? { ...perm, [field]: value } : perm
      )
    );
  };

  const handleSavePermissions = async () => {
    if (editingPermissions) {
      await updateUserPermissions(editingPermissions, userPermissions);
      setEditingPermissions(null);
    }
  };

  const handleCancelPermissions = () => {
    setEditingPermissions(null);
  };

  // Filtrar usuários para não mostrar o admin (já que o admin não pode se gerenciar)
  const filteredUsers = users.filter(user => user.role !== 'admin');

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
              setUserForm({ username: '', password: '', role: 'viewer' });
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Carregando usuários...</div>
        ) : (
          <>
            {isAddingUser && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-4">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Nome de Usuário *</Label>
                    <Input
                      id="username"
                      value={userForm.username}
                      onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Digite o nome de usuário"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">
                      {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}
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

                <div className="mt-4">
                  <Label htmlFor="role">Perfil</Label>
                  <Select value={userForm.role} onValueChange={(value) => setUserForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddingUser(false);
                      setEditingUser(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleSaveUser} className="bg-blue-600 hover:bg-blue-700">
                    {editingUser ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {filteredUsers.map(user => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Users className={`w-5 h-5 ${user.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="font-semibold">{user.username}</p>
                        <p className="text-sm text-gray-500">
                          {user.is_active ? 'Ativo' : 'Inativo'} • {user.role === 'viewer' ? 'Visualizador' : 'Gerente'}
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
                        onClick={() => handleEditPermissions(user.id)}
                        className="text-blue-600"
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {editingPermissions === user.id && (
                    <div className="mt-4 border-t pt-4">
                      <h5 className="font-semibold mb-3 flex items-center">
                        <Shield className="w-4 h-4 mr-2 text-blue-600" />
                        Permissões por Módulo
                      </h5>
                      <div className="space-y-3">
                        {userPermissions.map((perm, idx) => (
                          <div key={perm.module} className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium mb-2">{perm.label}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <label className="flex items-center space-x-2 text-sm">
                                <Checkbox
                                  checked={perm.can_view}
                                  onCheckedChange={(checked) =>
                                    handlePermissionChange(idx, 'can_view', checked as boolean)
                                  }
                                />
                                <Eye className="w-4 h-4 text-gray-500" />
                                <span>Visualizar</span>
                              </label>
                              <label className="flex items-center space-x-2 text-sm">
                                <Checkbox
                                  checked={perm.can_edit}
                                  onCheckedChange={(checked) =>
                                    handlePermissionChange(idx, 'can_edit', checked as boolean)
                                  }
                                />
                                <Pencil className="w-4 h-4 text-gray-500" />
                                <span>Editar</span>
                              </label>
                              <label className="flex items-center space-x-2 text-sm">
                                <Checkbox
                                  checked={perm.can_create}
                                  onCheckedChange={(checked) =>
                                    handlePermissionChange(idx, 'can_create', checked as boolean)
                                  }
                                />
                                <Plus className="w-4 h-4 text-gray-500" />
                                <span>Criar</span>
                              </label>
                              <label className="flex items-center space-x-2 text-sm">
                                <Checkbox
                                  checked={perm.can_delete}
                                  onCheckedChange={(checked) =>
                                    handlePermissionChange(idx, 'can_delete', checked as boolean)
                                  }
                                />
                                <Trash2 className="w-4 h-4 text-gray-500" />
                                <span>Excluir</span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-4 space-x-2">
                        <Button variant="outline" onClick={handleCancelPermissions}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSavePermissions} className="bg-blue-600 hover:bg-blue-700">
                          Salvar Permissões
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Nenhum usuário cadastrado</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}