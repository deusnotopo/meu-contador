import { useState, useEffect, useMemo } from "react";
import { useFipe, VehicleType, FipePrice } from "@/hooks/useFipe";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  Loader2,
  Plus,
  AlertCircle,
  RefreshCw,
  Trash2,
  Search,
} from "lucide-react";
import { useInvestments } from "@/hooks/useInvestments";
import { formatCurrency } from "@/lib/formatters";

interface Option {
  value: string;
  label: string;
}

// Searchable select for large lists
const SearchableSelect = ({
  options,
  onSelect,
  placeholder,
  loading,
}: {
  options: Option[];
  onSelect: (o: Option) => void;
  placeholder: string;
  loading?: boolean;
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return options.slice(0, 80);
    return options
      .filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 50);
  }, [options, query]);

  if (loading)
    return (
      <div className="flex items-center gap-2 py-4 text-blue-400/80 text-sm">
        <Loader2 className="animate-spin" size={16} />
        <span className="font-mono tracking-wider text-[11px] uppercase">
          Consultando FIPE...
        </span>
      </div>
    );

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-blue-500/50 transition-all">
        <Search size={14} className="text-white/30 shrink-0" />
        <input
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full max-h-52 overflow-y-auto bg-[#0d1524] border border-white/10 rounded-xl shadow-2xl">
          {filtered.map((o) => (
            <button
              key={o.value}
              className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
              onMouseDown={() => {
                onSelect(o);
                setQuery(o.label);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Step progress indicator
const StepProgress = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => (
  <div className="flex items-center gap-1.5 mb-5">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1 rounded-full flex-1 transition-all duration-500 ${i < current ? "bg-blue-500" : i === current ? "bg-blue-400/60" : "bg-white/10"}`}
      />
    ))}
    <span className="text-[10px] text-white/40 font-mono ml-1">
      {current}/{total}
    </span>
  </div>
);

export const FipeVehicleManager = ({ onSaved }: { onSaved?: () => void }) => {
  const fipe = useFipe();
  const { assets, addAsset, deleteAsset } = useInvestments();

  const vehicleAssets = useMemo(
    () => assets.filter((a) => (a as { type: string }).type === "vehicle"),
    [assets],
  );

  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [type, setType] = useState<VehicleType>("carros");
  const [brand, setBrand] = useState<Option | null>(null);
  const [model, setModel] = useState<Option | null>(null);

  const [brands, setBrands] = useState<Option[]>([]);
  const [models, setModels] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const [priceData, setPriceData] = useState<FipePrice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Load Brands on type select
  useEffect(() => {
    if (!showWizard || step < 2) return;
    let mounted = true;
    setLoadingBrands(true);
    fipe
      .getBrands(type)
      .then((res) => {
        if (mounted) {
          setBrands(res.map((b) => ({ value: b.codigo, label: b.nome })));
          setLoadingBrands(false);
        }
      })
      .catch(() => setLoadingBrands(false));
    return () => {
      mounted = false;
    };
  }, [type, step, showWizard]);

  const handleTypeSelect = (t: VehicleType) => {
    setType(t);
    setBrand(null);
    setModel(null);
    setPriceData(null);
    setModels([]);
    setYears([]);
    setStep(2);
  };

  const handleBrandSelect = async (b: Option) => {
    setBrand(b);
    setModel(null);
    setPriceData(null);
    setModels([]);
    setYears([]);
    setStep(3);
    setLoadingModels(true);
    const res = await fipe.getModels(type, b.value);
    setModels(res.map((m) => ({ value: String(m.codigo), label: m.nome })));
    setLoadingModels(false);
  };

  const handleModelSelect = async (m: Option) => {
    setModel(m);
    setPriceData(null);
    setYears([]);
    setStep(4);
    setLoadingYears(true);
    const res = await fipe.getYears(type, brand!.value, m.value);
    setYears(res.map((y) => ({ value: y.codigo, label: y.nome })));
    setLoadingYears(false);
  };

  const handleYearSelect = async (y: Option) => {
    setStep(5);
    setLoadingPrice(true);
    const res = await fipe.getSpecificPrice(
      type,
      brand!.value,
      model!.value,
      y.value,
    );
    setPriceData(res);
    setLoadingPrice(false);
  };

  const handleSave = async () => {
    if (!priceData) return;
    setIsSaving(true);
    try {
      const precoNumerico = parseFloat(
        priceData.Valor.replace("R$ ", "").replace(/\./g, "").replace(",", "."),
      );
      await addAsset({
        type: "crypto",
        name: `${priceData.Marca} ${priceData.Modelo}`.slice(0, 50),
        ticker: priceData.CodigoFipe,
        amount: 1,
        averagePrice: precoNumerico,
        currentPrice: precoNumerico,
        currency: "BRL",
        sector: "Bem Físico",
      });
      setSavedOk(true);
      setTimeout(() => {
        setSavedOk(false);
        setShowWizard(false);
        resetWizard();
        onSaved?.();
      }, 1800);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const resetWizard = () => {
    setBrand(null);
    setModel(null);
    setPriceData(null);
    setModels([]);
    setYears([]);
    setStep(1);
  };

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(8,14,31,1) 0%, rgba(3,7,18,1) 100%)",
        border: "1px solid rgba(74,139,255,0.15)",
      }}
    >
      {/* Grid background texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Car size={20} />
          </div>
          <div>
            <div className="text-[15px] font-bold text-white flex items-center gap-2">
              Garagem Mágica
              <span className="bg-blue-500 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]">
                FIPE
              </span>
            </div>
            <div className="text-[11px] text-neutral-500">
              Bens físicos avaliados pela tabela oficial FIPE
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setShowWizard((v) => !v);
            if (!showWizard) resetWizard();
          }}
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all"
        >
          <Plus size={14} />
          Adicionar
        </button>
      </div>

      {/* Existing Vehicles Gallery */}
      {vehicleAssets.length > 0 && (
        <div className="relative z-10 p-5">
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-3">
            Bens cadastrados ({vehicleAssets.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vehicleAssets.map((v) => {
              const priceNum = v.currentPrice || v.averagePrice;
              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/20 group transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl shrink-0">
                    🚗
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-bold text-white truncate"
                      title={v.name}
                    >
                      {v.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-blue-400/70 font-mono bg-blue-500/10 px-2 py-0.5 rounded-full">
                        {v.ticker}
                      </span>
                      <span className="text-[10px] text-white/40">
                        {"FIPE"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black font-mono text-white">
                      {formatCurrency(priceNum)}
                    </div>
                    <div className="text-[9px] text-white/30 mt-0.5">
                      Valor de Mercado
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAsset(v.id)}
                    className="ml-1 w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
            <span className="text-[10px] uppercase text-white/30 tracking-widest font-bold">
              Total de Bens Físicos
            </span>
            <span className="text-sm font-black font-mono text-blue-300">
              {formatCurrency(
                vehicleAssets.reduce(
                  (s, v) => s + (v.currentPrice || v.averagePrice),
                  0,
                ),
              )}
            </span>
          </div>
        </div>
      )}

      {/* Empty state when no vehicles */}
      {vehicleAssets.length === 0 && !showWizard && (
        <div className="relative z-10 p-10 text-center">
          <div className="text-5xl mb-3">🏎️</div>
          <div className="text-sm font-bold text-white/60 mb-1">
            Nenhum bem físico cadastrado
          </div>
          <div className="text-[11px] text-white/30">
            Clique em "Adicionar" para registrar seu carro ou moto pela FIPE.
          </div>
        </div>
      )}

      {/* Wizard Panel */}
      <AnimatePresence>
        {showWizard && (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 overflow-hidden"
          >
            <div className="p-6 border-t border-white/5">
              <StepProgress current={step - 1} total={4} />

              <AnimatePresence mode="wait">
                {/* STEP 1: Vehicle Type */}
                {step === 1 && (
                  <motion.div
                    key="s1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <div className="text-xs text-white/40 uppercase tracking-widest mb-1">
                      Etapa 1
                    </div>
                    <div className="text-[15px] font-bold text-white mb-4">
                      Que tipo de veículo?
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {(
                        [
                          ["carros", "🚗", "Carro"],
                          ["motos", "🏍️", "Moto"],
                          ["caminhoes", "🚛", "Caminhão"],
                        ] as [VehicleType, string, string][]
                      ).map(([t, icon, label]) => (
                        <button
                          key={t}
                          onClick={() => handleTypeSelect(t)}
                          className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-blue-500/10 hover:border-blue-500/40 transition-all flex flex-col items-center gap-2 group"
                        >
                          <span className="text-3xl">{icon}</span>
                          <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Brand */}
                {step === 2 && (
                  <motion.div
                    key="s2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-white/40 uppercase tracking-widest">
                        Etapa 2 — Fabricante
                      </div>
                      <button
                        onClick={() => setStep(1)}
                        className="text-[10px] text-neutral-500 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw size={10} /> Voltar
                      </button>
                    </div>
                    <div className="text-[15px] font-bold text-white mb-4">
                      Qual a marca?
                    </div>
                    <SearchableSelect
                      options={brands}
                      onSelect={handleBrandSelect}
                      placeholder="Buscar marca (ex: Volkswagen, Honda...)"
                      loading={loadingBrands}
                    />
                  </motion.div>
                )}

                {/* STEP 3: Model */}
                {step === 3 && (
                  <motion.div
                    key="s3"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-white/40 uppercase tracking-widest">
                        Etapa 3 — Modelo
                      </div>
                      <button
                        onClick={() => setStep(2)}
                        className="text-[10px] text-neutral-500 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw size={10} /> Voltar
                      </button>
                    </div>
                    <div className="text-[15px] font-bold text-white mb-1">
                      Qual o modelo?
                    </div>
                    <div className="text-[11px] text-blue-400/70 mb-3 font-mono">
                      Marca: {brand?.label}
                    </div>
                    <SearchableSelect
                      options={models}
                      onSelect={handleModelSelect}
                      placeholder="Buscar modelo (ex: Gol, Civic, CG 160...)"
                      loading={loadingModels}
                    />
                  </motion.div>
                )}

                {/* STEP 4: Year */}
                {step === 4 && (
                  <motion.div
                    key="s4"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-white/40 uppercase tracking-widest">
                        Etapa 4 — Ano
                      </div>
                      <button
                        onClick={() => setStep(3)}
                        className="text-[10px] text-neutral-500 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw size={10} /> Voltar
                      </button>
                    </div>
                    <div className="text-[15px] font-bold text-white mb-1">
                      Ano do veículo?
                    </div>
                    <div className="text-[11px] text-blue-400/70 mb-3 font-mono">
                      {brand?.label} — {model?.label}
                    </div>
                    {loadingYears ? (
                      <div className="flex items-center gap-2 py-4 text-blue-400/80 text-sm">
                        <Loader2 className="animate-spin" size={16} />
                        <span className="font-mono tracking-wider text-[11px] uppercase">
                          Consultando FIPE...
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                        {years.map((y) => (
                          <button
                            key={y.value}
                            onClick={() => handleYearSelect(y)}
                            className="p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-blue-500/10 hover:border-blue-500/40 text-sm font-bold text-white/80 hover:text-white transition-all"
                          >
                            {y.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 5: Result */}
                {step === 5 && (
                  <motion.div
                    key="s5"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {loadingPrice ? (
                      <div className="py-12 flex flex-col items-center gap-3 text-blue-400/80">
                        <Loader2 className="animate-spin" size={32} />
                        <span className="font-mono text-[11px] uppercase tracking-widest">
                          Avaliando pela FIPE...
                        </span>
                      </div>
                    ) : savedOk ? (
                      <div className="py-10 text-center">
                        <div className="text-5xl mb-3">✅</div>
                        <div className="text-sm font-bold text-emerald-400">
                          Veículo adicionado ao patrimônio!
                        </div>
                      </div>
                    ) : priceData ? (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-xs text-white/40 uppercase tracking-widest">
                            Avaliação Oficial FIPE
                          </div>
                          <button
                            onClick={() => setStep(4)}
                            className="text-[10px] text-neutral-500 hover:text-white flex items-center gap-1 transition-colors"
                          >
                            <RefreshCw size={10} /> Voltar
                          </button>
                        </div>

                        {/* Price highlighted */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 mb-4 text-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent pointer-events-none" />
                          <div className="text-[10px] uppercase tracking-widest text-blue-400/70 font-bold mb-1">
                            Valor de Mercado
                          </div>
                          <div className="text-3xl font-black font-mono text-white tracking-tight drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                            {priceData.Valor}
                          </div>
                          <div className="text-[10px] text-white/30 mt-1">
                            Referência: {priceData.MesReferencia}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 mb-5 text-[12px]">
                          {[
                            ["Veículo", priceData.Modelo],
                            ["Marca", priceData.Marca],
                            ["Ano Modelo", `${priceData.AnoModelo}`],
                            ["Combustível", priceData.Combustivel],
                            ["Código FIPE", priceData.CodigoFipe],
                          ].map(([k, v]) => (
                            <div
                              key={k}
                              className="flex justify-between items-baseline"
                            >
                              <span className="text-white/40">{k}</span>
                              <span
                                className="font-medium text-white text-right max-w-[60%] truncate"
                                title={v}
                              >
                                {v}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              resetWizard();
                              setShowWizard(false);
                            }}
                            className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-bold hover:bg-white/5 transition-all"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all disabled:opacity-60"
                          >
                            {isSaving ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <>
                                <Plus size={16} /> Adicionar ao Patrimônio
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {fipe.error && (
                      <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-start gap-2">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        {fipe.error}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
