import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  shape: 'circle' | 'square' | 'triangle';
}

const COLORS = ['#F05A7E', '#00D991', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];
const SHAPES: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];

interface CelebrationProps {
  isVisible: boolean;
  duration?: number;
  onComplete?: () => void;
}

export const Celebration: React.FC<CelebrationProps> = ({ 
  isVisible, 
  duration = 3000,
  onComplete 
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (isVisible) {
      const newParticles = Array.from({ length: 40 }).map((_, i) => {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)] || COLORS[0];
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)] || 'circle';
        return {
          id: i,
          x: Math.random() * 100,
          y: -10,
          color: color as string,
          size: Math.random() * 8 + 4,
          rotation: Math.random() * 360,
          shape: shape as 'circle' | 'square' | 'triangle'
        };
      });
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
      <AnimatePresence>
        {isVisible && particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              top: '-5%', 
              left: `${p.x}%`, 
              opacity: 1, 
              rotate: 0,
              scale: 0
            }}
            animate={{ 
              top: '110%', 
              left: `${p.x + (Math.random() * 20 - 10)}%`,
              rotate: p.rotation * 4,
              scale: 1,
              opacity: [1, 1, 0]
            }}
            transition={{ 
              duration: (Math.random() * 2 + 1.5), 
              ease: [0.23, 0.51, 0.32, 0.95],
            }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'triangle' ? '0' : '2px',
              clipPath: p.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
              boxShadow: `0 0 10px ${p.color}44`
            }}
          />
        ))}
      </AnimatePresence>
      
      {/* Central Flash Effect */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.2, 0], scale: [0.5, 2, 3] }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-white rounded-full blur-[100px]"
          />
        )}
      </AnimatePresence>
    </div>
  );
};
