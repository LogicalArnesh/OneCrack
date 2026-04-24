'use server';
/**
 * @fileOverview A Genkit flow for administrators to automatically import test questions from PDF or Word documents, with optional answer key support.
 *
 * - adminAutoImportQuestions - A function that handles the automatic import process.
 * - AdminAutoImportQuestionsInput - The input type for the adminAutoImportQuestions function.
 * - AdminAutoImportQuestionsOutput - The return type for the adminAutoImportQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {v4 as uuidv4} from 'uuid';

// --- Input Schema ---
const AdminAutoImportQuestionsInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The test questions file (PDF or Word document) as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  answerKeyDataUri: z
    .string()
    .optional()
    .describe(
      "Optional answer key file (PDF or Word document) as a data URI. Use this to cross-reference correct answers and explanations."
    ),
  fileName: z.string().describe("The original name of the uploaded questions file."),
  adminInstructions: z.string().optional().describe("Optional instructions from the admin for question extraction.")
});
export type AdminAutoImportQuestionsInput = z.infer<typeof AdminAutoImportQuestionsInputSchema>;

// --- Output Schema ---
const QuestionTypeSchema = z.enum(['MCQ', 'AssertionReason', 'ImageMCQ', 'ShortAnswer', 'LongAnswer']);

const QuestionSchema = z.object({
  id: z.string().describe("Unique identifier for the question."),
  questionText: z.string().describe("The text of the question."),
  questionType: QuestionTypeSchema.describe("The type of the question."),
  options: z.array(z.string()).optional().describe("Array of answer options for MCQ questions."),
  correctAnswer: z.union([z.string(), z.array(z.string())]).optional().describe("The correct answer(s) to the question."),
  subject: z.string().describe("The inferred subject of the question."),
  classLevel: z.union([z.literal('10'), z.literal('11'), z.literal('12'), z.literal('Dropper')]).describe("The inferred class level for the question."),
  imageIncluded: z.boolean().optional().describe("True if the question inherently includes an image."),
  explanation: z.string().optional().describe("An optional explanation for the correct answer."),
  marksCorrect: z.number().optional().describe("Default marks for a correct attempt."),
  marksWrong: z.number().optional().describe("Default marks to deduct for a wrong attempt.")
});
export type Question = z.infer<typeof QuestionSchema>;

const AdminAutoImportQuestionsOutputSchema = z.array(QuestionSchema);
export type AdminAutoImportQuestionsOutput = z.infer<typeof AdminAutoImportQuestionsOutputSchema>;

export async function adminAutoImportQuestions(
  input: AdminAutoImportQuestionsInput
): Promise<AdminAutoImportQuestionsOutput> {
  return adminAutoImportQuestionsFlow(input);
}

const importQuestionsPrompt = ai.definePrompt({
  name: 'importQuestionsPrompt',
  input: {schema: AdminAutoImportQuestionsInputSchema},
  output: {schema: AdminAutoImportQuestionsOutputSchema},
  prompt: `You are an expert at extracting and categorizing test questions from documents.
Your task is to parse the provided question document and, if provided, the answer key document.

Extract individual questions, categorize them, and classify them by subject and class level.
If an Answer Key is provided, use it to populate the 'correctAnswer' and 'explanation' fields accurately.

Analyze the documents carefully. Look for patterns in questions, options, and answers.
If a question contains or refers to an image, set 'imageIncluded' to true.

Admin Instructions: {{{adminInstructions}}}

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
    if (!output) {
      throw new Error('Failed to extract questions from the document.');
    }
    const questionsWithIds = output.map((q) => ({
      ...q,
      id: q.id || uuidv4()
    }));
    return questionsWithIds;
  }
);