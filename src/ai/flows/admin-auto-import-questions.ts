'use server';
/**
 * @fileOverview High-precision Forensic AI Extraction Flow.
 * Optimized for parsing JEE/NEET questions from direct uploads or Drive URLs.
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
Your mission is to extract questions with 100% precision from provided sources.

STRICT JSON EXTRACTION PROTOCOL:
1. Identify all questions and their 4 options.
2. For EVERY option, generate a unique 4-digit numeric code (e.g. 1021, 5672). These MUST be unique per option.
3. Automatically detect the subject (Physics, Chemistry, Biology, Mathematics).
4. Use LaTeX for complex formulas.
5. Identify the correct answer exactly as it appears in the text or provided answer key.
6. If a URL is provided, treat the content at that link as the primary source of truth for questions and answers.`,
  prompt: `TASK: Extract academic questions and map to forensic codes.

{{#if sourceUrl}}SOURCE URL (FETCH CONTENT): {{{sourceUrl}}}{{/if}}
{{#if fileDataUri}}LOCAL SOURCE: {{media url=fileDataUri}}{{/if}}
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
      if (!output || output.length === 0) throw new Error('Neural pipeline returned zero items. Verify document permissions or URL.');
      
      return output.map(q => ({ 
        ...q, 
        id: q.id || uuidv4(),
        optionCodes: q.optionCodes && q.optionCodes.length === 4 ? q.optionCodes : Array.from({length: 4}, () => Math.floor(1000 + Math.random() * 9000).toString())
      }));
    } catch (error: any) {
      console.error("AI Neural Error:", error);
      throw new Error(error.message || "Forensic extraction pipeline failed.");
    }
  }
);