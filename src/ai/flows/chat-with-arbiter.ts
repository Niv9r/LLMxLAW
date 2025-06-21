
'use server';
/**
 * @fileOverview An AI agent that allows lawyers to chat with an AI arbiter.
 *
 * - chatWithArbiter - A function that handles the chat with the AI arbiter.
 * - ChatWithArbiterInput - The input type for the chatWithArbiter function.
 * - ChatWithArbiterOutput - The return type for the chatWithArbiter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithArbiterInputSchema = z.object({
  message: z.string().describe('The message from the user to the AI arbiter.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'arbiter']),
    content: z.string(),
  }).passthrough()).optional().describe('The chat history between the user and the AI arbiter.'),
  caseFacts: z.string().describe('The case facts and initial strategy provided by the user.'),
});
export type ChatWithArbiterInput = z.infer<typeof ChatWithArbiterInputSchema>;

const ChatWithArbiterOutputSchema = z.object({
  response: z.string().describe('The response from the AI arbiter.'),
});
export type ChatWithArbiterOutput = z.infer<typeof ChatWithArbiterOutputSchema>;

export async function chatWithArbiter(input: ChatWithArbiterInput): Promise<ChatWithArbiterOutput> {
  return chatWithArbiterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithArbiterPrompt',
  input: {schema: ChatWithArbiterInputSchema},
  output: {schema: ChatWithArbiterOutputSchema},
  prompt: `You are an AI arbiter assisting a lawyer in understanding their case.

  You have the following case facts and initial strategy provided by the lawyer:
  {{caseFacts}}

  Respond to the following message from the lawyer:
  {{message}}

  Consider the chat history when formulating your response:
  {{#each chatHistory}}
  {{#if isUser}}
  Lawyer: {{content}}
  {{else}}
  Arbiter: {{content}}
  {{/if}}
  {{/each}}
  Arbiter:`, // The Arbiter: prompt is intentionally at the end, outside the {{#each}} loop
});

const chatWithArbiterFlow = ai.defineFlow(
  {
    name: 'chatWithArbiterFlow',
    inputSchema: ChatWithArbiterInputSchema,
    outputSchema: ChatWithArbiterOutputSchema,
  },
  async input => {
    const augmentedInput = {
      ...input,
      chatHistory: input.chatHistory?.map(message => ({
        ...message,
        isUser: message.role === 'user',
      })),
    };

    const {output} = await prompt(augmentedInput);
    if (!output) {
        throw new Error('The AI failed to generate a valid chat response.');
    }
    return output;
  }
);
