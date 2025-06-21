
'use server';
/**
 * @fileOverview The state machine for the Virtual Hearing Room simulation.
 * This flow manages the entire lifecycle of the hearing, from opening statements
 * to witness examination and closing arguments. It orchestrates multiple AI
 * personas and provides real-time coaching.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  SimulationStateSchema,
  RunSimulationInputSchema,
  SpeakerSchema,
  TranscriptEntrySchema,
  ObjectionSchema,
  RulingSchema,
} from '@/lib/simulation-types';
import type { SimulationState, RunSimulationInput, RunSimulationOutput, TranscriptEntry, Speaker } from '@/lib/simulation-types';

export async function runSimulation(input: RunSimulationInput): Promise<RunSimulationOutput> {
  return runSimulationFlow(input);
}

const addTranscript = (state: SimulationState, speaker: Speaker, text: string): SimulationState => {
  const newEntry: TranscriptEntry = {
    speaker,
    text,
    timestamp: new Date().toISOString(),
  };
  return { ...state, transcript: [...state.transcript, newEntry] };
};

const safetyConfig = {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
};

const runSimulationFlow = ai.defineFlow(
  {
    name: 'runSimulationFlow',
    inputSchema: RunSimulationInputSchema,
    outputSchema: SimulationStateSchema,
  },
  async (input): Promise<SimulationState> => {
    // Initialize state if it's the first run
    if (!input.currentState) {
      let state: SimulationState = {
        phase: 'SETUP',
        transcript: [],
        caseStrength: 50,
        proceduralHistory: [],
        isAwaitingUserInput: false,
      };
      
      const tribunalOpeningText = "This hearing is now in session. We will begin with opening statements, limited to 10 minutes each. Counsel for the Respondent, Republic of Kronos, you may begin.";
      state = addTranscript(state, 'TRIBUNAL', tribunalOpeningText);
      state.phase = 'OPENING_STATEMENTS';
      
      const { output: opponentOpening } = await ai.generate({
          model: 'googleai/gemini-2.5-flash',
          prompt: `You are the counsel for the Republic of Kronos, the Respondent in an international arbitration. The case concerns an environmental counterclaim against the Claimant, Fenoscadia Limited.
          Your task is to generate a concise, powerful opening statement (2-3 paragraphs) based on the Claimant's provided strategy.
          Summarize your case on contamination, health impacts, and costs. Be assertive and confident.

          Claimant's Strategy:
          """
          ${input.caseStrategy}
          """
          
          Your Opening Statement:`,
          output: { format: 'text' },
          config: safetyConfig,
      });
      
      if (!opponentOpening) throw new Error("AI failed to generate opponent's opening statement.");
      state = addTranscript(state, 'OPPOSING_COUNSEL', opponentOpening);

      const userPrompt = "The Tribunal thanks counsel for the Respondent. Counsel for the Claimant, Fenoscadia Limited, you may now present your opening statement.";
      state = addTranscript(state, 'TRIBUNAL', userPrompt);
      state.isAwaitingUserInput = true;
      return state;
    }

    let newState: SimulationState = { ...input.currentState };

    switch (newState.phase) {
      case 'OPENING_STATEMENTS':
        if (input.userAction?.type === 'SUBMIT_STATEMENT') {
          newState.isAwaitingUserInput = false;
          newState = addTranscript(newState, 'USER', input.userAction.payload!);

          const { output: assessment } = await ai.generate({
              model: 'googleai/gemini-2.5-flash',
              prompt: `As an expert arbitral tribunal, assess the user's opening statement against the opponent's.
              Your current case strength is ${newState.caseStrength}%.
              Adjust the case strength based on the persuasiveness, clarity, and legal strength of the user's statement compared to the opponent's.
              Provide a new case strength score as an integer between 0 and 100.
              
              Opponent's Statement: """${newState.transcript.find(t=>t.speaker==='OPPOSING_COUNSEL')?.text}"""
              User's Statement: """${input.userAction.payload}"""
              `,
              output: { schema: z.object({ newStrength: z.number().min(0).max(100) }) },
              config: safetyConfig,
          });
          
          if (!assessment) throw new Error("AI failed to assess opening statements.");
          newState.caseStrength = assessment.newStrength;

          const witnessName = "Dr. Aris Thorne";
          const witnessBackground = "The lead author of the Rhea River Contamination Study, a university study funded by a grant from the Republic of Kronos.";
          const stageSettingText = "The Tribunal thanks both parties. We will now proceed to the examination of witnesses. The Tribunal calls Dr. Aris Thorne, lead author of the Rhea River Contamination Study. Counsel for Kronos, you may begin your direct examination.";
          
          newState = addTranscript(newState, 'TRIBUNAL', stageSettingText);
          newState.phase = 'WITNESS_EXAMINATION';
          newState.currentWitness = { name: witnessName, background: witnessBackground };

           const { output: directExam } = await ai.generate({
              model: 'googleai/gemini-2.5-flash',
              prompt: `Simulate a brief direct examination (3-4 questions and answers) by Kronos's counsel of their expert, ${witnessName}, whose background is: ${witnessBackground}. The goal is to build Kronos's case. Format as a series of exchanges. Example:
                'Kronos Counsel: [Question]'
                'Dr. Thorne (Simulated): [Answer]'
              `,
              output: { format: 'text' },
              config: safetyConfig,
          });
          
          if (!directExam) throw new Error("AI failed to simulate direct examination.");
          newState = addTranscript(newState, 'SYSTEM', `--- Start of Direct Examination ---\n${directExam}\n--- End of Direct Examination ---`);
          
          const crossExamPrompt = `Counsel for Fenoscadia, you may now cross-examine the witness.`;
          newState = addTranscript(newState, 'TRIBUNAL', crossExamPrompt);
          newState.isAwaitingUserInput = true;
        }
        break;

      case 'WITNESS_EXAMINATION':
        if (input.userAction?.type === 'SUBMIT_QUESTION') {
            newState.isAwaitingUserInput = false;
            newState = addTranscript(newState, 'USER', input.userAction.payload!);

            const { output: crossExamTurn } = await ai.generate({
                model: 'googleai/gemini-2.5-flash',
                prompt: `You are an Arbitral Tribunal simulation engine. Given the user's question to the witness, first, as the Opposing Counsel, decide if you should object. If so, generate the objection.
                Then, as the Tribunal, rule on the objection, provide a coaching tip if the user's question was weak or the objection was valid, and calculate the impact on case strength (-10 to +10). Finally, generate the witness's answer.
                
                Case Context: """${input.caseStrategy}"""
                Witness: ${newState.currentWitness?.name}, ${newState.currentWitness?.background}
                User's Question: """${input.userAction.payload}"""`,
                output: { 
                  schema: z.object({ 
                    objection: ObjectionSchema.describe("The opposing counsel's objection, if any."), 
                    ruling: RulingSchema.describe("The tribunal's ruling and assessment."), 
                    witnessAnswer: z.string().describe("The witness's answer to the user's question.") 
                }) },
                config: safetyConfig,
            });
            
            if (!crossExamTurn) {
                throw new Error("The AI failed to generate a response for the witness examination turn.");
            }

            const { objection, ruling, witnessAnswer } = crossExamTurn;
            
            if (objection.isObjected) {
                newState = addTranscript(newState, 'OPPOSING_COUNSEL', objection.objectionText!);
            }
            
            newState = addTranscript(newState, 'TRIBUNAL', ruling.rulingText);
            if (ruling.coachingTip) {
                newState = addTranscript(newState, 'COACHING', ruling.coachingTip);
            }
            newState.caseStrength = Math.max(0, Math.min(100, newState.caseStrength + ruling.strengthImpact));
            
            newState = addTranscript(newState, 'WITNESS', witnessAnswer);
            newState.isAwaitingUserInput = true; // Ready for next question
        } else if (input.userAction?.type === 'END_EXAMINATION') {
            newState.isAwaitingUserInput = false;
            const closingPrompt = "The witness is excused. The Tribunal will now hear closing arguments. Counsel for Kronos, you may begin.";
            newState = addTranscript(newState, 'TRIBUNAL', closingPrompt);
            newState.phase = 'CLOSING_ARGUMENTS';

            const { output: opponentClosing } = await ai.generate({
                model: 'googleai/gemini-2.5-flash',
                prompt: `You are the counsel for the Republic of Kronos. Deliver a powerful closing argument, synthesizing your case based on the entire hearing transcript.
                
                Hearing Transcript:
                """
                ${newState.transcript.map(t => `${t.speaker}: ${t.text}`).join('\n')}
                """`,
                 output: { format: 'text' },
                 config: safetyConfig,
            });

            if (!opponentClosing) throw new Error("AI failed to generate opponent's closing argument.");
            newState = addTranscript(newState, 'OPPOSING_COUNSEL', opponentClosing);
            newState = addTranscript(newState, 'TRIBUNAL', "Counsel for Fenoscadia, you may now present your closing argument.");
            newState.isAwaitingUserInput = true;
        }
        break;

      case 'CLOSING_ARGUMENTS':
          if (input.userAction?.type === 'SUBMIT_CLOSING') {
              newState.isAwaitingUserInput = false;
              newState = addTranscript(newState, 'USER', input.userAction.payload!);

              const { output: finalAssessment } = await ai.generate({
                  model: 'googleai/gemini-2.5-flash',
                  prompt: `As an expert arbitral tribunal, give a final assessment of the user's performance.
                  Your current case strength is ${newState.caseStrength}%.
                  Adjust the case strength based on the user's closing argument.
                  Provide a new final case strength score and a concluding statement.`,
                  output: { schema: z.object({ finalStrength: z.number().min(0).max(100), concludingStatement: z.string() }) },
                  config: safetyConfig,
              });

              if (!finalAssessment) throw new Error("AI failed to generate a final assessment.");
              newState.caseStrength = finalAssessment.finalStrength;
              const conclusion = `The Tribunal thanks the parties for their submissions. The hearing is now closed. The Tribunal will deliberate and issue its award in due course.\n\nFinal Assessed Case Strength: ${newState.caseStrength}%`;
              newState = addTranscript(newState, 'TRIBUNAL', `${finalAssessment.concludingStatement}\n\n${conclusion}`);
              newState.phase = 'COMPLETE';
          }
        break;
      
      case 'COMPLETE':
        // No further actions
        break;
    }

    return newState;
  }
);
