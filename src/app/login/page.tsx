'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSignIn = () => {
    if (login) {
      login();
    }
  };
  
  if (loading) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4">
      <Card className="w-full max-w-md bg-card backdrop-blur-lg border shadow-2xl shadow-black/40">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-4xl text-foreground">DIALOGUE</CardTitle>
          <CardDescription>
            Your AI-Powered Strategic Co-Counsel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-6 pt-4">
            <Button onClick={handleSignIn} className="w-full" size="lg" disabled={!login}>
              Log In & Begin Analysis
            </Button>
             <p className="px-8 text-center text-xs text-muted-foreground">
              By logging in, you are accessing a secure environment. This is a demo using mock authentication.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
