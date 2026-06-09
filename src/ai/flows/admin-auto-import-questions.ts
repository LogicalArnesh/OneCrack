
'use server';
/**
 * @fileOverview High-precision Forensic AI Extraction Flow.
 * Optimized for parsing JEE/NEET questions with automatic forensic code generation.
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
  subject: z.string().describe("Detected subject (Physics/Chemistry/Biology/Mathematics)."),
  explanation: z.string().optional().describe("Solution logic.")
});

const AdminAutoImportQuestionsInputSchema = z.object({
  fileDataUri: z.string().optional().describe("Data URI of source document."),
  sourceUrl: z.string().optional().describe("Direct URL to the source document (Drive, Dropbox, etc)."),
  fileName: z.string().optional(),
  adminInstructions: z.string().optional().describe("Specific manual prompt overrides.")
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
  system: `You are a Forensic Academic Data Architect. 
Your mission is to extract academic questions from provided sources (PDFs or URLs) with 100% precision.

STRICT PROTOCOL:
1. Identify all questions and their options.
2. For EVERY option, generate a unique 4-digit numeric code (e.g. 1021, 5672).
3. Detect subjects: Physics, Chemistry, Biology, or Mathematics.
4. Use LaTeX for formulas where appropriate.
5. Extract the correct answer strictly as it appears in the text.
6. If a URL is provided, it is your primary source of truth. Use it to extract questions.`,
  prompt: `TASK: Extract academic questions and map to forensic codes.

{{#if sourceUrl}}SOURCE URL: {{{sourceUrl}}}{{/if}}
{{#if fileDataUri}}LOCAL SOURCE: {{media url=fileDataUri}}{{/if}}
INSTRUCTIONS: {{{adminInstructions}}}

Return a valid JSON array of question objects. If the source is empty or unreadable, return an empty array.`,
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
      if (!output || output.length === 0) {
        // Return an empty array if nothing found instead of throwing immediately to allow UI handling
        return [];
      }
      
      return output.map(q => ({ 
        ...q, 
        id: q.id || uuidv4(),
        optionCodes: q.optionCodes && q.optionCodes.length === 4 ? q.optionCodes : Array.from({length: 4}, () => Math.floor(1000 + Math.random() * 9000).toString())
      }));
    } catch (error: any) {
      console.error("AI Neural Error:", error);
      throw new Error(error.message || "Forensic extraction pipeline failed. Please verify Drive link permissions or file readability.");
    }
  }
);
