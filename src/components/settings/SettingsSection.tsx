import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { resetOnboarding } from "@/lib/onboarding";
import {
  exportFullBackup,
  importFullBackup,
  loadProfile,
  saveProfile,
} from "@/lib/storage";
import { showError, showSuccess } from "@/lib/toast";
import {
  Building2,
  Database,
  Download,
  LogOut,
  Shield,
  Smartphone,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useState } from "react";

export const SettingsSection = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(loadProfile() || {});

  const handleSave = () => {
    try {
      saveProfile(profile);
      showSuccess("Configurações salvas com sucesso!");
    } catch (e) {
      showError("Erro ao salvar configurações.");
    }
  };

  const handleReset = () => {
    if (
      confirm(
        "Isso apagará todos os seus dados e voltará para o Onboarding. Tem certeza?"
      )
    ) {
      resetOnboarding();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie sua conta e preferências do app
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={logout}
          className="gap-2 rounded-xl"
        >
          <LogOut size={18} />
          Sair
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation / Profile Summary */}
        <div className="md:col-span-1 space-y-4">
          <Card className="rounded-3xl border-none shadow-elevated bg-gradient-to-br from-primary/10 to-purple-500/10 overflow-hidden">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-primary rounded-full flex items-center justify-center text-primary-foreground text-3xl font-black">
                {profile.name?.charAt(0) || user?.email?.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-xl">
                  {profile.name || "Seu Nome"}
                </h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl h-12 text-primary bg-primary/5"
            >
              <User size={18} /> Perfil Pessoal
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl h-12 text-muted-foreground"
            >
              <Building2 size={18} /> Dados da Empresa
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl h-12 text-muted-foreground"
            >
              <Smartphone size={18} /> Mobile & Instalação
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl h-12 text-muted-foreground"
            >
              <Database size={18} /> Dados & Backup
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl h-12 text-muted-foreground"
            >
              <Shield size={18} /> Segurança
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Section */}
          <Card className="rounded-3xl border-none shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="text-primary" /> Perfil Pessoal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Renda Mensal (Base)</Label>
                  <Input
                    type="number"
                    value={profile.monthlyIncome}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        monthlyIncome: Number(e.target.value),
                      })
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Section */}
          <Card className="rounded-3xl border-none shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="text-purple-500" /> Perfil da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input
                  value={profile.businessProfile?.name || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      businessProfile: {
                        ...(profile.businessProfile || {}),
                        name: e.target.value,
                      },
                    })
                  }
                  className="rounded-xl"
                  placeholder="Nome Fantasia"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ramo de Atividade</Label>
                  <Input
                    value={profile.businessProfile?.sector || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        businessProfile: {
                          ...(profile.businessProfile || {}),
                          sector: e.target.value,
                        },
                      })
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    value={profile.businessProfile?.cnpj || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        businessProfile: {
                          ...(profile.businessProfile || {}),
                          cnpj: e.target.value,
                        },
                      })
                    }
                    className="rounded-xl"
                    placeholder="00.000.000/0001-00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Install Section */}
          <Card className="rounded-3xl border-none shadow-elevated bg-success/5 border border-success/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-success/10 rounded-2xl text-success">
                  <Smartphone size={32} />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-lg">
                    Meu Contador no seu Celular
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Você pode instalar o app diretamente na sua tela de início
                    sem precisar da App Store ou Play Store.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="rounded-xl border-success text-success hover:bg-success/10"
                    >
                      Como Instalar (iOS)
                    </Button>
                    <Button className="rounded-xl bg-success hover:bg-success/80 text-white">
                      Instalar Agora (Android)
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          
          {/* Backup Section */}
          <Card className="rounded-3xl border-none shadow-elevated bg-blue-500/5 border border-blue-500/10 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Database size={20} /> Backup & Restauração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <p className="text-sm text-muted-foreground">
                 Seus dados estão salvos apenas neste dispositivo. Faça backups regulares para não perder nada.
               </p>
               <div className="flex gap-4">
                 <Button onClick={exportFullBackup} variant="outline" className="flex-1 gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
                    <Download size={16} /> Fazer Backup
                 </Button>
                 <Button className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 relative">
                    <Upload size={16} /> Restaurar
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            await importFullBackup(file);
                            showSuccess("Dados restaurados com sucesso!");
                            window.location.reload();
                          } catch(err) {
                            showError("Erro ao restaurar backup.");
                          }
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                 </Button>
               </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-elevated border border-danger/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-danger">
                <Trash2 size={20} /> Perigo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Resetar Aplicativo</p>
                  <p className="text-xs text-muted-foreground">
                    Isso apagará todos os dados locais permanentemente.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  className="text-danger hover:bg-danger/10 rounded-xl"
                >
                  Resetar Dados
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              className="gradient-primary px-12 py-6 rounded-2xl text-lg font-bold shadow-elevated border-0"
            >
              Salvar Todas as Mudanças
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
