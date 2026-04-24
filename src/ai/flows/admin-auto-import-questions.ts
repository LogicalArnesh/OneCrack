'use server';
/**
 * @fileOverview A Genkit flow for administrators to automatically import test questions from PDF or Word documents.
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
      "The test questions file (PDF or Word document) as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'. The MIME type should be 'application/pdf' or 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'."
    ),
  fileName: z.string().describe("The original name of the uploaded file (e.g., 'math_quiz.pdf')."),
  adminInstructions: z.string().optional().describe("Optional instructions from the admin for question extraction, e.g., 'Focus on Chapter 5 questions only'.")
});
export type AdminAutoImportQuestionsInput = z.infer<typeof AdminAutoImportQuestionsInputSchema>;

// --- Output Schema ---
const QuestionTypeSchema = z.enum(['MCQ', 'AssertionReason', 'ImageMCQ', 'ShortAnswer', 'LongAnswer']);

const QuestionSchema = z.object({
  id: z.string().describe("Unique identifier for the question."),
  questionText: z.string().describe("The text of the question."),
  questionType: QuestionTypeSchema.describe("The type of the question."),
  options: z.array(z.string()).optional().describe("Array of answer options for MCQ questions."),
  correctAnswer: z.union([z.string(), z.array(z.string())]).optional().describe("The correct answer(s) to the question. For MCQ, it should match one or more of the options. For short/long answer, it's the expected answer text."),
  subject: z.string().describe("The inferred subject of the question (e.g., 'Mathematics', 'Biology', 'Physics', 'Chemistry')."),
  classLevel: z.union([z.literal('10'), z.literal('11'), z.literal('12'), z.literal('Dropper')]).describe("The inferred class level for the question."),
  imageIncluded: z.boolean().optional().describe("True if the question inherently includes an image that is part of the question's content or context. This boolean indicates presence, not the image data itself which should be handled separately if extracted."),
  explanation: z.string().optional().describe("An optional explanation for the correct answer."),
  marksCorrect: z.number().optional().describe("Default marks for a correct attempt, if specified in the document or inferred."),
  marksWrong: z.number().optional().describe("Default marks to deduct for a wrong attempt, if specified in the document or inferred.")
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
Your task is to parse the provided document, identify individual questions, categorize them, and classify them by subject and class level.

Analyze the document carefully, looking for patterns that indicate questions, options, correct answers, subjects, and class levels.
If a question contains or refers to an image, set 'imageIncluded' to true. Do not extract the image data itself, just note its presence.
For multiple-choice questions (MCQ) or Image+MCQ, extract the 'options' and the 'correctAnswer'.
For Assertion-Reason questions, ensure the question type is correctly identified.
For Short Answer or Long Answer questions, provide a representative 'correctAnswer' if possible, otherwise leave it empty.
Infer 'subject' and 'classLevel' based on the content of the document or general knowledge. If explicit values for marks are found, include them.

Admin Instructions (if any): {{{adminInstructions}}}

Document Name: {{{fileName}}}
Document Content: {{media url=fileDataUri}}`
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
    // Ensure each question has a unique ID, generating one if the LLM didn't (though prompt asks for it).
    const questionsWithIds = output.map((q) => ({
      ...q,
      id: q.id || uuidv4()
    }));
    return questionsWithIds;
  }
);
