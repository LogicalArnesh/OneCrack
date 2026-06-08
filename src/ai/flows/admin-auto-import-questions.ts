'use server';
/**
 * @fileOverview A high-precision Genkit flow for extracting academic questions.
 * Enhanced with 4-digit forensic option codes for professional evaluations.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {v4 as uuidv4} from 'uuid';

const QuestionTypeSchema = z.enum(['MCQ', 'AssertionReason', 'ImageMCQ', 'ShortAnswer', 'LongAnswer']);

const QuestionSchema = z.object({
  id: z.string().optional(),
  questionNumber: z.number().describe("The sequential number from the document."),
  questionText: z.string().describe("The full question body."),
  questionType: QuestionTypeSchema.default('MCQ'),
  options: z.array(z.string()).describe("Exactly 4 options."),
  optionCodes: z.array(z.string()).describe("4 unique generated 4-digit codes for options (e.g. 1021, 1022, 1023, 1024)."),
  correctAnswer: z.string().describe("The exact text of the correct option."),
  subject: z.string().describe("Identified subject (Physics/Chemistry/Math/Biology)."),
  explanation: z.string().optional().describe("Detailed solution logic.")
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
  prompt: `You are an Elite Academic OCR Engine specialized in JEE/NEET paper parsing.

TASK:
Extract EVERY question from the provided document into a structured JSON array.

INPUTS:
- Source Document: {{media url=fileDataUri}}
{{#if answerKeyDataUri}}
- External Answer Key: {{media url=answerKeyDataUri}}
{{/if}}
- Context: {{{adminInstructions}}}

STRICT PROTOCOLS:
1. **Option Codes**: For every question, you MUST generate 4 unique 4-digit numeric codes (optionCodes). These are forensic identifiers for each option.
2. **Correct Answer**: Strictly match the text from the options list. If an external key is provided, use it. If not, solve the question with 100% precision.
3. **Structure**: 
   - 'questionNumber': The number as it appears in the PDF.
   - 'questionText': Preserve formatting and scientific notation.
   - 'options': Exactly 4 strings.
   - 'subject': Categorize based on content.
4. **Failure Case**: If a question is incomplete or unreadable, skip it rather than hallucinating.

Return ONLY a JSON array of question objects.`
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
      if (!output) throw new Error('AI Engine failed to return a valid response.');
      
      return output.map(q => ({
        ...q,
        id: q.id || uuidv4()
      }));
    } catch (error: any) {
      console.error("AI Flow Error:", error);
      throw new Error(`Extraction Logic Failed: ${error.message}`);
    }
  }
);