import { useDrag } from '@use-gesture/react';
import { motion, useAnimation } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { ReactNode } from 'react';

interface SwipeToDeleteProps {
  children: ReactNode;
  onDelete: () => void;
  className?: string;
}

export function SwipeToDelete({ children, onDelete, className = '' }: SwipeToDeleteProps) {
  const controls = useAnimation();
  
  const bind = useDrag(async ({ active, movement: [x], direction: [xDir], velocity: [vx] }) => {
    const trigger = x < -100; // Trigger delete if dragged left more than 100px
    
    if (!active && trigger) {
      await controls.start({ x: -200, opacity: 0 });
      onDelete();
      // Reset after delete animation (optional, depending on list behavior)
    } else {
      controls.start({ x: active ? x : 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    }
  }, {
    axis: 'x',
    filterTaps: true,
    from: () => [0, 0],
    bounds: { left: -200, right: 0, top: 0, bottom: 0 },
    rubberband: true
  });

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Delete Action */}
      <div className="absolute inset-y-0 right-0 w-24 bg-red-500 flex items-center justify-center rounded-r-xl z-0">
        <Trash2 className="text-white w-6 h-6" />
      </div>

      {/* Foreground Content */}
      <motion.div
        {...(bind() as any)}
        animate={controls}
        className="relative z-10 bg-slate-900 touch-pan-y"
        style={{ touchAction: 'pan-y' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
