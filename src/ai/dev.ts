import { config } from 'dotenv';
config();

import '@/ai/flows/generate-analysis.ts';
import '@/ai/flows/scoped-chat.ts';
import '@/ai/flows/chat-with-arbiter.ts';
import '@/ai/flows/generate-action-plan.ts';
import '@/ai/flows/generate-legal-summarization.ts';
import '@/ai/flows/optimize-prompt.ts';
import '@/ai/flows/generate-adversarial-playbook.ts';
import '@/ai/flows/generate-project-name.ts';
import '@/ai/flows/run-simulation.ts';
import '@/ai/flows/generate-deep-dive.ts';
import '@/ai/flows/generate-all-deep-dives.ts';
import '@/ai/flows/generate-presentation.ts';
