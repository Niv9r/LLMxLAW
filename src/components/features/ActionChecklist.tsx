'use client';

import type { ActionItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, ListTodo } from 'lucide-react';

type ActionChecklistProps = {
    items: ActionItem[];
    onUpdate: (items: ActionItem[]) => void;
    onDiscuss: (item: ActionItem) => void;
};

export function ActionChecklist({ items, onUpdate, onDiscuss }: ActionChecklistProps) {
    const handleToggle = (itemId: string) => {
        const updatedItems = items.map(item => 
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        onUpdate(updatedItems);
    };

    return (
        <Card className="bg-card/60 backdrop-blur-sm border-border shadow-xl shadow-black/20">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary rounded-lg"><ListTodo className="h-6 w-6 text-primary" /></div>
                    <CardTitle className="font-headline text-2xl text-primary">Action Plan</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border hover:border-primary/50 transition-colors">
                            <div className="flex items-center space-x-4">
                                <Checkbox
                                    id={item.id}
                                    checked={item.completed}
                                    onCheckedChange={() => handleToggle(item.id)}
                                    className="data-[state=checked]:bg-primary"
                                />
                                <label
                                    htmlFor={item.id}
                                    className={`text-sm font-medium leading-none text-foreground transition-colors ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                                >
                                    {item.text}
                                </label>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => onDiscuss(item)}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Discuss
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
