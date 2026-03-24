import { PlayCircle } from "lucide-react";

export const EducationSection = () => {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ padding: "10px 0" }}>
      <div style={{ padding: "0 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.5px" }}>Academia</div>
            <div style={{ fontSize: 13, color: "var(--t3)" }}>Módulos para você dominar suas finanças</div>
          </div>
        </div>

        {/* Featured Video */}
        <div style={{ position: "relative", width: "100%", height: 180, borderRadius: "var(--r3)", overflow: "hidden", background: "url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80') center/cover", marginBottom: 20 }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(4,7,15,0.9) 0%, rgba(4,7,15,0.2) 100%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 16 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <PlayCircle size={32} color="#fff" />
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "var(--blue)", marginBottom: 4 }}>
                  Fundamentos
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
                  Como criar sua Reserva de Emergência
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                  4 min $\cdot$ Aula 1
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sec-hd"><span className="sec-title">Módulos</span></div>
        <div className="card space-y-4">
          {[
            { tag: "Iniciante", title: "Saindo das dívidas", desc: "Aprenda a classificar, negociar e abater juros com a estratégia avalanche.", pb: "100%" },
            { tag: "Intermediário", title: "Mentalidade 50/30/20", desc: "Estruturando seus envelopes para que sobre dinheiro sem sofrimento.", pb: "45%" },
            { tag: "Avançado", title: "Investimentos do Zero", desc: "Como avaliar a rentabilidade real de um CDB vs Poupança.", pb: "0%" }
          ].map((m, i) => (
            <div key={i} className="row">
              <div className="row-ico" style={{ fontSize: 16 }}>📺</div>
              <div className="row-main" style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", marginBottom: 2 }}>{m.tag}</div>
                <div className="row-title">{m.title}</div>
                <div className="row-sub" style={{ fontSize: 11, marginTop: 4 }}>{m.desc}</div>
                <div className="prog" style={{ marginTop: 10, height: 4 }}>
                  <div className="prog-fill" style={{ width: m.pb, background: m.pb === "100%" ? "var(--green)" : "var(--blue)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
