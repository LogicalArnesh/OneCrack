'use server';
/**
 * @fileOverview High-precision Neural OCR Genkit flow for extracting academic questions.
 * Enforces strict formatting and 4-digit forensic option codes for high-fidelity evaluation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {v4 as uuidv4} from 'uuid';

const QuestionTypeSchema = z.enum(['MCQ', 'AssertionReason', 'ImageMCQ', 'ShortAnswer', 'LongAnswer']);

const QuestionSchema = z.object({
  id: z.string().optional(),
  questionNumber: z.number().describe("The sequential number from the document."),
  questionText: z.string().describe("The full question body including any context or formulas."),
  questionType: QuestionTypeSchema.default('MCQ'),
  options: z.array(z.string()).describe("Exactly 4 distinct answer options."),
  optionCodes: z.array(z.string()).describe("4 unique generated 4-digit numeric codes (e.g. 1021, 1022, 1023, 1024)."),
  correctAnswer: z.string().describe("The exact text of the correct option as it appears in the options list."),
  subject: z.string().describe("Identified subject (Physics/Chemistry/Mathematics/Biology)."),
  explanation: z.string().optional().describe("Detailed solution logic or explanation for the correct answer.")
});

const AdminAutoImportQuestionsInputSchema = z.object({
  fileDataUri: z.string().describe("Data URI of the source PDF/DOCX."),
  answerKeyDataUri: z.string().optional().describe("Data URI of the key if separate."),
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
  prompt: `You are a Forensic Academic OCR Engine specialized in high-stakes examination parsing (JEE/NEET/Advanced).

TASK:
Identify and extract every question and its associated options from the provided source.

INPUTS:
- Source Document: {{media url=fileDataUri}}
{{#if answerKeyDataUri}}
- External Answer Key: {{media url=answerKeyDataUri}}
{{/if}}
- Admin Context: {{{adminInstructions}}}

STRICT PROTOCOLS:
1. **Option Extraction**: Identify all 4 options for every MCQ. Do not truncate text.
2. **Forensic Option Codes**: For every single question, you MUST generate 4 unique, random 4-digit numeric codes. These must be assigned sequentially to the options.
3. **Correct Answer Matching**: Ensure the correctAnswer field exactly matches the text of one of the options.
4. **Subject Mapping**: Categorize questions into Physics, Chemistry, Mathematics, or Biology based on content.
5. **Mathematical Precision**: Capture formulas and notation as accurately as possible in the text strings.

Return ONLY a valid JSON array of question objects.`
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
      if (!output || !Array.isArray(output)) {
        throw new Error('Neural Extraction Engine failed to return a structured question set.');
      }
      
      return output.map(q => ({
        ...q,
        id: q.id || uuidv4()
      }));
    } catch (error: any) {
      console.error("AI Flow Error:", error);
      throw new Error(`Neural Extraction Failure: ${error.message}`);
    }
  }
);
