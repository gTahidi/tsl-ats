import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedCvSchema, ParsedCv } from './schema';
import { jobPostings } from '@/db/schema';
import { ZodError } from 'zod';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

export async function parseAndRankCvWithGemini(
  file: File,
  job: typeof jobPostings.$inferSelect
): Promise<ParsedCv> {
  const base64File = await file
    .arrayBuffer()
    .then(buffer => Buffer.from(buffer).toString('base64'));
  const filePart = {
    inlineData: {
      data: base64File,
      mimeType: file.type,
    },
  };

  // First attempt
  const initialPrompt = buildMegaPrompt(job);
  const initialResult = await model.generateContent([initialPrompt, filePart]);
  const rawResponse = initialResult.response.text();

  console.log('--- Gemini Raw Response (Attempt 1) ---');
  console.log(rawResponse);
  console.log('---------------------------------------');

  try {
    const parsedJson = JSON.parse(rawResponse);
    return ParsedCvSchema.parse(parsedJson);
  } catch (error) {
    if (error instanceof ZodError) {
      console.warn(
        'First parsing attempt failed with ZodError. Attempting self-correction...'
      );

      const correctionPrompt = buildCorrectionPrompt(
        job,
        rawResponse,
        error
      );
      const correctedResult = await model.generateContent([
        correctionPrompt,
        filePart,
      ]);
      const correctedResponse = correctedResult.response.text();

      console.log('--- Gemini Raw Response (Attempt 2) ---');
      console.log(correctedResponse);
      console.log('---------------------------------------');

      try {
        const parsedJson = JSON.parse(correctedResponse);
        return ParsedCvSchema.parse(parsedJson);
      } catch (finalError) {
        console.error('Error parsing corrected Gemini response:', finalError);
        throw new Error('Failed to parse data from Gemini after correction.');
      }
    } else {
      // Handle non-Zod errors (e.g., JSON.parse failure)
      console.error('Error parsing initial Gemini response:', error);
      throw new Error('Failed to parse initial data from Gemini.');
    }
  }
}

function buildCorrectionPrompt(
  job: typeof jobPostings.$inferSelect,
  previousResponse: string,
  error: ZodError
): string {
  const jobJson = JSON.stringify({ title: job.title, description: job.description }, null, 2);
  const errorJson = JSON.stringify(error.errors, null, 2);

  return `
    You are an expert recruitment consultant acting as a data quality assurance specialist.
    Your previous attempt to parse a CV failed due to schema validation errors.
    Your task is to re-analyze the original CV, examine your previous incorrect JSON output, understand the validation errors, and produce a new, valid JSON object.

    **Job Description:**
    ${jobJson}

    **Original CV:**
    The CV is provided as a file input.

    **Your Previous (Incorrect) JSON Output:**
    ${previousResponse}

    **Validation Errors:**
    ${errorJson}

    **Instructions:**
    1.  **Analyze the Errors:** The errors above indicate where your previous JSON output did not match the required schema. Common mistakes include missing required fields or using the wrong data type (e.g., 'null' instead of a string).
    2.  **Re-Examine the CV:** Carefully re-read the entire CV document to find the correct information for the fields that had errors.
    3.  **Correct the JSON:** Generate a completely new JSON object that fixes all the validation errors and accurately reflects the CV's content.
    4.  **Ensure Full Compliance:** The final JSON object must strictly conform to the schema provided in the initial prompt. Pay close attention to required fields and data types.

    Return only the corrected, valid JSON object.
  `;
}

function buildMegaPrompt(job: typeof jobPostings.$inferSelect): string {
  const jobJson = JSON.stringify({ title: job.title, description: job.description }, null, 2);

  return `
    You are an expert recruitment consultant and hiring manager with 20 years of experience.
    Your task is to analyze the provided candidate CV against the job description and return a single, comprehensive, structured JSON object.

    **Job Description:**
    ${jobJson}

    **Instructions:**
    1.  **Extract CV Data:** Parse the document to extract the candidate's contact information. Crucially, you must separate the candidate's first name (given name) into the 'name' field and their last name (family name) into the 'surname' field. Also extract their work experience, education, skills, certifications, and a list of any professional referees mentioned.
    2.  **Rank the Candidate:** Based on the CV and the job description, provide a ranking.
        -   \`matchScore\`: A score from 0-100 indicating suitability.
        -   \`summary\`: A concise explanation for the score, highlighting strengths and weaknesses.
        -   \`questions\`: Answer the predefined interview questions based *only* on the CV content. If the answer isn't there, state that clearly.
    3.  **Handle Missing Data:** Use 'null' for optional fields if the information is not available.
    4.  **Format Consistently:** Ensure all dates are in a consistent format (e.g., "Month YYYY").

    **Predefined Interview Questions:**
    - "Tell us about your experience with financial reporting and compliance."
    - "Which accounting software are you proficient in?"
    - "Describe a time you improved an accounting process or system."

    **Output Format:**
    Return a single, valid JSON object that conforms to the schema below. Do not include any other text or markdown formatting.

    **JSON Schema:**
    {
      "type": "object",
      "properties": {
        "contactInfo": { "type": "object", "properties": { "name": { "type": "string", "description": "Candidate's first name (given name)" }, "surname": { "type": "string", "description": "Candidate's last name (family name)" }, "email": { "type": "string", "format": "email" }, "phone": { "type": "string" }, "location": { "type": "string" }, "linkedinUrl": { "type": "string", "format": "uri" }, "githubUrl": { "type": "string", "format": "uri" }, "portfolioUrl": { "type": "string", "format": "uri" } } },
        "workExperience": { "type": "array", "items": { "type": "object", "properties": { "company": { "type": "string" }, "jobTitle": { "type": "string" }, "startDate": { "type": "string" }, "endDate": { "type": "string" }, "current": { "type": "boolean" }, "description": { "type": "string" }, "achievements": { "type": "array", "items": { "type": "string" } } } } },
        "education": { "type": "array", "items": { "type": "object", "properties": { "institution": { "type": "string" }, "degree": { "type": "string" }, "field": { "type": "string" }, "startDate": { "type": "string" }, "endDate": { "type": "string" }, "current": { "type": "boolean" } } } },
        "skills": { "type": "object", "properties": { "languages": { "type": "array", "items": { "type": "string" } }, "frameworks": { "type": "array", "items": { "type": "string" } }, "tools": { "type": "array", "items": { "type": "string" } }, "methodologies": { "type": "array", "items": { "type": "string" } } } },
        "certifications": { "type": "array", "items": { "type": "object", "properties": { "name": { "type": "string" }, "issuer": { "type": "string" }, "date": { "type": "string" }, "credentialUrl": { "type": "string", "format": "uri" } } } },
        "ranking": { "type": "object", "properties": { "matchScore": { "type": "number" }, "summary": { "type": "string" }, "questions": { "type": "array", "items": { "type": "object", "properties": { "question": { "type": "string" }, "answer": { "type": "string" } } } } } },
        "referees": { "type": "array", "items": { "type": "object", "properties": { "name": { "type": "string" }, "email": { "type": "string", "format": "email" }, "phone": { "type": "string" }, "organization": { "type": "string" } } } }
      },
      "required": ["contactInfo", "workExperience", "education", "skills", "ranking"]
    }
  `;
}
