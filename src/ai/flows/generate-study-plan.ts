'use server';
/**
 * @fileOverview A Genkit flow for generating personalized study plans based on test performance.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudyPlanInputSchema = z.object({
  studentName: z.string(),
  classLevel: z.string(),
  recentResults: z.array(z.object({
    testTitle: z.string(),
    subject: z.string(),
    score: z.number(),
    maxScore: z.number(),
    wrongQuestions: z.array(z.string()).optional(),
  })),
  goals: z.string().optional(),
});
export type StudyPlanInput = z.infer<typeof StudyPlanInputSchema>;

const StudyPlanOutputSchema = z.object({
  summary: z.string().describe("A brief summary of the student's current performance standing."),
  focusAreas: z.array(z.object({
    topic: z.string(),
    priority: z.enum(['High', 'Medium', 'Low']),
    reason: z.string(),
  })).describe("Specific topics the student needs to focus on."),
  weeklySchedule: z.array(z.object({
    day: z.string(),
    tasks: z.array(z.string()),
  })).describe("A 7-day recommended study schedule."),
  motivationalQuote: z.string(),
});
export type StudyPlanOutput = z.infer<typeof StudyPlanOutputSchema>;

export async function generateStudyPlan(input: StudyPlanInput): Promise<StudyPlanOutput> {
  return generateStudyPlanFlow(input);
}

const studyPlanPrompt = ai.definePrompt({
  name: 'studyPlanPrompt',
  input: {schema: StudyPlanInputSchema},
  output: {schema: StudyPlanOutputSchema},
  prompt: `You are an expert academic counselor and tutor. 
Analyze the following test results for {{{studentName}}} (Class {{{classLevel}}}).
Identify patterns in their mistakes and strengths. 
Generate a detailed, actionable study plan for the next week.

Recent Results:
{{#each recentResults}}
- Test: {{{testTitle}}} ({{{subject}}})
- Score: {{{score}}}/{{{maxScore}}}
{{#if wrongQuestions}}
- Weak areas identified: {{#each wrongQuestions}}{{{this}}}, {{/each}}
{{/if}}
{{/each}}

Additional Goals/Context: {{{goals}}}

Provide a balanced schedule that prioritizes high-impact topics.`
});

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: StudyPlanInputSchema,
    outputSchema: StudyPlanOutputSchema
  },
  async (input) => {
    const {output} = await studyPlanPrompt(input);
    if (!output) throw new Error('Failed to generate study plan.');
    return output;
  }
);
