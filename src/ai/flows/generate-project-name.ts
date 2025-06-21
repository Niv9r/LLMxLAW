
'use server';

/**
 * @fileOverview An AI agent for generating a project name from a legal strategy.
 *
 * - generateProjectName - A function that generates a project name.
 * - GenerateProjectNameInput - The input type for the generateProjectName function.
 * - GenerateProjectNameOutput - The return type for the generateProjectName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProjectNameInputSchema = z.object({
  strategyText: z.string().describe('The user’s initial legal strategy.'),
});
export type GenerateProjectNameInput = z.infer<typeof GenerateProjectNameInputSchema>;

const GenerateProjectNameOutputSchema = z.object({
  projectName: z.string().describe('A concise and professional project name (like a case name, e.g., "Fenoscadia v. Kronos" or "International Tech Arbitration"). The name should be no more than 5 words.'),
});
export type GenerateProjectNameOutput = z.infer<typeof GenerateProjectNameOutputSchema>;

export async function generateProjectName(input: GenerateProjectNameInput): Promise<GenerateProjectNameOutput> {
  return generateProjectNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProjectNamePrompt',
  input: {schema: GenerateProjectNameInputSchema},
  output: {schema: GenerateProjectNameOutputSchema},
  prompt: `You are an expert at summarizing legal documents. Based on the following legal strategy, suggest a concise and professional project name (like a case name, e.g., "Fenoscadia v. Kronos" or "International Tech Arbitration"). The name should be no more than 5 words.

Strategy:
{{{strategyText}}}
`,
});

const generateProjectNameFlow = ai.defineFlow(
  {
    name: 'generateProjectNameFlow',
    inputSchema: GenerateProjectNameInputSchema,
    outputSchema: GenerateProjectNameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a valid project name.');
    }
    return output;
  }
);
