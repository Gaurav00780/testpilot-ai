import React from 'react';
import { motion } from 'framer-motion';

export function TextAnimate({ 
  children, 
  animation = "blurIn", 
  as: Component = 'div', 
  className = '',
  by = 'word' 
}) {
  const MotionComponent = motion(Component);

  // Fallback for non-string children (e.g. if they pass complex React nodes)
  if (typeof children !== 'string') {
    return (
      <MotionComponent
        initial={{ opacity: 0, filter: animation === 'blurIn' ? 'blur(10px)' : 'none' }}
        whileInView={{ opacity: 1, filter: 'blur(0px)' }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className={className}
      >
        {children}
      </MotionComponent>
    );
  }

  const segments = by === 'word' ? children.split(' ') : children.split('');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: by === 'word' ? 0.12 : 0.04,
      }
    }
  };

  const childVariants = {
    hidden: { 
      opacity: 0, 
      filter: animation === 'blurIn' ? 'blur(10px)' : 'none',
      y: animation.includes('Up') ? 20 : 0
    },
    visible: { 
      opacity: 1, 
      filter: 'blur(0px)',
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' }
    }
  };

  return (
    <MotionComponent
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {segments.map((segment, i) => (
        <motion.span
          key={i}
          variants={childVariants}
          className="inline-block"
          style={{ whiteSpace: by === 'word' ? 'pre' : 'pre-wrap' }}
        >
          {segment}{by === 'word' ? ' ' : ''}
        </motion.span>
      ))}
    </MotionComponent>
  );
}
