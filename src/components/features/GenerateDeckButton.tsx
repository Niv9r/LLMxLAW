
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/Spinner';
import { Download, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generatePresentation } from '@/lib/actions';
import { getAIErrorMessage } from '@/lib/utils';
import type { Analysis } from '@/lib/types';
import { saveAs } from 'file-saver';

type GenerateDeckButtonProps = {
  projectName: string;
  analysis: Analysis;
};

type ButtonState = 'idle' | 'loading' | 'error';

// Helper to convert Base64 to Blob
const base64ToBlob = (base64: string, contentType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
};


export function GenerateDeckButton({ projectName, analysis }: GenerateDeckButtonProps) {
  const { toast } = useToast();
  const [state, setState] = useState<ButtonState>('idle');

  const handleClick = async () => {
    if (state === 'loading') return;

    setState('loading');
    try {
      const result = await generatePresentation({
        projectName,
        analysis: JSON.stringify(analysis),
      });

      if (result.fileContent) {
        const blob = base64ToBlob(result.fileContent, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        saveAs(blob, result.fileName);
        
        toast({
          title: 'Download Started',
          description: 'Your strategy deck has been generated and is downloading now.',
        });
        setState('idle'); // Reset after success
      } else {
        throw new Error('The generated file was empty.');
      }
    } catch (err) {
      console.error('Error generating presentation:', err);
      toast({
        title: 'Generation Failed',
        description: getAIErrorMessage(err),
        variant: 'destructive',
      });
      setState('error');
      // Reset after a few seconds
      setTimeout(() => setState('idle'), 5000);
    }
  };

  const content = {
    idle: {
      icon: <Download className="mr-2 h-5 w-5" />,
      text: 'Download Strategy Deck',
    },
    loading: {
      icon: <Spinner className="mr-2" />,
      text: 'Generating...',
    },
    error: {
      icon: <AlertTriangle className="mr-2 h-5 w-5" />,
      text: 'Generation Failed',
    },
  };
  
  return (
    <Button onClick={handleClick} disabled={state === 'loading'}>
      {content[state].icon}
      {content[state].text}
    </Button>
  );
}
