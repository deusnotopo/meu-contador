import { PremiumPlans } from "../subscription/PremiumPlans";
import { useAuth } from "@/context/AuthContext";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { user } = useAuth();
  
  if (!isOpen) return null;

  return <PremiumPlans onClose={onClose} userEmail={user?.email} />;
}
