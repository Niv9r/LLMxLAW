// This file will be created.
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Scale } from 'lucide-react';
import { CaseStrengthMeter } from './CaseStrengthMeter';

type RightPanelProps = {
  tribunalLastSaid: string;
  caseStrength: number;
  coachingTip?: string;
};

export function RightPanel({ tribunalLastSaid, caseStrength, coachingTip }: RightPanelProps) {
  return (
    <Card className="flex flex-col bg-card/60 backdrop-blur-sm border-amber-400/20 shadow-xl shadow-black/20">
      <CardHeader>
        <div className="flex items-center gap-3 text-amber-400">
          <Scale className="h-6 w-6" />
          <CardTitle className="font-headline text-2xl">Arbitral Tribunal</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-y-auto">
        <div className="p-4 bg-background/50 rounded-lg flex-1">
          <p className="text-sm whitespace-pre-wrap">{tribunalLastSaid}</p>
        </div>
        <div className="p-4 bg-background/50 rounded-lg">
            <h4 className="font-semibold text-foreground mb-4 text-center">Case Strength</h4>
            <CaseStrengthMeter value={caseStrength} />
        </div>
        {coachingTip && (
             <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Lightbulb className="text-purple-400"/> Coaching Tip</h4>
                <p className="text-sm whitespace-pre-wrap text-foreground/90">{coachingTip}</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
