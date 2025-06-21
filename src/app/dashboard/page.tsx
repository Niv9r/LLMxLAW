'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import type { Project } from '@/lib/types';
import { Spinner } from '@/components/Spinner';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && db) {
      const fetchCases = async () => {
        setLoading(true);
        try {
          const q = query(collection(db, 'users', user.uid, 'projects'), orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const userCases = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Project[];
          setCases(userCases);
        } catch (error) {
          console.error("Error fetching cases:", error);
          setCases([]);
        } finally {
          setLoading(false);
        }
      };
      fetchCases();
    } else {
      setCases([]);
      setLoading(false);
    }
  }, [user]);

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-headline text-4xl text-foreground">My Cases</h1>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((caseItem) => (
            <Card 
              key={caseItem.id} 
              className="bg-card backdrop-blur-lg border hover:border-primary/80 hover:shadow-xl hover:shadow-primary/10 transition-all cursor-pointer group"
              onClick={() => router.push(`/project/${caseItem.id}`)}
            >
              <CardHeader>
                <CardTitle className="truncate group-hover:text-primary transition-colors">{caseItem.name}</CardTitle>
                <CardDescription>
                  {caseItem.createdAt?.toDate ? `Created ${formatDistanceToNow(caseItem.createdAt.toDate())} ago` : 'Date not available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {caseItem.strategy || 'No strategy submitted yet.'}
                </p>
              </CardContent>
            </Card>
          ))}
          <Card
            className="flex flex-col items-center justify-center text-center py-12 bg-card/60 backdrop-blur-sm border-dashed border-border/50 hover:border-primary/80 hover:shadow-xl hover:shadow-primary/10 transition-all cursor-pointer group min-h-[220px]"
            onClick={() => router.push('/project/new')}
          >
            <CardHeader>
                <div className="mx-auto bg-secondary rounded-full h-16 w-16 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                    <PlusCircle className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <CardTitle className="transition-colors group-hover:text-primary">New Case</CardTitle>
                <CardDescription>Start a new analysis.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
