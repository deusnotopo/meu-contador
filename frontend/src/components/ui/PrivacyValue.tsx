import { usePreferences } from "@/context/PreferencesContext";
import { formatCurrency } from "@/lib/formatters";

interface PrivacyValueProps {
  value: number;
  className?: string;
  isRaw?: boolean;
  displayValue?: string;
  currency?: string;
}

export const PrivacyValue = ({
  value,
  className,
  isRaw,
  displayValue,
  currency = "BRL",
}: PrivacyValueProps) => {
  const { privacyMode } = usePreferences();

  if (privacyMode) {
    return <span className={className}>••••••</span>;
  }

  return (
    <span className={className}>
      {displayValue || (isRaw ? value : formatCurrency(value, currency))}
    </span>
  );
};
