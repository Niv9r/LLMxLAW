
'use server';

/**
 * @fileOverview This file defines the generateAnalysis flow. It performs a two-phase analysis:
 * 1. Generates a high-level analysis and adversarial playbook using Gemini 2.5 Pro.
 * 2. Generates a detailed "deep dive" for each argument and weakness from the high-level analysis.
 * It then combines everything into a single, comprehensive analysis object.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {generateAdversarialPlaybook} from './generate-adversarial-playbook';
import { ThreePartAnalysisSchema, AnalysisDashboardSchema, GenerateAnalysisInputSchema } from '@/lib/types';
import type { Analysis, LegalArgument, Weakness } from '@/lib/types';
import { generateDeepDive } from './generate-deep-dive';

export type GenerateAnalysisInput = z.infer<typeof GenerateAnalysisInputSchema>;
export type GenerateAnalysisOutput = { analysisDashboard: Analysis };

export async function generateAnalysis(input: GenerateAnalysisInput): Promise<GenerateAnalysisOutput> {
  return generateAnalysisFlow(input);
}

const threePartAnalysisPrompt = ai.definePrompt({
  name: 'threePartAnalysisPrompt',
  input: {schema: GenerateAnalysisInputSchema},
  output: {schema: ThreePartAnalysisSchema},
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
  prompt: `You are a world-class AI legal analyst. Your task is to provide a concise, multi-faceted analysis of a legal strategy.

  Legal Strategy to Analyze:
  {{{legalStrategy}}}

  Produce a structured analysis in JSON format with three distinct parts. Adhere strictly to the provided JSON schema. Fields marked as optional in the schema can be omitted if there is no relevant information to include.

  1.  **Advocate's Brief:**
      *   Formulate the most compelling arguments for the provided strategy.
      *   For each argument, provide a concise summary. If relevant, include key case citations with brief relevance explanations. You may omit 'caseCitations' if none apply.

  2.  **Identified Weaknesses:**
      *   Identify the most significant weaknesses in the overall legal strategy.
      *   For each weakness, provide a description, a vulnerability score (1-10), and a brief rationale.

  3.  **Arbiter's Synthesis:**
      *   For each key vulnerability, identify it and list the specific arguments that it affects. You may omit 'affectedArguments' if it's not applicable. If no significant vulnerabilities are found, you may omit the 'keyVulnerabilities' array entirely.
      *   Provide a high-level refined strategy, with a clear recommendation and rationale for each point. You may omit the 'refinedStrategy' array if no refinements are necessary.
      *   Offer a predictive analysis of the case outcome, including a confidence level as a float between 0.0 and 1.0 (e.g., 0.75 for 75%). If you cannot make a prediction, you may omit the 'predictiveAnalysis' object.
  `,
});

const generateAnalysisFlow = ai.defineFlow(
  {
    name: 'generateAnalysisFlow',
    outputSchema: z.object({ analysisDashboard: AnalysisDashboardSchema }),
    inputSchema: GenerateAnalysisInputSchema,
  },
  async input => {
    // Step 1: Generate high-level analysis and playbook in parallel
    const [threePartAnalysisResult, adversarialPlaybookResult] = await Promise.all([
      threePartAnalysisPrompt(input, { model: 'googleai/gemini-2.5-flash' }),
      generateAdversarialPlaybook(input),
    ]);

    const highLevelAnalysis = threePartAnalysisResult.output;
    const playbook = adversarialPlaybookResult.adversarialPlaybook;

    if (!highLevelAnalysis) {
      throw new Error('Failed to generate the core analysis due to an invalid AI response format.');
    }
    if (!playbook) {
      throw new Error('Failed to generate the adversarial playbook due to an invalid AI response format.');
    }

    // Step 2: Deep dives are now generated in a separate, asynchronous flow.
    
    // Step 3: Combine initial results into the final dashboard object
    return {
      analysisDashboard: {
        ...highLevelAnalysis,
        advocateBrief: highLevelAnalysis.advocateBrief || [],
        identifiedWeaknesses: highLevelAnalysis.identifiedWeaknesses || [],
        adversarialPlaybook: playbook,
      },
    };
  }
);
