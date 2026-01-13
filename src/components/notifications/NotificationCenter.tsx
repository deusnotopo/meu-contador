import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  BellOff,
  AlertTriangle,
  TrendingUp,
  Target,
  DollarSign,
  Calendar,
  X,
  Check,
  Clock,
  Zap,
  Info,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";

interface Notification {
  id: string;
  type: "warning" | "success" | "info" | "alert";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationSettings {
  budgetAlerts: boolean;
  spendingAlerts: boolean;
  goalReminders: boolean;
  weeklyReports: boolean;
  pushNotifications: boolean;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "warning",
      title: "Orçamento Excedido",
      message: "Você gastou 85% do orçamento mensal de Alimentação. Considere reduzir os gastos.",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
      read: false,
      actionUrl: "/personal",
      actionText: "Ver Orçamento"
    },
    {
      id: "2",
      type: "success",
      title: "Meta Atingida!",
      message: "Parabéns! Você atingiu sua meta de reserva de emergência de R$ 5.000.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
      read: false
    },
    {
      id: "3",
      type: "info",
      title: "Dica da IA",
      message: "Com base nos seus gastos, você pode economizar R$ 300/mês reduzindo delivery.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 horas atrás
      read: true
    },
    {
      id: "4",
      type: "alert",
      title: "Pagamento Vencendo",
      message: "Sua conta de luz vence amanhã. Valor: R$ 180,00",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
      read: true,
      actionUrl: "/personal",
      actionText: "Pagar Agora"
    }
  ]);

  const [settings, setSettings] = useState<NotificationSettings>({
    budgetAlerts: true,
    spendingAlerts: true,
    goalReminders: true,
    weeklyReports: true,
    pushNotifications: false
  });

  const [activeTab, setActiveTab] = useState<"notifications" | "settings">("notifications");

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="text-yellow-400" size={20} />;
      case "success": return <Check className="text-green-400" size={20} />;
      case "info": return <Info className="text-blue-400" size={20} />;
      case "alert": return <AlertCircle className="text-red-400" size={20} />;
      default: return <Bell className="text-gray-400" size={20} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "warning": return "border-yellow-500/30 bg-yellow-500/5";
      case "success": return "border-green-500/30 bg-green-500/5";
      case "info": return "border-blue-500/30 bg-blue-500/5";
      case "alert": return "border-red-500/30 bg-red-500/5";
      default: return "border-gray-500/30 bg-gray-500/5";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}min atrás`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h atrás`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d atrás`;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3">
            <Bell className="text-indigo-400" size={32} />
            Centro de Notificações
          </h2>
          <p className="text-slate-400 mt-2">
            Mantenha-se informado sobre suas finanças
          </p>
        </div>

        {unreadCount > 0 && (
          <Badge className="bg-red-500/20 text-red-400 px-3 py-1">
            {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 bg-slate-800/50 p-1 rounded-2xl border border-slate-700/50">
        <Button
          variant={activeTab === "notifications" ? "default" : "ghost"}
          onClick={() => setActiveTab("notifications")}
          className="flex-1"
        >
          <Bell size={18} className="mr-2" />
          Notificações {unreadCount > 0 && `(${unreadCount})`}
        </Button>
        <Button
          variant={activeTab === "settings" ? "default" : "ghost"}
          onClick={() => setActiveTab("settings")}
          className="flex-1"
        >
          <Zap size={18} className="mr-2" />
          Configurações
        </Button>
      </div>

      {/* Content */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          {unreadCount > 0 && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Marcar todas como lidas
              </Button>
            </div>
          )}

          {notifications.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-12 text-center">
                <BellOff className="text-slate-500 w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhuma notificação</h3>
                <p className="text-slate-500">Você está em dia com suas finanças!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`border transition-all hover:bg-slate-800/70 ${getNotificationColor(notification.type)} ${!notification.read ? 'ring-1 ring-indigo-500/50' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg mb-1">{notification.title}</h4>
                            <p className="text-slate-300 mb-3 leading-relaxed">{notification.message}</p>

                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {formatTimeAgo(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <Badge className="bg-indigo-500/20 text-indigo-400 text-xs">
                                  Novo
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {notification.actionUrl && notification.actionText && (
                              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">
                                {notification.actionText}
                              </Button>
                            )}

                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="text-slate-400 hover:text-white"
                              >
                                <Check size={16} />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="text-slate-400 hover:text-red-400"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Bell size={24} className="text-indigo-400" />
                Preferências de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold">Alertas de Orçamento</h4>
                  <p className="text-slate-400 text-sm">Notificações quando você se aproxima do limite</p>
                </div>
                <Switch
                  checked={settings.budgetAlerts}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, budgetAlerts: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold">Alertas de Gastos</h4>
                  <p className="text-slate-400 text-sm">Avisos sobre gastos incomuns ou elevados</p>
                </div>
                <Switch
                  checked={settings.spendingAlerts}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, spendingAlerts: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold">Lembretes de Metas</h4>
                  <p className="text-slate-400 text-sm">Atualizações sobre progresso das suas metas</p>
                </div>
                <Switch
                  checked={settings.goalReminders}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, goalReminders: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold">Relatórios Semanais</h4>
                  <p className="text-slate-400 text-sm">Resumo semanal das suas finanças</p>
                </div>
                <Switch
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, weeklyReports: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold">Notificações Push</h4>
                  <p className="text-slate-400 text-sm">Receber alertas no dispositivo móvel</p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Zap className="text-indigo-400" size={20} />
                </div>
                <h3 className="text-lg font-bold">Dica Premium</h3>
              </div>
              <p className="text-slate-300">
                Configure suas notificações para receber alertas importantes sem ser sobrecarregado.
                O equilíbrio certo ajuda você a manter o controle sem ansiedade.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};