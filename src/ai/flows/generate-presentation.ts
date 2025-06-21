
'use server';
/**
 * @fileOverview A Genkit flow to generate a downloadable presentation in DOCX format from a case analysis.
 * This flow takes a structured analysis object, generates presentation content using an LLM,
 * converts that content to an HTML string, and then uses the html-to-docx library
 * to create a Word document buffer, which is returned as a Base64 string.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import htmlToDocx from 'html-to-docx';
import {
  GeneratePresentationInputSchema,
  GeneratePresentationOutputSchema,
  PresentationContentSchema,
} from '@/lib/types';
import type { GeneratePresentationInput, GeneratePresentationOutput, PresentationContent, Slide, Analysis } from '@/lib/types';

export async function generatePresentation(input: GeneratePresentationInput): Promise<GeneratePresentationOutput> {
  return generatePresentationFlow(input);
}

// Define a schema for the prompt's input, which expects the analysis as a JSON string.
const PresentationContentPromptInputSchema = z.object({
  analysis: z.string().describe('A JSON string representation of the complete analysis object.'),
  projectName: z.string(),
});

const presentationContentPrompt = ai.definePrompt({
  name: 'generatePresentationContentPrompt',
  input: { schema: PresentationContentPromptInputSchema },
  output: { schema: PresentationContentSchema },
  prompt: `You are an expert legal assistant tasked with creating a professional slide deck from a detailed case analysis.
  
  The project is named: "{{projectName}}"

  Here is the full analysis data:
  \`\`\`json
  {{{analysis}}}
  \`\`\`
  
  Your task is to synthesize this data into a clear, concise, and compelling presentation. Structure the output as a JSON object adhering to the provided schema. Create slides for the following sections:
  1.  **Title Slide**: Project Name and a subtitle like "Strategic Case Analysis".
  2.  **Executive Summary**: A slide summarizing the Arbiter's high-level predictive analysis and refined strategy.
  3.  **Our Strengths (Advocate's Brief)**: One slide for each key argument, listing the argument as the title and relevant case citations in the bullets.
  4.  **Potential Weaknesses**: One slide for each identified weakness, with the weakness as the title, and the rationale and vulnerability score as bullets.
  5.  **Adversarial Playbook**: A slide summarizing the opposing counsel's likely strategy and our primary counter-arguments.
  6.  **Action Plan**: A final slide with a title like "Next Steps" or "Recommendations".

  For each slide, provide concise bullet points and, where appropriate, speaker notes to elaborate on key points.
  `,
  model: 'googleai/gemini-2.5-flash',
});

// Helper function to convert JSON content to an HTML string
const convertContentToHtml = (content: PresentationContent): string => {
  const slideToHtml = (slide: Slide) => {
    let slideHtml = `<h1>${slide.title}</h1>`;
    if (slide.subtitle) {
      slideHtml += `<h2>${slide.subtitle}</h2>`;
    }
    if (slide.bullets && slide.bullets.length > 0) {
      slideHtml += '<ul>';
      slide.bullets.forEach(bullet => {
        slideHtml += `<li>${bullet}</li>`;
      });
      slideHtml += '</ul>';
    }
    if (slide.speakerNotes) {
      slideHtml += `<br/><p><em>Speaker Notes: ${slide.speakerNotes}</em></p>`;
    }
    // Use page break to simulate new slide
    return slideHtml + '<br style="page-break-before: always">';
  };

  let fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${content.title}</title>
        <style>
          h1 { font-size: 24pt; font-weight: bold; }
          h2 { font-size: 18pt; font-weight: normal; }
          ul { list-style-type: disc; margin-left: 20px; }
          li { font-size: 12pt; }
          p { font-size: 10pt; }
        </style>
      </head>
      <body>
        ${content.slides.map(slideToHtml).join('')}
      </body>
    </html>
  `;
  
  return fullHtml;
};


const generatePresentationFlow = ai.defineFlow(
  {
    name: 'generatePresentationFlow',
    inputSchema: GeneratePresentationInputSchema,
    outputSchema: GeneratePresentationOutputSchema,
  },
  async ({ analysis, projectName }) => {
    // Step 1: Generate the structured content for the presentation.
    const { output: presentationContent } = await presentationContentPrompt({
      analysis, // Pass the JSON string directly
      projectName,
    });

    if (!presentationContent) {
      throw new Error('AI failed to generate presentation content.');
    }

    // Step 2: Convert the structured content to an HTML string.
    const htmlString = convertContentToHtml(presentationContent);

    // Step 3: Convert HTML to a DOCX buffer.
    const fileBuffer = await htmlToDocx(htmlString, undefined, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    // Step 4: Convert the buffer to a Base64 string to send to the client.
    const base64String = (fileBuffer as Buffer).toString('base64');

    // Step 5: Return the file name and content.
    return {
      fileName: `${projectName.replace(/ /g, '_')}_Strategy_Deck.docx`,
      fileContent: base64String,
    };
  }
);
