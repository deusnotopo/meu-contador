import React, { useState } from 'react';
import { Button } from '../ui/button';
import { HelpCircle } from 'lucide-react';
import { OnboardingWizard } from './OnboardingWizard';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface OnboardWizardButtonProps {
  /**
   * Posicionamento do botão no formulário
   * @default 'top-right'
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline';
  
  /**
   * Variante do botão
   * @default 'ghost'
   */
  variant?: 'default' | 'secondary' | 'ghost' | 'outline';
  
  /**
   * Tamanho do botão
   * @default 'sm'
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  
  /**
   * Texto do tooltip
   * @default 'Abrir Assistente de Configuração'
   */
  tooltipText?: string;
  
  /**
   * Label do botão
   * @default 'Configurar'
   */
  label?: string;
  
  /**
   * Callback quando o wizard é fechado
   */
  onWizardClose?: () => void;
  
  /**
   * Callback quando uma etapa é concluída
   */
  onStepComplete?: (stepIndex: number) => void;

  /**
   * Classes CSS customizadas
   */
  className?: string;
}

/**
 * Botão reutilizável para abrir o Assistente de Onboarding (Wizard)
 * Pode ser adicionado a qualquer formulário ou tela que necessite orientação ao usuário
 * 
 * @component
 * @example
 * // Uso básico
 * <OnboardWizardButton />
 * 
 * @example
 * // Com callbacks
 * <OnboardWizardButton
 *   label="Precisa de ajuda?"
 *   tooltipText="Clique aqui para uma orientação passo a passo"
 *   onWizardClose={() => console.log('Wizard fechado')}
 *   onStepComplete={(step) => console.log(`Etapa ${step} concluída`)}
 *   position="top-right"
 * />
 */
const OnboardWizardButton: React.FC<OnboardWizardButtonProps> = ({
  position = 'top-right',
  variant = 'ghost',
  size = 'sm',
  tooltipText = 'Abrir Assistente de Configuração',
  label = 'Configurar',
  onWizardClose,
  className = '',
}) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    onWizardClose?.();
  };


  // Estilos de posicionamento
  const positionStyles: Record<string, string> = {
    'top-left': 'absolute top-2 left-2',
    'top-right': 'absolute top-2 right-2',
    'bottom-left': 'absolute bottom-2 left-2',
    'bottom-right': 'absolute bottom-2 right-2',
    'inline': 'relative',
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`${positionStyles[position]} ${className}`}>
              <Button
                variant={variant}
                size={size}
                onClick={() => setIsWizardOpen(true)}
                className="flex items-center gap-2"
                aria-label="Abrir Assistente de Onboarding"
              >
                <HelpCircle className="w-4 h-4" />
                {label}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>{tooltipText}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isWizardOpen && (
        <OnboardingWizard
          onComplete={handleWizardClose}
          onSkip={handleWizardClose}
        />
      )}
    </>
  );
};

export default OnboardWizardButton;
