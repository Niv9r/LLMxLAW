// This file will be created.
import React from 'react';
import { cn } from '@/lib/utils';
import { SimulationPhase } from '@/lib/simulation-types';

type ProceduralRoadmapProps = {
  currentPhase: SimulationPhase;
};

const phases: SimulationPhase[] = [
  'OPENING_STATEMENTS',
  'WITNESS_EXAMINATION',
  'CLOSING_ARGUMENTS',
  'COMPLETE',
];

const phaseLabels: Record<SimulationPhase, string> = {
  SETUP: 'Setup',
  OPENING_STATEMENTS: 'Opening Statements',
  WITNESS_EXAMINATION: 'Witness Examination',
  CLOSING_ARGUMENTS: 'Closing Arguments',
  COMPLETE: 'Hearing Complete',
};

export function ProceduralRoadmap({ currentPhase }: ProceduralRoadmapProps) {
  const currentIndex = phases.indexOf(currentPhase);

  return (
    <div className="flex items-center justify-between w-full p-2 bg-card/60 backdrop-blur-sm border border-border/20 rounded-lg shadow-lg">
      {phases.map((phase, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <React.Fragment key={phase}>
            <div className="flex flex-col items-center text-center px-2">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                  isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'bg-secondary border-border',
                  isCurrent ? 'border-primary scale-110 shadow-lg shadow-primary/20' : ''
                )}
              >
                {index + 1}
              </div>
              <p
                className={cn(
                  'text-xs mt-2 font-semibold transition-colors',
                  isCompleted || isCurrent ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {phaseLabels[phase]}
              </p>
            </div>
            {index < phases.length - 1 && (
              <div className={cn("flex-1 h-0.5 transition-all duration-500", isCompleted ? 'bg-primary' : 'bg-border/20')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
