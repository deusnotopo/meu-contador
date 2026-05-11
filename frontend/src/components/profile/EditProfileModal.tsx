import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserActions } from "@/hooks/useUserActions";
import { logger } from "@/lib/logger";
import { X } from "lucide-react";
import { UserProfile } from "@/types";

interface EditProfileModalProps {
  onClose: () => void;
}

const fieldLabel = "block text-[13px] text-[var(--t2)] mb-1.5 font-medium";
const fieldInput = "inp w-full";

export const EditProfileModal = ({ onClose }: EditProfileModalProps) => {
  const { user } = useAuth();
  const { updateProfile } = useUserActions();
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
      logger.error('[EditProfileModal] Profile update failed', err);
      setError("Falha ao atualizar o perfil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-5">
      <div className="bg-[var(--bg)] rounded-2xl w-full max-w-[450px] overflow-hidden border border-[var(--border)] flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="m-0 text-[18px] text-[var(--t1)] font-semibold">Editar Perfil</h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-[var(--t2)] cursor-pointer flex hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto p-5">
          {error && (
            <div className="bg-red-500/10 text-[var(--red)] px-3.5 py-2.5 rounded-lg mb-4 text-[13px] border border-red-500/20">
              {error}
            </div>
          )}

          <form id="edit-profile-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={fieldLabel}>Nome Completo</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={fieldInput}
                required
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className={fieldLabel}>Renda Mensal (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.monthlyIncome}
                onChange={(e) => setFormData({ ...formData, monthlyIncome: parseFloat(e.target.value) || 0 })}
                className={fieldInput}
                placeholder="Ex: 5000"
              />
            </div>

            <div>
              <label className={fieldLabel}>Perfil de Investidor</label>
              <select
                value={formData.riskProfile}
                onChange={(e) => setFormData({ ...formData, riskProfile: e.target.value as UserProfile["riskProfile"] })}
                className="inp w-full bg-[var(--bg)] text-[var(--t1)]"
              >
                {riskProfileOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "conservative" ? "Conservador" : option === "moderate" ? "Moderado" : "Arrojado"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={fieldLabel}>Objetivo Financeiro</label>
              <select
                value={formData.financialGoal}
                onChange={(e) => setFormData({ ...formData, financialGoal: e.target.value as UserProfile["financialGoal"] })}
                className="inp w-full bg-[var(--bg)] text-[var(--t1)]"
              >
                {financialGoalOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "save" ? "Poupando dinheiro"
                      : option === "invest" ? "Investindo"
                      : option === "debt-free" ? "Quitando dívidas"
                      : option === "emergency" ? "Reserva de emergência"
                      : option === "travel" ? "Viagem"
                      : option === "house" ? "Casa própria"
                      : "Aposentadoria"}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border)] flex gap-2.5 justify-end">
          <button
            type="button"
            className="btn-s flex-1 text-[var(--t2)] border-[var(--border)]"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="edit-profile-form"
            className="btn-p flex-1"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar Perfil"}
          </button>
        </div>
      </div>
    </div>
  );
};
