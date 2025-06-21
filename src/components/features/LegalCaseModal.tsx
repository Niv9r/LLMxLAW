'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateLegalSummary } from '@/lib/actions';
import { getAIErrorMessage } from '@/lib/utils';
import { Spinner } from '@/components/Spinner';

type LegalCaseModalProps = {
  caseName: string;
  onClose: () => void;
};

type SummaryData = {
    summary: string;
    sourceText: string;
    directQuote: string;
}

export function LegalCaseModal({ caseName, onClose }: LegalCaseModalProps) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseName) return;

    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await generateLegalSummary({ caseName });
        setData(result);
      } catch (err) {
        setError(getAIErrorMessage(err));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [caseName]);

  const renderSourceText = () => {
    if (!data?.sourceText || !data.directQuote) {
        return <p className="text-sm text-slate-400 whitespace-pre-wrap font-mono">{data?.sourceText}</p>;
    }
    const parts = data.sourceText.split(data.directQuote);
    return (
        <p className="text-sm text-slate-400 whitespace-pre-wrap font-mono">
            {parts[0]}
            <span className="bg-primary/20 text-primary-foreground p-1 rounded-sm">{data.directQuote}</span>
            {parts[1]}
        </p>
    );
  };


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px] bg-slate-950/80 backdrop-blur-md border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">{caseName}</DialogTitle>
          <DialogDescription>AI-Generated Summary & Source Data</DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Spinner />
              <p className="ml-2">Generating summary...</p>
            </div>
          ) : error ? (
            <p className="text-destructive text-center">{error}</p>
          ) : data ? (
            <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="summary">AI Summary</TabsTrigger>
                    <TabsTrigger value="source">Source of Truth</TabsTrigger>
                </TabsList>
                <TabsContent value="summary" className="mt-4">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{data.summary}</p>
                </TabsContent>
                <TabsContent value="source" className="mt-4">
                    <div className="p-4 bg-background rounded-md border border-border">
                        <h4 className="font-semibold text-muted-foreground mb-2">Raw Source Text (with highlight)</h4>
                        {renderSourceText()}
                    </div>
                </TabsContent>
            </Tabs>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
