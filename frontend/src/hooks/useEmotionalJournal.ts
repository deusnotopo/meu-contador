import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { showSuccess } from "@/lib/toast";
import { api } from "@/lib/api";
import type {
  EmotionalEntry,
  EmotionalPattern,
  EmotionalInsight,
  EmotionType,
} from "@/types/emotional";
import { EMOTION_CONFIG } from "@/types/emotional";

const fetchEmotionalData = async (): Promise<EmotionalEntry[]> => {
  try {
    const data = await api.get<{ emotionalData: EmotionalEntry[] }>(
      "/users/emotional",
    );
    return data.emotionalData || [];
  } catch (error) {
    console.error("Error fetching emotional data:", error);
    return [];
  }
};

const saveEmotionalData = async (
  entries: EmotionalEntry[],
): Promise<boolean> => {
  try {
    await api.put("/users/emotional", { emotionalData: entries });
    return true;
  } catch (error) {
    console.error("Error saving emotional data:", error);
    return false;
  }
};

export function useEmotionalJournal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<EmotionalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setIsLoading(true);
        const data = await fetchEmotionalData();
        setEntries(data || []);
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const saveEntries = useCallback(async (newEntries: EmotionalEntry[]) => {
    await saveEmotionalData(newEntries);
  }, []);

  const addEntry = useCallback(
    (entry: Omit<EmotionalEntry, "id" | "date">) => {
      const newEntry: EmotionalEntry = {
        ...entry,
        id: Date.now().toString(),
        date: new Date().toISOString(),
      };

      setEntries((prev) => {
        const updated = [newEntry, ...prev];
        saveEntries(updated);
        return updated;
      });

      const config = EMOTION_CONFIG[entry.emotion];
      if (config) {
        showSuccess(`${config.emoji} Registro emocional salvo`);
      }

      return newEntry;
    },
    [saveEntries],
  );

  const updateEntry = useCallback(
    (id: string, updates: Partial<EmotionalEntry>) => {
      setEntries((prev) => {
        const updated = prev.map((e) =>
          e.id === id ? { ...e, ...updates } : e,
        );
        saveEntries(updated);
        return updated;
      });
    },
    [saveEntries],
  );

  const deleteEntry = useCallback(
    (id: string) => {
      setEntries((prev) => {
        const updated = prev.filter((e) => e.id !== id);
        saveEntries(updated);
        return updated;
      });
    },
    [saveEntries],
  );

  const getEntriesByDateRange = useCallback(
    (startDate: string, endDate: string) => {
      return entries.filter((e) => e.date >= startDate && e.date <= endDate);
    },
    [entries],
  );

  const getThisWeekEntries = useCallback(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return getEntriesByDateRange(
      weekStart.toISOString(),
      weekEnd.toISOString(),
    );
  }, [getEntriesByDateRange]);

  const patterns = useMemo((): EmotionalPattern[] => {
    const patternMap: Record<
      string,
      {
        count: number;
        totalSpend: number;
        categories: Record<string, number>;
        triggers: Record<string, number>;
        regretCount: number;
      }
    > = {};

    entries.forEach((entry) => {
      const key = entry.emotion;
      if (!patternMap[key]) {
        patternMap[key] = {
          count: 0,
          totalSpend: 0,
          categories: {},
          triggers: {},
          regretCount: 0,
        };
      }

      const pattern = patternMap[key]!;
      pattern.count++;
      pattern.totalSpend += entry.amount || 0;

      if (entry.category) {
        pattern.categories[entry.category] =
          (pattern.categories[entry.category] || 0) + 1;
      }

      entry.triggers?.forEach((trigger) => {
        pattern.triggers[trigger] = (pattern.triggers[trigger] || 0) + 1;
      });

      if (entry.regretLevel && entry.regretLevel >= 4) {
        pattern.regretCount++;
      }
    });

    return Object.entries(patternMap).map(([emotion, data]) => ({
      emotion: emotion as EmotionType,
      frequency: data.count,
      averageSpend: data.count > 0 ? data.totalSpend / data.count : 0,
      topCategories: Object.entries(data.categories)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cat]) => cat),
      topTriggers: Object.entries(data.triggers)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([trigger]) => trigger),
      regretRate: data.count > 0 ? (data.regretCount / data.count) * 100 : 0,
    }));
  }, [entries]);

  const insights = useMemo((): EmotionalInsight[] => {
    const result: EmotionalInsight[] = [];

    if (entries.length < 3) {
      result.push({
        type: "tip",
        title: "Comece seu diário emocional",
        description:
          "Registre suas emoções em pelo menos 3 compras para ver padrões.",
      });
      return result;
    }

    const totalEmotionalSpend = entries.reduce(
      (sum, e) => sum + (e.amount || 0),
      0,
    );
    const regrettedEntries = entries.filter(
      (e) => e.regretLevel && e.regretLevel >= 4,
    );
    const regrettedAmount = regrettedEntries.reduce(
      (sum, e) => sum + (e.amount || 0),
      0,
    );
    const happyEntries = entries.filter(
      (e) => e.emotion === "happy" || e.emotion === "proud",
    );
    const stressEntries = entries.filter(
      (e) => e.emotion === "stressed" || e.emotion === "anxious",
    );

    const happySpendPercent =
      entries.length > 0 ? (happyEntries.length / entries.length) * 100 : 0;
    const stressSpendPercent =
      entries.length > 0 ? (stressEntries.length / entries.length) * 100 : 0;

    const stats = {
      totalEmotionalSpend,
      regrettedAmount,
      happySpendPercent,
      stressSpendPercent,
    };

    if (regrettedEntries.length >= 3) {
      result.push({
        type: "warning",
        title: "Muitas compras com arrependimento",
        description: `Você se arrependeu de ${regrettedEntries.length} compras, totalizando R$ ${regrettedAmount.toLocaleString("pt-BR")}.`,
        recommendation: "Tente esperar 24h antes de compras não essenciais.",
        stats,
      });
    }

    const stressPattern = patterns.find((p) => p.emotion === "stressed");
    if (stressPattern && stressPattern.frequency >= 3) {
      result.push({
        type: "pattern",
        title: "Você compra quando estressado",
        description: `${stressPattern.frequency} compras foram feitas sob estresse, com média de R$ ${stressPattern.averageSpend.toFixed(2)}.`,
        emotion: "stressed",
        recommendation:
          "Quando estressado, tente caminhar ou meditar antes de comprar.",
        stats,
      });
    }

    const impulseEntries = entries.filter((e) => e.motivation === "impulse");
    if (impulseEntries.length >= 3) {
      const impulseTotal = impulseEntries.reduce(
        (sum, e) => sum + (e.amount || 0),
        0,
      );
      result.push({
        type: "warning",
        title: "Padrão de compras por impulso",
        description: `${impulseEntries.length} compras por impulso somaram R$ ${impulseTotal.toLocaleString("pt-BR")}.`,
        recommendation:
          "Use a regra 24-48: espere um dia antes de confirmar a compra.",
        stats,
      });
    }

    if (happySpendPercent >= 70) {
      result.push({
        type: "achievement",
        title: "Compras conscientes! 🎉",
        description: `${happySpendPercent.toFixed(0)}% das suas compras foram feitas com emoções positivas.`,
        emotion: "happy",
        stats,
      });
    }

    const socialPattern = patterns.find((p) => p.emotion === "anxious");
    if (socialPattern && socialPattern.topTriggers.includes("Redes sociais")) {
      result.push({
        type: "pattern",
        title: "Redes sociais influenciam seus gastos",
        description:
          "Você tende a gastar mais após ver posts nas redes sociais.",
        recommendation:
          "Limite o tempo em redes sociais ou siga perfis minimalistas.",
        stats,
      });
    }

    return result;
  }, [entries, patterns]);

  const stats = useMemo(() => {
    const totalEntries = entries.length;
    const thisWeekEntries = getThisWeekEntries();

    const dominantEmotion =
      patterns.length > 0
        ? patterns.reduce((a, b) => (a.frequency > b.frequency ? a : b))
        : null;

    const regretRate =
      totalEntries > 0
        ? (entries.filter((e) => e.regretLevel && e.regretLevel >= 4).length /
            totalEntries) *
          100
        : 0;

    const averageSatisfaction =
      entries.length > 0
        ? entries.reduce((sum, e) => sum + (e.satisfactionLevel || 3), 0) /
          entries.length
        : 0;

    return {
      totalEntries,
      thisWeekCount: thisWeekEntries.length,
      dominantEmotion: dominantEmotion?.emotion || "neutral",
      regretRate,
      averageSatisfaction,
    };
  }, [entries, patterns, getThisWeekEntries]);

  return {
    isLoading,
    entries,
    patterns,
    insights,
    stats,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesByDateRange,
    getThisWeekEntries,
  };
}
