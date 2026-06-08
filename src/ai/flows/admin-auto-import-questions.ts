'use server';
/**
 * @fileOverview A Genkit flow for administrators to automatically import test questions from documents.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {v4 as uuidv4} from 'uuid';

const QuestionTypeSchema = z.enum(['MCQ', 'AssertionReason', 'ImageMCQ', 'ShortAnswer', 'LongAnswer']);

const QuestionSchema = z.object({
  id: z.string().optional(),
  questionText: z.string().describe("The text of the question."),
  questionType: QuestionTypeSchema.describe("The type of the question."),
  options: z.array(z.string()).optional().describe("Array of 4 options for MCQ."),
  correctAnswer: z.string().optional().describe("The correct option text."),
  subject: z.string().describe("The academic subject."),
  classLevel: z.enum(['10', '11', '12', 'Dropper']),
  explanation: z.string().optional().describe("Explanation for the answer.")
});

const AdminAutoImportQuestionsInputSchema = z.object({
  fileDataUri: z.string(),
  answerKeyDataUri: z.string().optional(),
  fileName: z.string(),
  adminInstructions: z.string().optional()
});

const AdminAutoImportQuestionsOutputSchema = z.array(QuestionSchema);

export async function adminAutoImportQuestions(
  input: z.infer<typeof AdminAutoImportQuestionsInputSchema>
): Promise<z.infer<typeof AdminAutoImportQuestionsOutputSchema>> {
  return adminAutoImportQuestionsFlow(input);
}

const importQuestionsPrompt = ai.definePrompt({
  name: 'importQuestionsPrompt',
  input: {schema: AdminAutoImportQuestionsInputSchema},
  output: {schema: AdminAutoImportQuestionsOutputSchema},
  prompt: `You are an elite academic processor. Your task is to extract every question from the provided document.

CRITICAL RULES:
1. Identify Question Text, Options (A, B, C, D), and Correct Answers.
2. If an Answer Key is provided, use it strictly to map correct answers.
3. Categorize by subject (e.g., Biology, Physics) and class level.
4. If a question is an MCQ, it MUST have 4 options.
5. Provide explanations where possible.

Instructions: {{{adminInstructions}}}

Question Document: {{media url=fileDataUri}}
{{#if answerKeyDataUri}}
Answer Key Document: {{media url=answerKeyDataUri}}
{{/if}}`
});

const adminAutoImportQuestionsFlow = ai.defineFlow(
  {
    name: 'adminAutoImportQuestionsFlow',
    inputSchema: AdminAutoImportQuestionsInputSchema,
    outputSchema: AdminAutoImportQuestionsOutputSchema
  },
  async (input) => {
    const {output} = await importQuestionsPrompt(input);
    if (!output) throw new Error('AI could not parse questions.');
    
    return output.map(q => ({
      ...q,
      id: q.id || uuidv4()
    }));
  }
);
