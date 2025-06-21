'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type DraftItem = {
  id: number;
  text: string;
};

type ActionPlanDraftDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  items: { text: string }[];
  onConfirm: (items: { text: string }[]) => void;
};

export function ActionPlanDraftDialog({ isOpen, onClose, items, onConfirm }: ActionPlanDraftDialogProps) {
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (items) {
      setDraftItems(items.map((item, index) => ({ id: index, ...item })));
    }
  }, [items]);

  const handleUpdateText = (id: number, newText: string) => {
    setDraftItems(currentItems =>
      currentItems.map(item => (item.id === id ? { ...item, text: newText } : item))
    );
  };

  const handleAddItem = () => {
    const newItem: DraftItem = { id: Date.now(), text: '' };
    setDraftItems(currentItems => [...currentItems, newItem]);
  };

  const handleDeleteItem = (id: number) => {
    setDraftItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  const handleConfirm = () => {
    const nonEmptyItems = draftItems.filter(item => item.text.trim() !== '');
    if (nonEmptyItems.length === 0) {
      toast({
        title: 'Cannot save empty plan',
        description: 'Please add at least one task or cancel.',
        variant: 'destructive',
      });
      return;
    }
    onConfirm(nonEmptyItems);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[80vh] bg-slate-950/80 backdrop-blur-md border-slate-800 text-slate-100 flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">Draft Your Action Plan</DialogTitle>
          <DialogDescription>Review, edit, and add tasks before finalizing your plan.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 py-4">
          <ScrollArea className="h-full pr-6 -mr-6">
            <div className="space-y-3">
              {draftItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={item.text}
                    onChange={e => handleUpdateText(item.id, e.target.value)}
                    placeholder={`Task #${index + 1}`}
                    className="bg-background flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="opacity-50 group-hover:opacity-100">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="pt-4 border-t border-border">
          <Button variant="outline" onClick={handleAddItem}>
            <Plus className="mr-2" /> Add Task
          </Button>
          <div className="flex-grow"></div>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm & Save Plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
