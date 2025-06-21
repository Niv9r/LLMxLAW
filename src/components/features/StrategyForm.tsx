'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Lightbulb, Check, X } from 'lucide-react';
import { Spinner } from '../Spinner';
import { useDebounce } from '@/hooks/use-debounce';
import { optimizePrompt } from '@/lib/actions';
import { getAIErrorMessage } from '@/lib/utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useToast } from '@/hooks/use-toast';

type StrategyFormProps = {
  onSubmit: (strategy: string) => void;
};

export function StrategyForm({ onSubmit }: StrategyFormProps) {
  const { toast } = useToast();
  const [strategy, setStrategy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [suggestedPrompt, setSuggestedPrompt] = useState<string | null>(null);
  
  const debouncedStrategy = useDebounce(strategy, 2000);

  useEffect(() => {
    if (debouncedStrategy.length > 50) {
      const getSuggestion = async () => {
        setIsOptimizing(true);
        try {
          const result = await optimizePrompt({ rawPrompt: debouncedStrategy });
          setSuggestedPrompt(result.suggestedPrompt);
        } catch (error) {
          console.error("Error optimizing prompt:", error);
          // Don't bother user with this error, just fail silently.
        } finally {
          setIsOptimizing(false);
        }
      };
      getSuggestion();
    } else {
        setSuggestedPrompt(null);
    }
  }, [debouncedStrategy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (strategy.trim()) {
      setIsSubmitting(true);
      onSubmit(strategy.trim());
    }
  };

  const useSuggestion = () => {
    if (suggestedPrompt) {
        setStrategy(suggestedPrompt);
        setSuggestedPrompt(null);
        toast({ title: 'Prompt updated', description: 'The suggested prompt has been applied.' });
    }
  }

  const isLoading = isSubmitting || isOptimizing;

  return (
    <Card className="w-full max-w-4xl mx-auto bg-transparent border-0 shadow-none animate-fade-in">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-4xl text-foreground">Submit Your Strategy</CardTitle>
        <CardDescription className="text-lg pt-2 text-slate-400">
          Paste your case facts and initial strategy below to begin the analysis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Textarea
            placeholder="Describe your case facts, legal arguments, and desired outcomes..."
            className="min-h-[300px] text-base bg-slate-900/60 backdrop-blur-sm focus-visible:ring-1 border-slate-800"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            disabled={isSubmitting}
          />

          {suggestedPrompt && (
            <div className="p-3 bg-secondary rounded-md flex items-center justify-between gap-4 animate-fade-in">
                <p className="text-sm text-muted-foreground">We've suggested an optimized prompt for better results.</p>
                <div className="flex items-center gap-2">
                    <Button type="button" size="sm" onClick={useSuggestion}><Check className="mr-2"/> Use Suggested</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setSuggestedPrompt(null)}><X className="mr-2"/> Keep Original</Button>
                </div>
            </div>
          )}

          <div className="flex justify-center items-center gap-4">
            <Button type="submit" disabled={isLoading || !strategy.trim()} size="lg">
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Generate Analysis
                </>
              )}
            </Button>
            <HoverCard>
                <HoverCardTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className={isOptimizing ? 'animate-pulse' : ''}>
                        <Lightbulb className={`h-5 w-5 ${suggestedPrompt ? 'text-amber-400' : 'text-muted-foreground'}`}/>
                    </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                    <h4 className="font-semibold text-foreground mb-2">Prompt Optimization</h4>
                    <p className="text-sm text-muted-foreground">
                        {isOptimizing ? "Optimizing your prompt..." : suggestedPrompt ? "Hover over the suggestion bar to see the optimized version." : "Type more than 50 characters and pause for an AI-powered prompt suggestion to appear."}
                    </p>
                    {suggestedPrompt && (
                        <div className="mt-4 p-2 bg-secondary rounded-md max-h-40 overflow-y-auto">
                            <p className="text-xs text-foreground whitespace-pre-wrap">{suggestedPrompt}</p>
                        </div>
                    )}
                </HoverCardContent>
            </HoverCard>

          </div>
        </form>
      </CardContent>
    </Card>
  );
}
