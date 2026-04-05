import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X } from "lucide-react";

import { UserProfile } from "@/types";

interface EditProfileModalProps {
  onClose: () => void;
}

export const EditProfileModal = ({ onClose }: EditProfileModalProps) => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: user?.name || "",
    monthlyIncome: user?.monthlyIncome || 0,
    financialGoal: (user?.financialGoal || "save") as UserProfile["financialGoal"],
    riskProfile: (user?.riskProfile || "moderate") as UserProfile["riskProfile"],
  });

  const riskProfileOptions: UserProfile["riskProfile"][] = ["conservative", "moderate", "aggressive"];
  const financialGoalOptions: UserProfile["financialGoal"][] = ["save", "invest", "debt-free", "emergency", "travel", "house", "retire"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await updateProfile(formData);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError("Falha ao atualizar o perfil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "var(--bg)", borderRadius: 16, width: "100%", maxWidth: 450, overflow: "hidden", border: "1px solid var(--border)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ margin: 0, fontSize: 18, color: "var(--t1)", fontWeight: 600 }}>Editar Perfil</h2>
          <button 
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "var(--t2)", cursor: "pointer", display: "flex" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div style={{ overflowY: "auto", padding: 20 }}>
          {error && (
            <div style={{ background: "rgba(255,59,48,0.1)", color: "var(--red)", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid rgba(255,59,48,0.2)" }}>
              {error}
            </div>
          )}
          
          <form id="edit-profile-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "var(--t2)", marginBottom: 6, fontWeight: 500 }}>Nome Completo</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="inp"
                required
                style={{ width: "100%" }}
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, color: "var(--t2)", marginBottom: 6, fontWeight: 500 }}>Renda Mensal (R$)</label>
              <input 
                type="number" 
                min="0"
                step="0.01"
                value={formData.monthlyIncome}
                onChange={(e) => setFormData({...formData, monthlyIncome: parseFloat(e.target.value) || 0})}
                className="inp"
                style={{ width: "100%" }}
                placeholder="Ex: 5000"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, color: "var(--t2)", marginBottom: 6, fontWeight: 500 }}>Perfil de Investidor</label>
              <select 
                value={formData.riskProfile}
                onChange={(e) => setFormData({...formData, riskProfile: e.target.value as UserProfile["riskProfile"]})}
                className="inp"
                style={{ width: "100%", background: "var(--bg)", color: "var(--t1)" }}
              >
                {riskProfileOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "conservative" ? "Conservador" : option === "moderate" ? "Moderado" : "Arrojado"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, color: "var(--t2)", marginBottom: 6, fontWeight: 500 }}>Objetivo Financeiro</label>
              <select 
                value={formData.financialGoal}
                onChange={(e) => setFormData({...formData, financialGoal: e.target.value as UserProfile["financialGoal"]})}
                className="inp"
                style={{ width: "100%", background: "var(--bg)", color: "var(--t1)" }}
              >
                {financialGoalOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "save"
                      ? "Poupando dinheiro"
                      : option === "invest"
                        ? "Investindo"
                        : option === "debt-free"
                          ? "Quitando dívidas"
                          : option === "emergency"
                            ? "Reserva de emergência"
                            : option === "travel"
                              ? "Viagem"
                              : option === "house"
                                ? "Casa própria"
                                : "Aposentadoria"}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button 
            type="button"
            className="btn-s" 
            style={{ color: "var(--t2)", borderColor: "var(--border)", flex: 1 }}
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="edit-profile-form"
            className="btn-p" 
            style={{ flex: 1 }}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar Perfil"}
          </button>
        </div>
      </div>
    </div>
  );
};
