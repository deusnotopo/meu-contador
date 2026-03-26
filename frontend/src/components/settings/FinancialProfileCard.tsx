import React from "react";

interface FinancialProfileCardProps {
  grossIncome: number;
  netIncome: number;
  userAge: number;
  investorProfile: string;
  investmentHorizon: string;
  dependents: number;
}

export const FinancialProfileCard: React.FC<FinancialProfileCardProps> = ({
  grossIncome,
  netIncome,
  userAge,
  investorProfile,
  investmentHorizon,
  dependents
}) => {
  return (
    <>
      <div className="sec-hd"><span className="sec-title">Perfil financeiro</span></div>
      <div className="card">
        {[
          ["Renda bruta mensal", grossIncome > 0 ? `R$ ${Math.round(grossIncome).toLocaleString('pt-BR')}` : "-", null],
          ["Renda líquida", netIncome > 0 ? `R$ ${Math.round(netIncome).toLocaleString('pt-BR')}` : "-", null],
          ["Faixa etária", userAge > 0 ? `${userAge} anos` : "-", null],
          ["Perfil investidor", investorProfile, investorProfile !== "Não definido" ? "b" : null],
          ["Horizonte", investmentHorizon, investmentHorizon !== "Não definido" ? "g" : null],
          ["Dependentes", dependents > 0 ? dependents.toString() : "Nenhum", null]
        ].map(([lb, vl, badge], i) => (
          <div key={i} className="row" style={{ cursor: "default" }}>
            <div className="row-main"><div className="row-title">{lb}</div></div>
            <div>
              {badge ? (
                <span className={`bdg bdg-${badge}`}>{vl}</span>
              ) : (
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--t2)", fontFamily: "var(--mono)" }}>{vl}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
