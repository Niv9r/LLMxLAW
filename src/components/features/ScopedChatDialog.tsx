
'use client';

import { useState, useRef, useEffect } from 'react';
import type { ActionItem, ChatMessage } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, User } from 'lucide-react';
import { Spinner } from '../Spinner';
import { scopedChat } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { getAIErrorMessage } from '@/lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '../auth/AuthProvider';

type ScopedChatDialogProps = {
  item: ActionItem | null;
  onClose: () => void;
  onUpdate: (updatedItem: ActionItem) => void;
};

export function ScopedChatDialog({ item, onClose, onUpdate }: ScopedChatDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isOpen = !!item;
  const chatHistory = item?.chatHistory || [];

  useEffect(() => {
    if (isOpen && scrollAreaRef.current) {
      const scrollEl = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollEl) {
        setTimeout(() => scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' }), 100);
      }
    }
  }, [chatHistory, isOpen]);

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !item) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      createdAt: new Date(),
    };

    const updatedHistory = [...chatHistory, userMessage];
    const updatedItem = { ...item, chatHistory: updatedHistory };
    onUpdate(updatedItem); // Optimistic UI update
    setInput('');
    setIsLoading(true);

    try {
      const result = await scopedChat({
        actionItemId: item.id,
        actionItemText: item.text,
        message: input,
        chatHistory: chatHistory,
      });

      const arbiterMessage: ChatMessage = {
        role: 'arbiter',
        content: result.response,
        createdAt: new Date(),
      };

      const finalHistory = [...updatedHistory, arbiterMessage];
      const finalItem = { ...item, chatHistory: finalHistory };
      onUpdate(finalItem);
    } catch (error) {
      console.error('Scoped chat error:', error);
      toast({ title: 'Error', description: getAIErrorMessage(error), variant: 'destructive' });
      onUpdate({ ...item, chatHistory: chatHistory }); // Revert optimistic update
    } finally {
      setIsLoading(false);
    }
  };

  if (!item) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[625px] h-[80vh] bg-slate-950/80 backdrop-blur-md border-slate-800 text-slate-100 flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">Discuss: {item.text}</DialogTitle>
          <DialogDescription>
            This chat is focused only on this action item.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-6 -mr-6" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {chatHistory.map((message, index) => (
                <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'arbiter' && (
                    <Avatar className="h-8 w-8 bg-amber-500/20 text-amber-300"><AvatarFallback>A</AvatarFallback></Avatar>
                  )}
                  <div className={`rounded-lg px-4 py-2 max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8"><AvatarFallback><User size={18}/></AvatarFallback></Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 bg-amber-500/20 text-amber-300"><AvatarFallback>A</AvatarFallback></Avatar>
                  <div className="rounded-lg px-4 py-2 bg-secondary flex items-center"><Spinner size="sm" /></div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="mt-auto pt-4">
            <form onSubmit={handleSubmit} className="w-full flex items-center space-x-2">
            <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this item..."
                disabled={isLoading}
                className="bg-slate-800 border-slate-700"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}><Send className="h-4 w-4" /></Button>
            </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
