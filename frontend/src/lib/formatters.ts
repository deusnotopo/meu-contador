export const formatCurrency = (
  value: number,
  currency: string = "BRL"
): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency,
  }).format(value);
};

export const safeDate = (date: string | Date | undefined | null): Date | null => {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
};

export const formatDate = (date: string | Date | undefined | null): string => {
  const d = safeDate(date);
  if (!d) return "Data inválida";
  return new Intl.DateTimeFormat("pt-BR").format(d);
};

export const formatShortDate = (date: string | Date | undefined | null): string => {
  const d = safeDate(date);
  if (!d) return "Recente";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
};

export const formatDateTime = (date: string | Date | undefined | null): string => {
  const d = safeDate(date);
  if (!d) return "Data inválida";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
};
