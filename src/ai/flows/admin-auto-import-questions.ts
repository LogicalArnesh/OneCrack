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
  questionText: z.string().describe("The full text of the question."),
  questionType: QuestionTypeSchema.describe("The classification of the question type."),
  options: z.array(z.string()).optional().describe("Exactly 4 options for MCQ type questions."),
  correctAnswer: z.string().optional().describe("the exact text of the correct option."),
  subject: z.string().describe("The academic subject (e.g., Biology, Physics, Chemistry, Mathematics)."),
  classLevel: z.enum(['10', '11', '12', 'Dropper']),
  explanation: z.string().optional().describe("A brief step-by-step solution or explanation.")
});

const AdminAutoImportQuestionsInputSchema = z.object({
  fileDataUri: z.string().describe("Data URI of the question paper document."),
  answerKeyDataUri: z.string().optional().describe("Data URI of the separate answer key document if provided."),
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
  prompt: `You are a high-precision academic OCR and parsing engine. Your objective is to extract every single question from the provided document and format it into a structured test bank.

CONTEXT:
- Target Subject/Class: {{{adminInstructions}}}
- Document: {{media url=fileDataUri}}
{{#if answerKeyDataUri}}
- Answer Key: {{media url=answerKeyDataUri}}
{{/if}}

EXTRACTION PROTOCOL:
1. **Precision Extraction**: Identify question text, all 4 options (A, B, C, D), and the correct answer.
2. **Subject Mapping**: If the document contains multiple subjects, categorize each question accurately.
3. **Answer Key Integration**: If a separate Answer Key document is provided, strictly use it to map correct answers. If not, use your internal knowledge to solve the question and provide the correct answer.
4. **Data Integrity**: For MCQs, ensure the 'options' array contains exactly 4 strings.
5. **Class Level**: Default to the class level provided in instructions unless specified otherwise in the text.

FORMATTING:
Return a clean array of questions matching the defined schema.`
});

const adminAutoImportQuestionsFlow = ai.defineFlow(
  {
    name: 'adminAutoImportQuestionsFlow',
    inputSchema: AdminAutoImportQuestionsInputSchema,
    outputSchema: AdminAutoImportQuestionsOutputSchema
  },
  async (input) => {
    const {output} = await importQuestionsPrompt(input);
    if (!output) throw new Error('AI could not parse questions from the provided documents.');
    
    return output.map(q => ({
      ...q,
      id: q.id || uuidv4()
    }));
  }
);
