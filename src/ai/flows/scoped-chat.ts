
'use server';

/**
 * @fileOverview This file defines the Genkit flow for the scoped chat feature.
 *
 * - scopedChat - A function that handles the scoped chat with the AI arbiter.
 * - ScopedChatInput - The input type for the scopedChat function.
 * - ScopedChatOutput - The return type for the scopedChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScopedChatInputSchema = z.object({
  actionItemId: z.string().describe('The ID of the action item.'),
  actionItemText: z.string().describe('The text content of the action item being discussed.'),
  message: z.string().describe('The user message for the chat.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'arbiter']),
    content: z.string(),
  }).passthrough()).optional().describe('The chat history for the action item.'),
});
export type ScopedChatInput = z.infer<typeof ScopedChatInputSchema>;

const ScopedChatOutputSchema = z.object({
  response: z.string().describe('The AI arbiter response.'),
});
export type ScopedChatOutput = z.infer<typeof ScopedChatOutputSchema>;

export async function scopedChat(input: ScopedChatInput): Promise<ScopedChatOutput> {
  return scopedChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scopedChatPrompt',
  input: {schema: ScopedChatInputSchema},
  output: {schema: ScopedChatOutputSchema},
  prompt: `You are an AI arbiter assisting a lawyer with a specific action item from their case plan.

The action item being discussed is:
"{{{actionItemText}}}"

{{#if chatHistory}}
Chat History:
{{#each chatHistory}}
{{#if isUser}}
Lawyer: {{{content}}}
{{else}}
Arbiter: {{{content}}}
{{/if}}
{{/each}}
{{/if}}

Lawyer: {{{message}}}
Arbiter:`, // The model will complete this
});

const scopedChatFlow = ai.defineFlow(
  {
    name: 'scopedChatFlow',
    inputSchema: ScopedChatInputSchema,
    outputSchema: ScopedChatOutputSchema,
  },
  async input => {
    const augmentedInput = {
      ...input,
      chatHistory: input.chatHistory?.map(message => ({
        ...message,
        isUser: message.role === 'user',
      })),
    };

    const {output} = await prompt(augmentedInput, {
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
      throw new Error('The AI failed to generate a valid scoped chat response.');
    }
    return output;
  }
);
