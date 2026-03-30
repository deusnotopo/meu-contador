import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { OnboardingWizard } from "./OnboardingWizard";

interface WizardTriggerProps {
  label?: string;
  tooltipText?: string;
}

/**
 * Botão leve para abrir o Assistente de Onboarding em qualquer área.
 * Uso: <WizardTrigger label="Assistente" />
 */
export const WizardTrigger = ({
  label = "Assistente",
}: WizardTriggerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir Assistente de Configuração"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 11px",
          borderRadius: 20,
          background: "linear-gradient(135deg, rgba(80,72,232,0.15), rgba(74,139,255,0.1))",
          border: "1px solid rgba(80,72,232,0.3)",
          color: "var(--blue)",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          transition: "all 0.18s ease",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "linear-gradient(135deg, rgba(80,72,232,0.25), rgba(74,139,255,0.2))";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "linear-gradient(135deg, rgba(80,72,232,0.15), rgba(74,139,255,0.1))";
        }}
      >
        <Sparkles size={13} />
        {label}
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          {/* Close button overlay for easy dismiss  */}
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar Assistente"
            style={{
              position: "fixed",
              top: 16,
              right: 16,
              zIndex: 201,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <X size={16} />
          </button>
          <OnboardingWizard
            onComplete={() => setOpen(false)}
            onSkip={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
};
