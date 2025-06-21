// This file will be created.
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Project } from '@/lib/types';
import type { SimulationState, UserAction, TranscriptEntry, Speaker } from '@/lib/simulation-types';
import { runSimulation } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { getAIErrorMessage } from '@/lib/utils';
import { ProceduralRoadmap } from './ProceduralRoadmap';
import { LeftPanel } from './LeftPanel';
import { CenterPanel } from './CenterPanel';
import { RightPanel } from './RightPanel';
import { Spinner } from '@/components/Spinner';

type SimulationClientProps = {
  project: Project;
  onSaveState: (state: SimulationState) => Promise<void>;
};

export function SimulationClient({ project, onSaveState }: SimulationClientProps) {
  const { toast } = useToast();
  const [state, setState] = useState<SimulationState | null>(project.simulationState || null);
  const [isLoading, setIsLoading] = useState(!project.simulationState);
  const [error, setError] = useState<string | null>(null);

  const runSimulationTurn = useCallback(async (userAction?: UserAction) => {
    setIsLoading(true);
    setError(null);
    try {
      const newState = await runSimulation({
        projectId: project.id,
        caseStrategy: project.strategy || '',
        currentState: state || undefined,
        userAction: userAction,
      });
      setState(newState);
      await onSaveState(newState);
    } catch (err) {
      const errorMessage = getAIErrorMessage(err);
      setError(errorMessage);
      toast({ title: 'Simulation Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [project, state, onSaveState, toast]);

  // Initial run to setup the simulation
  useEffect(() => {
    if (!state) {
      runSimulationTurn();
    }
  }, [state, runSimulationTurn]);

  if (!state) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-8">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Initializing simulation...</p>
          {error && <p className="mt-4 text-destructive">{error}</p>}
      </div>
    );
  }

  const opponentLastSaid = state.transcript.slice().reverse().find(t => t.speaker === 'OPPOSING_COUNSEL')?.text || 'Awaiting submissions...';
  const tribunalLastSaid = state.transcript.slice().reverse().find(t => t.speaker === 'TRIBUNAL')?.text || 'Awaiting hearing to commence...';
  const latestCoachingTip = state.transcript.slice().reverse().find(t => t.speaker === 'COACHING')?.text;

  return (
    <div className="flex h-screen w-full flex-col p-4 bg-background/80 text-foreground">
      <ProceduralRoadmap currentPhase={state.phase} />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0 pt-4">
        {/* Left Panel */}
        <LeftPanel opponentLastSaid={opponentLastSaid} />

        {/* Center Panel */}
        <CenterPanel
          transcript={state.transcript}
          isAwaitingUserInput={state.isAwaitingUserInput}
          isLoading={isLoading}
          currentPhase={state.phase}
          onUserAction={runSimulationTurn}
        />
        
        {/* Right Panel */}
        <RightPanel 
          tribunalLastSaid={tribunalLastSaid}
          caseStrength={state.caseStrength}
          coachingTip={latestCoachingTip}
        />
      </div>
    </div>
  );
}
