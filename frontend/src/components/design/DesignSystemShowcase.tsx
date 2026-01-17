import React, { useState } from "react";
import { motion } from "framer-motion";

export const DesignSystemShowcase = () => {
  const [activeTab, setActiveTab] = useState("colors");

  const colorPalettes = {
    primary: [
      { name: "50", hex: "#f0f9ff" },
      { name: "100", hex: "#e0f2fe" },
      { name: "200", hex: "#bae6fd" },
      { name: "300", hex: "#7dd3fc" },
      { name: "400", hex: "#38bdf8" },
      { name: "500", hex: "#0ea5e9", css: "var(--primary)" },
      { name: "600", hex: "#0284c7" },
      { name: "700", hex: "#0369a1" },
      { name: "800", hex: "#075985" },
      { name: "900", hex: "#0c4a6e" },
    ],
    neutral: [
      { name: "50", hex: "#fafafa" },
      { name: "100", hex: "#f4f4f5" },
      { name: "200", hex: "#e4e4e7" },
      { name: "300", hex: "#d4d4d8" },
      { name: "400", hex: "#a1a1aa" },
      { name: "500", hex: "#71717a" },
      { name: "600", hex: "#52525b" },
      { name: "700", hex: "#3f3f46" },
      { name: "800", hex: "#27272a" },
      { name: "900", hex: "#18181b" },
    ],
  };

  const semantic = [
    { name: "Success", color: "hsl(var(--success))" },
    { name: "Warning", color: "hsl(var(--warning))" },
    { name: "Error", color: "hsl(var(--destructive))" },
    { name: "Info", color: "hsl(var(--primary))" },
  ];

  return (
    <div className="space-y-12 pb-20">
      <header className="flex justify-between items-center mb-12">
        <h2 className="text-4xl font-heading font-bold text-gradient">
          Design System 2025
        </h2>
        <div className="flex gap-4 p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
          {["colors", "typography", "components", "effects"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Colors Tab */}
      {activeTab === "colors" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <section>
            <h3 className="text-xl font-heading font-semibold mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              Primary Blue Palette
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
              {colorPalettes.primary.map((color) => (
                <div key={color.name} className="space-y-2">
                  <div
                    className="h-24 rounded-2xl shadow-inner border border-white/5"
                    style={{ backgroundColor: color.css || color.hex }}
                  />
                  <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold opacity-60">
                    <span>{color.name}</span>
                    <span>{color.hex}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-heading font-semibold mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-muted-foreground rounded-full" />
              Semantic Colors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {semantic.map((item) => (
                <div key={item.name} className="glass-card p-6 space-y-4">
                  <div
                    className="h-2 w-full rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <p className="font-bold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.color}</p>
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      )}

      {/* Typography Tab */}
      {activeTab === "typography" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="glass-card p-10 space-y-10">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Heading 5XL (var(--text-5xl))
              </p>
              <h1 className="text-5xl font-heading font-extrabold tracking-tighter">
                Ultra Premium Control
              </h1>
            </div>
            <div className="space-y-2 border-t border-white/5 pt-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Heading 3XL (var(--text-3xl))
              </p>
              <h2 className="text-3xl font-heading font-bold tracking-tight">
                Financial Intelligence for Enterprise
              </h2>
            </div>
            <div className="space-y-2 border-t border-white/5 pt-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Body Base (var(--text-base))
              </p>
              <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
                This modular scale ensures perfect vertical rhythm and
                readability across all devices. Every font size is derived from
                a base unit multiplied by 1.25.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Components Tab */}
      {activeTab === "components" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <div className="glass-card p-8 space-y-6">
            <h3 className="text-lg font-bold">Button Variants</h3>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px] active:scale-95">
                Primary Button
              </button>
              <button className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium border border-white/10 transition-all hover:bg-white/15">
                Secondary
              </button>
              <button className="px-6 py-3 bg-transparent text-primary rounded-xl font-medium border border-primary/30 transition-all hover:bg-primary/5">
                Outline
              </button>
            </div>
          </div>
          <div className="glass-card p-8 space-y-6">
            <h3 className="text-lg font-bold">Input States</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Default Input"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <p className="text-xs text-primary font-medium">
                  Informational message here.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Effects Tab */}
      {activeTab === "effects" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="glass-card h-64 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary shadow-primary flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-white/20 animate-spin border-t-white" />
            </div>
            <div>
              <h4 className="font-bold">Glow Effect</h4>
              <p className="text-xs text-muted-foreground">
                Shadow primary with 0.3 opacity
              </p>
            </div>
          </div>
          <div className="glass-card h-64 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
            <h4 className="relative z-10 font-bold">Soft Glass</h4>
          </div>
          <div className="glass-card h-64 flex flex-col items-center justify-center p-8 text-center space-y-4 hover:border-primary/50 cursor-pointer transition-all active:scale-95">
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "70%" }}
                className="h-full bg-primary"
              />
            </div>
            <h4 className="font-bold">Micro-interactions</h4>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DesignSystemShowcase;
