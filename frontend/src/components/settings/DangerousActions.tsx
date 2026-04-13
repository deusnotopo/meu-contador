import React, { useState } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const DangerousActions: React.FC = () => {
  const { logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      {/* Logout */}
      <button
        className="btn-s mt-1.5 w-full flex items-center justify-center gap-2 text-[var(--red)] border-[rgba(255,79,110,0.3)]"
        onClick={() => logout()}
      >
        <LogOut size={16} /> Sair da conta
      </button>

      {/* Delete account */}
      <button
        className="btn-s mt-2.5 w-full flex items-center justify-center gap-2 text-[var(--t3)] border-[rgba(255,79,110,0.2)] text-[11px]"
        onClick={() => setShowDeleteConfirm(true)}
      >
        <Trash2 size={14} /> Excluir minha conta
      </button>

      {/* Confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-5">
          <div className="bg-[var(--bg)] rounded-2xl p-6 max-w-[340px] w-full border border-[var(--border)]">
            <div className="text-[18px] font-bold text-[var(--t1)] mb-2 text-center">
              Excluir conta?
            </div>
            <div className="text-[13px] text-[var(--t2)] leading-[1.5] text-center mb-5">
              Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
            </div>
            <div className="flex gap-2.5">
              <button
                className="btn-s flex-1 text-[var(--t2)] border-[var(--border)]"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-s flex-1 text-[var(--red)] border-[rgba(255,79,110,0.3)]"
                onClick={() => { setShowDeleteConfirm(false); logout(); }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
