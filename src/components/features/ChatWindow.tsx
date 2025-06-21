'use client';

import { useState, useRef, useEffect } from 'react';
import type { Project, ChatMessage } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, User } from 'lucide-react';
import { Spinner } from '../Spinner';
import { chatWithArbiter } from '@/lib/actions';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getAIErrorMessage } from '@/lib/utils';

type ChatWindowProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  project: Project | null;
  onProjectUpdate: (project: Project) => void;
};

export function ChatWindow({ isOpen, onOpenChange, project, onProjectUpdate }: ChatWindowProps) {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const chatHistory = project?.mainChatHistory || [];
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollEl = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollEl) {
            scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
        }
    }
  }, [chatHistory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !project || !project.strategy) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      createdAt: new Date(),
    };
    
    // Optimistically update UI
    const updatedHistory = [...chatHistory, userMessage];
    onProjectUpdate({ ...project, mainChatHistory: updatedHistory });
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatWithArbiter({
        message: input,
        chatHistory: chatHistory,
        caseFacts: project.strategy,
      });

      const arbiterMessage: ChatMessage = {
        role: 'arbiter',
        content: result.response,
        createdAt: new Date(),
      };
      
      const finalHistory = [...updatedHistory, arbiterMessage];
      const finalProject = { ...project, mainChatHistory: finalHistory };
      onProjectUpdate(finalProject);
      
      if (db && !project.id.startsWith('local-')) {
          const projectRef = doc(db, 'users', project.userId, 'projects', project.id);
          await updateDoc(projectRef, {
              mainChatHistory: finalHistory
          });
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast({ title: 'Error', description: getAIErrorMessage(error), variant: 'destructive' });
      // Revert optimistic update on error
       onProjectUpdate({ ...project, mainChatHistory: chatHistory });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[540px] bg-slate-950/80 backdrop-blur-md border-slate-800 flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline text-primary">Chat with Arbiter</SheetTitle>
          <SheetDescription>Discuss the case analysis directly with the AI.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto pr-4 -mr-6">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
                 <div className="space-y-4 py-4">
                    {chatHistory.map((message, index) => (
                        <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                             {message.role === 'arbiter' && (
                                <Avatar className="h-8 w-8 bg-amber-500/20 text-amber-300">
                                    <AvatarFallback>A</AvatarFallback>
                                </Avatar>
                             )}
                            <div className={`rounded-lg px-4 py-2 max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                             {message.role === 'user' && (
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback><User size={18}/></AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                             <Avatar className="h-8 w-8 bg-amber-500/20 text-amber-300">
                                <AvatarFallback>A</AvatarFallback>
                             </Avatar>
                             <div className="rounded-lg px-4 py-2 bg-secondary flex items-center">
                                 <Spinner size="sm" />
                             </div>
                         </div>
                    )}
                </div>
            </ScrollArea>
        </div>
        <SheetFooter>
          <form onSubmit={handleSubmit} className="w-full flex items-center space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up question..."
              disabled={isLoading}
              className="bg-slate-800 border-slate-700"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
