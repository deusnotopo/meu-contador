export const EducationSection = () => {
  return (
    <div style={{ paddingTop: "10px", animation: "fsu 0.26s ease" }}>
      <div className="eyebrow">Aprenda a investir</div>
      <div className="page-title">Academia</div>
      <div className="page-sub" style={{ marginBottom: "14px" }}>Trilhas de conhecimento financeiro</div>

      {/* Featured video card */}
      <div style={{ position: "relative", width: "100%", height: "180px", borderRadius: "var(--r3)", overflow: "hidden", background: "url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80') center/cover", marginBottom: "20px" }}>
        {/* Dark gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(4,7,15,0.9) 0%, rgba(4,7,15,0.2) 100%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "16px" }}>
          {/* Play badge */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ width: "32px", height: "32px", background: "var(--blue)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", flexShrink: 0 }}>▶</div>
            <div>
              <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "var(--blue)", marginBottom: "4px" }}>Fundamentos</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>Como criar sua Reserva de Emergência</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>4 min · Aula 1</div>
            </div>
          </div>
        </div>
      </div>

      <div className="sec-hd"><span className="sec-title">Módulos</span></div>
      
      <div className="card">
        <div className="row" style={{ alignItems: "flex-start" }}>
          <div className="row-ico" style={{ background: "var(--bg)", fontSize: "16px", marginTop: "2px" }}>📺</div>
          <div className="row-main" style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "var(--green)", marginBottom: "4px" }}>Iniciante</div>
            <div className="row-title">Saindo das dívidas</div>
            <div className="row-sub" style={{ fontSize: "11px", lineHeight: 1.4 }}>Aprenda a classificar, negociar e abater juros com a estratégia avalanche.</div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
              <span style={{ fontSize: "10px", color: "var(--t3)", fontFamily: "var(--mono)" }}>100% concluído</span>
              <div className="prog" style={{ width: "60px", height: "4px" }}><div className="prog-fill" style={{ width: "100%", background: "var(--green)" }}></div></div>
            </div>
          </div>
        </div>

        <div className="row" style={{ alignItems: "flex-start" }}>
          <div className="row-ico" style={{ background: "var(--bg)", fontSize: "16px", marginTop: "2px" }}>📺</div>
          <div className="row-main" style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "var(--blue)", marginBottom: "4px" }}>Intermediário</div>
            <div className="row-title">O que é a Selic?</div>
            <div className="row-sub" style={{ fontSize: "11px", lineHeight: 1.4 }}>Juros, inflação e como o Tesouro Direto funciona na prática.</div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
              <span style={{ fontSize: "10px", color: "var(--blue)", fontFamily: "var(--mono)", fontWeight: 700 }}>Continuar</span>
              <div className="prog" style={{ width: "60px", height: "4px" }}><div className="prog-fill" style={{ width: "30%", background: "var(--blue)" }}></div></div>
            </div>
          </div>
        </div>

        <div className="row" style={{ alignItems: "flex-start" }}>
          <div className="row-ico" style={{ background: "var(--bg)", fontSize: "16px", marginTop: "2px" }}>🔒</div>
          <div className="row-main" style={{ flex: 1, opacity: 0.5 }}>
            <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "var(--t3)", marginBottom: "4px" }}>Avançado</div>
            <div className="row-title">CDB, LCI e LCA</div>
            <div className="row-sub" style={{ fontSize: "11px", lineHeight: 1.4 }}>Tributação e garantias do FGC.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
