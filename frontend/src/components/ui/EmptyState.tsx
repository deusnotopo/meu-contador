
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tips?: string[];
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  tips,
}: EmptyStateProps) => {
  return (
    <div 
      className="card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '32px 24px', 
        textAlign: 'center',
        borderStyle: 'dashed',
        background: 'rgba(255,255,255,0.02)',
        animation: 'fsu 0.4s ease-out'
      }}
    >
      <div 
        style={{ 
          padding: '16px', 
          background: 'var(--purple-d)', 
          borderRadius: '16px', 
          marginBottom: '16px', 
          color: 'var(--purple)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon size={32} />
      </div>
      
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--t1)', marginBottom: '8px' }}>
        {title}
      </h3>
      
      <p style={{ fontSize: '13px', color: 'var(--t2)', lineHeight: 1.5, maxWidth: '240px', marginBottom: '20px' }}>
        {description}
      </p>

      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="btn-p"
          style={{ width: 'auto', padding: '10px 24px', fontSize: '13px' }}
        >
          {actionLabel}
        </button>
      )}

      {tips && tips.length > 0 && (
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', width: '100%' }}>
          <div className="eyebrow" style={{ textAlign: 'center', marginBottom: '8px' }}>
            💡 Dica de Mestre
          </div>
          <div className="nudge good" style={{ textAlign: 'left', margin: 0, padding: '12px' }}>
            <div className="nudge-body" style={{ fontSize: '12px' }}>
              {tips[0]}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
