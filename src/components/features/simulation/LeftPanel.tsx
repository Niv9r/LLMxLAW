// This file will be created.
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

type LeftPanelProps = {
  opponentLastSaid: string;
};

export function LeftPanel({ opponentLastSaid }: LeftPanelProps) {
  return (
    <Card className="flex flex-col bg-card/60 backdrop-blur-sm border-destructive/20 shadow-xl shadow-black/20">
      <CardHeader>
        <div className="flex items-center gap-3 text-red-400">
          <User className="h-6 w-6" />
          <CardTitle className="font-headline text-2xl">Opposing Counsel</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 bg-background/50 rounded-b-lg">
        <p className="text-sm whitespace-pre-wrap">{opponentLastSaid}</p>
      </CardContent>
    </Card>
  );
}
