
'use server';

/**
 * @fileOverview An AI agent for generating an actionable checklist of tasks based on the AI analysis and chat history.
 *
 * - generateActionPlan - A function that generates the action plan.
 * - GenerateActionPlanInput - The input type for the generateActionPlan function.
 * - GenerateActionPlanOutput - The return type for the generateActionPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateActionPlanInputSchema = z.object({
  analysisResults: z
    .string()
    .describe("The AI analysis results, containing the Advocate's Brief, Adversary's Rebuttal, and Arbiter's Synthesis."),
  chatHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'arbiter']),
        content: z.string(),
      }).passthrough()
    )
    .optional()
    .describe('The subsequent chat history between the user and the AI arbiter.'),
});
export type GenerateActionPlanInput = z.infer<typeof GenerateActionPlanInputSchema>;

const GenerateActionPlanOutputSchema = z.object({
  actionItems: z.array(z.string()).describe('A list of actionable tasks derived from the AI analysis and conversation.'),
});
export type GenerateActionPlanOutput = z.infer<typeof GenerateActionPlanOutputSchema>;

export async function generateActionPlan(input: GenerateActionPlanInput): Promise<GenerateActionPlanOutput> {
  return generateActionPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateActionPlanPrompt',
  input: {schema: GenerateActionPlanInputSchema},
  output: {schema: GenerateActionPlanOutputSchema},
  prompt: `You are an AI assistant designed to generate an actionable checklist of tasks for lawyers.

Your task is to create a list of actionable tasks based on the initial AI analysis of a legal strategy AND the follow-up conversation with the lawyer. The checklist should be deeply personalized to the user's specific questions and concerns raised in the chat.

First, consider the initial analysis:
Analysis Results: {{{analysisResults}}}

Next, consider the follow-up conversation, which provides crucial context on what the lawyer is most concerned about:
{{#if chatHistory}}
Follow-up Conversation:
{{#each chatHistory}}
{{#if isUser}}
Lawyer: {{{content}}}
{{else}}
Arbiter: {{{content}}}
{{/if}}
{{/each}}
{{/if}}

Now, generate a checklist of concrete, actionable tasks that addresses the key issues from both the analysis and the conversation. Each task should be clear, concise, and directly related to strengthening the case.
`,
});

const generateActionPlanFlow = ai.defineFlow(
  {
    name: 'generateActionPlanFlow',
    inputSchema: GenerateActionPlanInputSchema,
    outputSchema: GenerateActionPlanOutputSchema,
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
      throw new Error('The AI failed to generate a valid action plan.');
    }
    return output;
  }
);
