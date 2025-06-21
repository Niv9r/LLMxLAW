'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import type { SimulationState } from '@/lib/simulation-types';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/hooks/use-toast';
import { SimulationClient } from '@/components/features/simulation/SimulationClient';
import { getAIErrorMessage } from '@/lib/utils';


export default function SimulationPage() {
  const { id: projectId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !projectId) {
      router.push('/dashboard');
      return;
    }

    const fetchProjectData = async () => {
      setLoading(true);

      if ((projectId as string).startsWith('local-')) {
        const localProjectJSON = sessionStorage.getItem('localProject');
        if (localProjectJSON) {
            try {
                const projectData: Project = JSON.parse(localProjectJSON);
                if (projectData.id === projectId) {
                    if (!projectData.strategy || !projectData.analysis) {
                        toast({ title: 'Cannot start simulation', description: 'Project analysis must be complete before starting a simulation.', variant: 'destructive' });
                        router.push(`/project/${projectId}`);
                        return;
                    }
                    projectData.createdAt = new Date(projectData.createdAt as string);
                    setProject(projectData);
                    setLoading(false);
                    return; 
                }
            } catch (e) {
                 console.error("Failed to parse local project from sessionStorage", e);
            }
        }
        toast({ title: 'Error', description: 'Could not load local project data session. Please return to the dashboard.', variant: 'destructive' });
        router.push('/dashboard');
        return;
      }
      
      if (!db) {
        toast({ title: "Error", description: "Firebase is not configured for this project.", variant: "destructive" });
        router.push('/dashboard');
        return;
      }
      
      const projectDocRef = doc(db, 'users', user.uid, projectId as string);
      try {
        const docSnap = await getDoc(projectDocRef);
        if (docSnap.exists()) {
          const projectData = { id: docSnap.id, ...docSnap.data() } as Project;
          if (!projectData.strategy || !projectData.analysis) {
             toast({ title: 'Cannot start simulation', description: 'Project analysis must be complete before starting a simulation.', variant: 'destructive' });
             router.push(`/project/${projectId}`);
             return;
          }
          setProject(projectData);
        } else {
          toast({ title: 'Error', description: 'Project not found.', variant: 'destructive' });
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        toast({ title: 'Error', description: 'Failed to fetch project data.', variant: 'destructive' });
      }
      setLoading(false);
    };

    fetchProjectData();
  }, [user, projectId, toast, router]);

  const handleSaveState = async (simulationState: SimulationState) => {
    if (!user || !project) return;
     if (project.id.startsWith('local-')) {
        // Update sessionStorage for local projects
        const projectToStore = {
            ...project,
            simulationState,
            createdAt: project.createdAt?.toISOString ? project.createdAt.toISOString() : new Date().toISOString(),
        };
        sessionStorage.setItem('localProject', JSON.stringify(projectToStore));
        return;
     }

    const projectRef = doc(db, 'users', user.uid, 'projects', project.id);
    try {
      await updateDoc(projectRef, { simulationState });
    } catch (error) {
      console.error("Failed to save simulation state:", error);
      toast({ title: 'Error', description: 'Failed to save simulation progress.', variant: 'destructive' });
    }
  };


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
     return <div className="flex h-screen items-center justify-center text-destructive">Project not found or invalid.</div>;
  }

  return (
    <SimulationClient
      project={project}
      onSaveState={handleSaveState}
    />
  );
}
