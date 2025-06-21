// This file will be created.
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/Spinner';
import type { TranscriptEntry, SimulationPhase, UserAction, Speaker } from '@/lib/simulation-types';
import { cn } from '@/lib/utils';
import { Bot, Lightbulb, Mic, Scale, User, FileText } from 'lucide-react';

type CenterPanelProps = {
  transcript: TranscriptEntry[];
  isAwaitingUserInput: boolean;
  isLoading: boolean;
  currentPhase: SimulationPhase;
  onUserAction: (action: UserAction) => void;
};

const SpeakerIcon = ({ speaker }: { speaker: Speaker }) => {
    switch (speaker) {
        case 'TRIBUNAL': return <Scale className="h-4 w-4 text-amber-400" />;
        case 'OPPOSING_COUNSEL': return <User className="h-4 w-4 text-red-400" />;
        case 'USER': return <User className="h-4 w-4 text-sky-400" />;
        case 'WITNESS': return <User className="h-4 w-4 text-green-400" />;
        case 'COACHING': return <Lightbulb className="h-4 w-4 text-purple-400" />;
        default: return <FileText className="h-4 w-4" />;
    }
}

export function CenterPanel({ transcript, isAwaitingUserInput, isLoading, currentPhase, onUserAction }: CenterPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    let actionType: UserAction['type'];
    switch (currentPhase) {
        case 'OPENING_STATEMENTS': actionType = 'SUBMIT_STATEMENT'; break;
        case 'WITNESS_EXAMINATION': actionType = 'SUBMIT_QUESTION'; break;
        case 'CLOSING_ARGUMENTS': actionType = 'SUBMIT_CLOSING'; break;
        default: return;
    }

    onUserAction({ type: actionType, payload: inputValue });
    setInputValue('');
  };

  const renderActionForm = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center p-4"><Spinner /></div>;
    }
    if (!isAwaitingUserInput) {
      return <div className="p-4 text-center text-sm text-muted-foreground">Awaiting response...</div>;
    }

    const isStatement = currentPhase === 'OPENING_STATEMENTS' || currentPhase === 'CLOSING_ARGUMENTS';
    const placeholder = isStatement ? `Enter your ${currentPhase.toLowerCase().replace('_', ' ')}...` : 'Enter your question for the witness...';
    
    return (
      <form onSubmit={handleSubmit} className="p-4 border-t border-border/20 space-y-2">
        {isStatement ? (
          <Textarea 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="bg-slate-900/60 min-h-[100px]"
            disabled={isLoading}
          />
        ) : (
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="bg-slate-900/60"
            disabled={isLoading}
          />
        )}
        <div className="flex justify-end gap-2">
            {currentPhase === 'WITNESS_EXAMINATION' && (
                 <Button type="button" variant="outline" onClick={() => onUserAction({ type: 'END_EXAMINATION' })} disabled={isLoading}>
                    End Cross-Examination
                </Button>
            )}
            <Button type="submit" disabled={isLoading || !inputValue.trim()}>
                Submit
            </Button>
        </div>
      </form>
    );
  };
  
  return (
    <Card className="col-span-1 lg:col-span-2 flex flex-col bg-card/60 backdrop-blur-sm border-border/20 shadow-xl shadow-black/20">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary flex items-center gap-3">
          <Mic className="h-6 w-6" /> The Record
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col p-0">
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {transcript.map((entry, index) => (
              <div key={index} className={cn("flex items-start gap-3 text-sm", entry.speaker === 'COACHING' && 'p-3 rounded-lg bg-purple-900/20 border border-purple-500/30')}>
                 <div className="shrink-0"><SpeakerIcon speaker={entry.speaker} /></div>
                 <div>
                    <span className="font-bold text-foreground/80 capitalize">{entry.speaker.toLowerCase().replace('_', ' ')}:</span>
                    <p className="whitespace-pre-wrap mt-1 text-foreground/90">{entry.text}</p>
                 </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        {renderActionForm()}
      </CardContent>
    </Card>
  );
}
