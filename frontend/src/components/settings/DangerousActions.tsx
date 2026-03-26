import React, { useState } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const DangerousActions: React.FC = () => {
  const { logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <button 
        className="btn-s" 
        style={{ marginTop: 6, width: "100%", color: "var(--red)", borderColor: "rgba(255,79,110,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onClick={() => logout()}
      >
        <LogOut size={16} /> Sair da conta
      </button>

      <button 
        className="btn-s" 
        style={{ marginTop: 10, width: "100%", color: "var(--t3)", borderColor: "rgba(255,79,110,0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: "11px" }}
        onClick={() => setShowDeleteConfirm(true)}
      >
        <Trash2 size={14} /> Excluir minha conta
      </button>

      {showDeleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "var(--bg)", borderRadius: 16, padding: 24, maxWidth: 340, width: "100%", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--t1)", marginBottom: 8, textAlign: "center" }}>Excluir conta?</div>
            <div style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5, textAlign: "center", marginBottom: 20 }}>
              Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button 
                className="btn-s" 
                style={{ flex: 1, color: "var(--t2)", borderColor: "var(--border)" }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-s" 
                style={{ flex: 1, color: "var(--red)", borderColor: "rgba(255,79,110,0.3)" }}
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
