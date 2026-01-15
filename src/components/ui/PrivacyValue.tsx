import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/formatters";

interface PrivacyValueProps {
  value: number;
  className?: string;
  isRaw?: boolean;
}

export const PrivacyValue = ({
  value,
  className,
  isRaw,
}: PrivacyValueProps) => {
  const { privacyMode } = useAuth();

  if (privacyMode) {
    return <span className={className}>••••••</span>;
  }

  return (
    <span className={className}>{isRaw ? value : formatCurrency(value)}</span>
  );
};
