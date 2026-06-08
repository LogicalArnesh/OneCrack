'use server';
/**
 * @fileOverview High-precision Genkit flow for extracting academic questions from PDFs.
 * Generates unique 4-digit forensic option codes for JEE-Advanced style high-fidelity evaluations.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {v4 as uuidv4} from 'uuid';

const QuestionTypeSchema = z.enum(['MCQ', 'AssertionReason', 'ImageMCQ', 'ShortAnswer', 'LongAnswer']);

const QuestionSchema = z.object({
  id: z.string().optional(),
  questionNumber: z.number().describe("The sequential number from the document."),
  questionText: z.string().describe("The full question body including any context."),
  questionType: QuestionTypeSchema.default('MCQ'),
  options: z.array(z.string()).describe("Exactly 4 options as strings."),
  optionCodes: z.array(z.string()).describe("4 unique generated 4-digit codes for options (e.g. 1021, 1022, 1023, 1024)."),
  correctAnswer: z.string().describe("The exact text of the correct option as it appears in the options list."),
  subject: z.string().describe("Identified subject (Physics/Chemistry/Mathematics/Biology)."),
  explanation: z.string().optional().describe("Detailed solution logic or explanation.")
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
  prompt: `You are an Elite Academic OCR Engine specialized in parsing high-stakes JEE/NEET/Advanced papers from PDF sources.

TASK:
Extract EVERY question from the provided document into a structured JSON array.

INPUTS:
- Source Document: {{media url=fileDataUri}}
{{#if answerKeyDataUri}}
- External Answer Key: {{media url=answerKeyDataUri}}
{{/if}}
- Context: {{{adminInstructions}}}

STRICT EXTRACTION PROTOCOLS:
1. **Option Codes**: For every single question, you MUST generate 4 unique, random 4-digit numeric codes (optionCodes). These act as forensic identifiers.
2. **Correct Answer**: Strictly match the text from the extracted options list.
3. **Question Detection**: Identify question boundaries precisely. Capture multi-line questions and mathematical notation accurately.
4. **Reliability**: If an item is unreadable, skip it. Do not hallucinate content.

Return ONLY a JSON array of question objects that match the requested schema.`
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
        throw new Error('AI Engine failed to return a valid question set.');
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
