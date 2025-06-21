
'use server';
/**
 * @fileOverview Defines the Genkit flow for generating an "Adversarial Playbook".
 * This includes potential counter-arguments, rebuttals, counter-rebuttals, and analysis of opposing counsel.
 *
 * - generateAdversarialPlaybook: The main function to trigger the playbook generation.
 * - GenerateAdversarialPlaybookInput: Input type for the flow.
 * - GenerateAdversarialPlaybookOutput: Output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type {AdversarialPlaybook} from '@/lib/types';
import {AdversarialPlaybookSchema} from '@/lib/types';

const GenerateAdversarialPlaybookInputSchema = z.object({
  legalStrategy: z.string().describe('The full legal strategy, including case facts and arguments, for which to generate a playbook.'),
});
export type GenerateAdversarialPlaybookInput = z.infer<typeof GenerateAdversarialPlaybookInputSchema>;

const GenerateAdversarialPlaybookOutputSchema = z.object({
  adversarialPlaybook: AdversarialPlaybookSchema,
});
export type GenerateAdversarialPlaybookOutput = z.infer<typeof GenerateAdversarialPlaybookOutputSchema>;

export async function generateAdversarialPlaybook(input: GenerateAdversarialPlaybookInput): Promise<GenerateAdversarialPlaybookOutput> {
  return generateAdversarialPlaybookFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAdversarialPlaybookPrompt',
  input: {schema: GenerateAdversarialPlaybookInputSchema},
  output: {schema: AdversarialPlaybookSchema},
  prompt: `You are a master legal strategist with expertise in international arbitration, thinking multiple moves ahead. Your task is to create an exceptionally deep "Adversarial Playbook" based on the provided legal strategy. Adhere strictly to the provided JSON schema. Fields marked as optional in the schema can be omitted if there is no relevant information to include.

Legal Strategy Document:
{{{legalStrategy}}}

Based on the document, generate the following:
1.  **Potential Counter-Arguments:** Create an exhaustive list of every potential argument the opposing side could realistically make. Be creative and thorough. If no counter-arguments are found, you may omit the 'potentialCounterArguments' array.
2.  **Rebuttals & Counter-Rebuttals:** For each counter-argument:
    a.  Provide a set of strong, well-supported **rebuttals** our team can use. If applicable, include supporting **citations**. You may omit the 'citations' array.
    b.  **Crucially, for each rebuttal, anticipate the next move.** Generate a list of likely **potentialCounterRebuttals** the opposing counsel might use in response to our rebuttal. For each, assess its strength as "High", "Medium", or "Low". You may omit the 'potentialCounterRebuttals' array if there are none.
3.  **Opponent Counsel Analysis:** Provide a brief analysis of what the opposing counsel's strategic patterns might be, based on the nature of the case. Frame this as a general strategic forecast.
`,
});

const generateAdversarialPlaybookFlow = ai.defineFlow(
  {
    name: 'generateAdversarialPlaybookFlow',
    inputSchema: GenerateAdversarialPlaybookInputSchema,
    outputSchema: GenerateAdversarialPlaybookOutputSchema,
  },
  async input => {
    const {output: playbook} = await prompt(input, { 
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
    
    if (!playbook) {
      throw new Error('The AI failed to generate a valid adversarial playbook.');
    }
    
    return { adversarialPlaybook: playbook };
  }
);
