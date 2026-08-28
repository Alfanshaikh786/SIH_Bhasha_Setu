import React from 'react';

interface BhashaSetuLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const BhashaSetuLogo: React.FC<BhashaSetuLogoProps> = ({ 
  className = '', 
  size = 'md',
  showTagline = true 
}) => {
  const sizeClasses = {
    sm: {
      bhasha: 'text-xl sm:text-2xl',
      divider: 'h-5 sm:h-6 w-[2px]',
      setu: 'text-xl sm:text-2xl',
      tagline: 'text-[6.5px] sm:text-[7.5px] tracking-tight mt-0.5',
      gap: 'gap-1'
    },
    md: {
      bhasha: 'text-2xl sm:text-3xl lg:text-[34px]',
      divider: 'h-7 sm:h-8 lg:h-9 w-[2px] sm:w-[2.5px]',
      setu: 'text-2xl sm:text-3xl lg:text-[34px]',
      tagline: 'text-[7.5px] sm:text-[9px] lg:text-[10px] tracking-tight sm:tracking-normal mt-0.5',
      gap: 'gap-1 sm:gap-1.5'
    },
    lg: {
      bhasha: 'text-3xl sm:text-4xl lg:text-5xl',
      divider: 'h-9 sm:h-11 w-[3px]',
      setu: 'text-3xl sm:text-4xl lg:text-5xl',
      tagline: 'text-[9.5px] sm:text-[11.5px] tracking-normal mt-1',
      gap: 'gap-1.5 sm:gap-2'
    }
  }[size];

  return (
    <div className={`inline-flex flex-col select-none items-start justify-center ${className}`}>
      {/* Top Main Logo Line: [भाषा] | [SETU] */}
      <div className={`flex items-center ${sizeClasses.gap} leading-none`}>
        {/* Devanagari भाषा */}
        <span 
          className={`font-black text-[#165a2e] tracking-tight ${sizeClasses.bhasha}`}
          style={{ 
            fontFamily: "'Noto Sans Devanagari', 'Inter', sans-serif",
            fontWeight: 900,
            letterSpacing: '-0.02em'
          }}
        >
          भाषा
        </span>

        {/* Vertical Line Divider */}
        <div className={`bg-[#165a2e] rounded-full flex-shrink-0 ${sizeClasses.divider}`} />

        {/* English SETU in Vibrant Saffron Orange */}
        <span 
          className={`font-black text-[#ea580c] tracking-tight ${sizeClasses.setu}`}
          style={{ 
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontWeight: 900,
            letterSpacing: '-0.01em'
          }}
        >
          SETU
        </span>
      </div>

      {/* Official Tagline: BRIDGING TRIBAL LANGUAGES | A TRANSLATOR FOR MIGRANT TEACHERS */}
      {showTagline && (
        <div className="w-full">
          <span 
            className={`block font-black text-[#165a2e] uppercase font-sans ${sizeClasses.tagline}`}
            style={{ 
              fontFamily: "'Outfit', 'Inter', sans-serif",
              fontWeight: 800
            }}
          >
            BRIDGING TRIBAL LANGUAGES | A TRANSLATOR FOR MIGRANT TEACHERS
          </span>
        </div>
      )}
    </div>
  );
};

// Aliases for compatibility
export const AdiVaaniLogo = BhashaSetuLogo;
export default BhashaSetuLogo;
