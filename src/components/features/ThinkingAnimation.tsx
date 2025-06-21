'use client';

import { useState, useEffect } from 'react';

const stages = [
  { name: 'Advocate', model: 'Gemini', color: '56, 189, 248' }, // sky-400
  { name: 'Adversary', model: 'Gemini', color: '248, 113, 113' }, // red-400
  { name: 'Arbiter', model: 'Gemini', color: '251, 191, 36' }, // amber-400
];

export function ThinkingAnimation() {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const timers = stages.map((_, index) => 
      setTimeout(() => {
        setActiveStage(index);
      }, index * 2500)
    );

    const finalTimer = setTimeout(() => {
        setActiveStage(stages.length);
    }, stages.length * 2500)

    return () => {
        timers.forEach(clearTimeout);
        clearTimeout(finalTimer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-[50vh] animate-fade-in">
      <div className="flex items-center justify-center space-x-8 md:space-x-16">
        {stages.map((stage, index) => (
          <div key={stage.name} className="flex flex-col items-center text-center">
            <div
              className="relative h-24 w-24 md:h-32 md:w-32 rounded-full border-2 transition-all duration-500 flex items-center justify-center"
              style={{
                borderColor: `rgba(${stage.color}, ${index <= activeStage ? '0.5' : '0.2'})`,
                backgroundColor: `rgba(${stage.color}, ${index <= activeStage ? '0.1' : '0.05'})`,
                '--glow-color': stage.color,
              } as React.CSSProperties}
            >
              <div
                className={`h-full w-full rounded-full transition-all duration-500 ${
                  index === activeStage ? 'animate-pulse-glow' : ''
                }`}
              />
            </div>
            <div className="mt-4 transition-opacity duration-500" style={{ opacity: index <= activeStage ? 1 : 0.5 }}>
              <p className="font-headline text-lg md:text-xl font-bold text-slate-200">{stage.name}</p>
              <p className="text-sm text-muted-foreground">{stage.model}</p>
            </div>
          </div>
        ))}
      </div>
       <p className="mt-12 text-lg text-slate-400 animate-pulse">Simulating tribunal deliberation...</p>
    </div>
  );
}
