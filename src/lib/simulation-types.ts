// This file will be created.
import { z } from 'zod';

export const SimulationPhaseSchema = z.enum([
  'SETUP',
  'OPENING_STATEMENTS',
  'WITNESS_EXAMINATION',
  'CLOSING_ARGUMENTS',
  'COMPLETE',
]);
export type SimulationPhase = z.infer<typeof SimulationPhaseSchema>;

export const SpeakerSchema = z.enum([
  'TRIBUNAL',
  'OPPOSING_COUNSEL',
  'USER',
  'WITNESS',
  'COACHING',
  'SYSTEM',
]);
export type Speaker = z.infer<typeof SpeakerSchema>;

export const TranscriptEntrySchema = z.object({
  speaker: SpeakerSchema,
  text: z.string(),
  timestamp: z.string(),
});
export type TranscriptEntry = z.infer<typeof TranscriptEntrySchema>;

export const ObjectionSchema = z.object({
  isObjected: z.boolean().describe('Whether an objection was raised.'),
  objectionText: z.string().optional().describe('The text of the objection, if any.'),
});

export const RulingSchema = z.object({
  rulingText: z.string().describe("The tribunal's ruling on the objection."),
  coachingTip: z.string().optional().describe('A specific coaching tip for the user based on their question and the objection.'),
  strengthImpact: z.number().describe('The positive or negative impact on the case strength score, from -10 to +10.')
});

export const SimulationStateSchema = z.object({
  phase: SimulationPhaseSchema,
  transcript: z.array(TranscriptEntrySchema),
  caseStrength: z.number().min(0).max(100),
  proceduralHistory: z.array(z.string()).describe('A log of the procedural steps taken.'),
  currentWitness: z.object({
    name: z.string(),
    background: z.string(),
  }).optional(),
  isAwaitingUserInput: z.boolean(),
});
export type SimulationState = z.infer<typeof SimulationStateSchema>;

export const UserActionSchema = z.object({
  type: z.enum(['START', 'SUBMIT_STATEMENT', 'SUBMIT_QUESTION', 'END_EXAMINATION', 'SUBMIT_CLOSING']),
  payload: z.string().optional(),
});
export type UserAction = z.infer<typeof UserActionSchema>;

export const RunSimulationInputSchema = z.object({
  projectId: z.string(),
  caseStrategy: z.string(),
  currentState: SimulationStateSchema.optional(),
  userAction: UserActionSchema.optional(),
});
export type RunSimulationInput = z.infer<typeof RunSimulationInputSchema>;
export type RunSimulationOutput = SimulationState;
