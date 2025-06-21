
'use server';
/**
 * @fileOverview An AI agent for generating a "deep dive" analysis on a specific point.
 *
 * - generateDeepDive - A function that generates the detailed analysis.
 * - GenerateDeepDiveInput - The input type for the function.
 * - GenerateDeepDiveOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDeepDiveInputSchema = z.object({
  originalStrategy: z.string().describe('The user’s initial legal strategy.'),
  priorAnalysisSection: z.string().describe('The relevant section of the prior high-level analysis (e.g., the Advocate\'s Brief).'),
  itemToExpand: z.string().describe('The specific argument or weakness to expand upon.'),
});
export type GenerateDeepDiveInput = z.infer<typeof GenerateDeepDiveInputSchema>;

const GenerateDeepDiveOutputSchema = z.object({
  detailedAnalysis: z.string().describe('An extremely detailed, exhaustive analysis of the requested point, formatted for direct display with Markdown-style lists.'),
});
export type GenerateDeepDiveOutput = z.infer<typeof GenerateDeepDiveOutputSchema>;

export async function generateDeepDive(input: GenerateDeepDiveInput): Promise<GenerateDeepDiveOutput> {
  return generateDeepDiveFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDeepDivePrompt',
  input: {schema: GenerateDeepDiveInputSchema},
  output: {schema: GenerateDeepDiveOutputSchema},
  prompt: `You are a world-class legal analyst AI. Your task is to provide an exceptionally detailed, "deep dive" explanation of a specific point from a prior, high-level analysis you have already conducted.

Context:
- **Original Case Strategy:** {{{originalStrategy}}}
- **Prior High-Level Analysis Section:** {{{priorAnalysisSection}}}

**Your Task:**
Provide an exhaustive, detailed analysis for the following specific point: **"{{{itemToExpand}}}"**

**Instructions:**
- **If the point is an ARGUMENT:**
  - Elaborate on the underlying legal theory.
  - Provide multiple supporting case citations. For each citation, include a **direct quote** from the case law and a detailed explanation of its relevance and how it connects to the original strategy.
  - Explain the strategic advantage of this argument.
- **If the point is a WEAKNESS:**
  - Dissect the potential damage this weakness could cause.
  - Detail how an opposing counsel would likely exploit it in proceedings.
  - Provide multiple, concrete mitigation strategies with actionable steps.
- **Format your response for clarity.** Use Markdown-style lists (e.g., using '*' or '-') for readability.
`,
});

const generateDeepDiveFlow = ai.defineFlow(
  {
    name: 'generateDeepDiveFlow',
    inputSchema: GenerateDeepDiveInputSchema,
    outputSchema: GenerateDeepDiveOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { 
        model: 'googleai/gemini-2.5-flash',
        config: {
            safetySettings: [
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            ],
        },
    });
    if (!output) {
      throw new Error('The AI failed to generate a valid deep dive.');
    }
    return output;
  }
);
