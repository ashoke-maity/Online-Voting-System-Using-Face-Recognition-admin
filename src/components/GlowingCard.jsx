import React from 'react';

/**
 * GlowingCard wraps content in a high-tech modern frame with interactive glowing borders.
 */
function GlowingCard({ children, title, glowColor = 'indigo' }) {
  const glowClasses = {
    indigo: 'focus-within:ring-[#1B3B6F]/50 shadow-[0_0_15px_rgba(27,59,111,0.08)] border-t-4 border-t-[#1B3B6F]',
    cyan: 'focus-within:ring-[#F58220]/50 shadow-[0_0_15px_rgba(245,130,32,0.08)] border-t-4 border-t-[#F58220]',
    emerald: 'focus-within:ring-[#0B6A3A]/50 shadow-[0_0_15px_rgba(11,106,58,0.08)] border-t-4 border-t-[#0B6A3A]',
  }[glowColor] || 'focus-within:ring-[#1B3B6F]/50 shadow-[0_0_15px_rgba(27,59,111,0.08)] border-t-4 border-t-[#1B3B6F]';

  const headingColors = {
    indigo: 'text-[#1B3B6F]',
    cyan: 'text-[#F58220]',
    emerald: 'text-[#0B6A3A]',
  }[glowColor] || 'text-[#1B3B6F]';

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5.5 transition-all duration-300 hover:shadow-md ${glowClasses}`}>
      {title && (
        <div className="border-b border-slate-100 pb-3 mb-4.5 flex items-center justify-between">
          <h3 className={`text-xs font-black uppercase tracking-wider font-mono ${headingColors}`}>
            {title}
          </h3>
        </div>
      )}
      <div className="focus:outline-none">
        {children}
      </div>
    </div>
  );
}

export default GlowingCard;
