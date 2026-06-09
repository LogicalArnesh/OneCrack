'use server';
/**
 * @fileOverview High-precision Neural OCR Genkit flow for extracting academic questions.
 * Optimized for JEE/NEET streams and forensic option tracking.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {v4 as uuidv4} from 'uuid';

const QuestionTypeSchema = z.enum(['MCQ', 'AssertionReason', 'ImageMCQ', 'ShortAnswer', 'LongAnswer']);

const QuestionSchema = z.object({
  id: z.string().optional(),
  questionNumber: z.number().describe("Sequential index."),
  questionText: z.string().describe("Full question body with context."),
  questionType: QuestionTypeSchema.default('MCQ'),
  options: z.array(z.string()).describe("Exactly 4 distinct answer options."),
  optionCodes: z.array(z.string()).describe("4 unique generated 4-digit numeric codes."),
  correctAnswer: z.string().describe("Exact text of the correct option."),
  subject: z.string().describe("Detected subject (Physics/Chemistry/Biology/Mathematics/General)."),
  explanation: z.string().optional().describe("Solution logic.")
});

const AdminAutoImportQuestionsInputSchema = z.object({
  fileDataUri: z.string().describe("Data URI of source document."),
  fileName: z.string(),
  adminInstructions: z.string().optional().describe("Neural override instructions.")
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
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ]
  },
  system: `You are a High-Precision Forensic Academic OCR Engine. 
Your goal is to extract questions with 100% fidelity.

STRICT JSON PROTOCOL:
1. Identify every question and its 4 options.
2. For EVERY option, generate a unique 4-digit numeric code (e.g. 1021, 1022). These MUST be unique across the entire document.
3. Determine the subject (Physics, Chemistry, Biology, Mathematics) for each question based on context.
4. Use LaTeX for formulas.
5. Identify the correct answer exactly as it appears in the options.`,
  prompt: `TASK: Extract all academic questions from the provided source.

SOURCE: {{media url=fileDataUri}}
INSTRUCTIONS: {{{adminInstructions}}}

Return a valid JSON array of question objects.`,
});

const adminAutoImportQuestionsFlow = ai.defineFlow(
  {
    name: 'adminAutoImportQuestionsFlow',
    inputSchema: AdminAutoImportQuestionsInputSchema,
    outputSchema: AdminAutoImportQuestionsOutputSchema
  },
  async (input) => {
    try {
      const {output} = await importQuestionsPrompt(input);
      if (!output) throw new Error('Neural extraction failed.');
      return output.map(q => ({ ...q, id: q.id || uuidv4() }));
    } catch (error: any) {
      console.error("AI Flow Error:", error);
      throw new Error(error.message || "Extraction failed.");
    }
  }
);