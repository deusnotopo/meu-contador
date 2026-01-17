import { motion } from "framer-motion";
import { FileQuestion, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mb-6 p-6 bg-muted/50 rounded-full"
      >
        {icon || <FileQuestion size={48} className="text-muted-foreground" />}
      </motion.div>

      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>

      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button onClick={action.onClick} size="lg" className="gap-2">
            <Sparkles size={18} />
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

// Specific empty states
export const NoTransactionsEmpty = ({
  onAddClick,
}: {
  onAddClick: () => void;
}) => {
  return (
    <EmptyState
      icon={<TrendingUp size={48} className="text-primary" />}
      title="Nenhuma transação ainda"
      description="Comece a registrar suas receitas e despesas para ter uma visão completa da sua saúde financeira."
      action={{
        label: "Adicionar Primeira Transação",
        onClick: onAddClick,
      }}
    />
  );
};

export const NoInvoicesEmpty = ({ onAddClick }: { onAddClick: () => void }) => {
  return (
    <EmptyState
      icon={<FileQuestion size={48} className="text-primary" />}
      title="Nenhuma nota fiscal cadastrada"
      description="Organize suas notas fiscais e mantenha o controle do seu negócio em dia."
      action={{
        label: "Emitir Primeira Nota",
        onClick: onAddClick,
      }}
    />
  );
};

export const NoDataEmpty = () => {
  return (
    <EmptyState
      icon={<Sparkles size={48} className="text-muted-foreground" />}
      title="Sem dados para exibir"
      description="Adicione algumas transações para ver insights e análises inteligentes aqui."
    />
  );
};
