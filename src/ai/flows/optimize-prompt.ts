
'use server';

/**
 * @fileOverview An AI agent that optimizes a user's prompt for better analysis results.
 * - optimizePrompt - A function that takes a raw prompt and returns a more structured one.
 * - OptimizePromptInput - The input type for the optimizePrompt function.
 * - OptimizePromptOutput - The return type for the optimizePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizePromptInputSchema = z.object({
  rawPrompt: z.string().describe('The user’s initial, unstructured prompt about their legal case.'),
});
export type OptimizePromptInput = z.infer<typeof OptimizePromptInputSchema>;

const OptimizePromptOutputSchema = z.object({
  suggestedPrompt: z.string().describe('The AI-suggested, optimized, and structured prompt.'),
});
export type OptimizePromptOutput = z.infer<typeof OptimizePromptOutputSchema>;

export async function optimizePrompt(input: OptimizePromptInput): Promise<OptimizePromptOutput> {
  return optimizePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizePromptFlow',
  input: {schema: OptimizePromptInputSchema},
  output: {schema: OptimizePromptOutputSchema},
  prompt: `You are an AI assistant for a legal tech app. Your task is to take a user's raw, unstructured text about a legal case and refine it into a well-structured prompt. A good prompt should be organized into sections like 'Case Facts', 'Key Parties', 'Core Legal Question(s)', and 'Initial Strategy/Arguments'.

Reword and structure the following user input to be a clear and comprehensive prompt for a legal analysis AI. Do not invent new facts, but organize the provided information logically.

User's Raw Prompt:
{{{rawPrompt}}}
`,
});

const optimizePromptFlow = ai.defineFlow(
  {
    name: 'optimizePromptFlow',
    inputSchema: OptimizePromptInputSchema,
    outputSchema: OptimizePromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a valid prompt suggestion.');
    }
    return output;
  }
);
