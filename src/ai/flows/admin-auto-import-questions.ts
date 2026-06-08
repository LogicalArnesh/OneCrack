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
  subject: z.string().describe("Identified subject (Physics/Chemistry/Mathematics/Biology/General)."),
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
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ]
  },
  system: `You are a Forensic Academic OCR Engine specialized in high-stakes examination parsing (JEE/NEET/Advanced).
Your goal is to extract questions and options with 100% fidelity.

STRICT JSON OUTPUT PROTOCOL:
1. Identify every question block.
2. For every question, you MUST generate 4 unique, random 4-digit numeric codes (e.g. 1021, 1022, 1023, 1024). These codes MUST be different for every option in the entire set.
3. The 'correctAnswer' must EXACTLY match one of the strings in the 'options' array.
4. If options are labeled (A, B, C, D), extract the text following the labels.
5. Use LaTeX-style notation for any mathematical formulas.`,
  prompt: `TASK: Identify and extract every question and its associated options from the provided source document.

INPUTS:
- Source Document: {{media url=fileDataUri}}
{{#if answerKeyDataUri}}
- External Answer Key: {{media url=answerKeyDataUri}}
{{/if}}
- Admin Context: {{{adminInstructions}}}

Return a valid JSON array of question objects following the schema. Ensure the response is a valid JSON array and nothing else.`,
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
      
      if (!output || !Array.isArray(output) || output.length === 0) {
        throw new Error('Neural engine returned an empty set. Ensure the PDF contains text-based or clearly legible questions.');
      }
      
      return output.map(q => ({
        ...q,
        id: q.id || uuidv4()
      }));
    } catch (error: any) {
      console.error("AI Flow Error:", error);
      throw new Error(error.message || "Internal Extraction Failure. Check API key and document format.");
    }
  }
);