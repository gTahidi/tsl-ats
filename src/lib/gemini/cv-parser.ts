import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedCvSchema, ParsedCv } from './schema';
import { jobPostings } from '@/db/schema';
import { ZodError } from 'zod';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

export async function parseAndRankCvWithGemini(
  file: File,
  job: typeof jobPostings.$inferSelect
): Promise<ParsedCv> {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type;

  const filePart = {
    inlineData: {
      data: fileBuffer.toString('base64'),
      mimeType,
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
**CONTEXT - JOB REQUIREMENTS:**
${jobJson}

**SCORING EXAMPLES FOR REFERENCE:**
- 95/100: Candidate exceeds all requirements + bonus skills (e.g., 8+ years experience when 5+ required, advanced certifications)
- 85/100: Strong match - meets most key requirements well with solid experience
- 65/100: Partial match - meets some requirements but has notable gaps  
- 45/100: Weak match - missing several key requirements
- 25/100: Poor match - lacks most basic requirements

**ROLE:**
You are a DECISIVE senior recruitment expert with 20 years of experience. You must create CLEAR DISTINCTIONS between candidates - avoid giving similar scores to different people.

**CRITICAL RATING INSTRUCTIONS:**

**WEIGHTED SCORING BREAKDOWN:**
1. **Experience Relevance (30 points):** Years of relevant experience, seniority level, industry match
2. **Skills & Technical Match (25 points):** Required technologies, tools, methodologies  
3. **Education & Certifications (20 points):** Degree requirements, professional certifications
4. **Additional Qualifications (15 points):** Leadership, achievements, special projects
5. **Role-Specific Fit (10 points):** Communication, cultural indicators, soft skills

**DECISIVE SCORING RULES:**
- If missing 2+ critical requirements → Score BELOW 60
- If exceeds most expectations → Score ABOVE 85  
- NEVER give similar scores (within 5 points) to different candidates
- Be harsh on missing key skills, generous on exceptional qualifications
- Use the FULL range 0-100, avoid clustering around 70-80 and multiples of 5

**SUMMARY FORMAT:**
Write a concise, professional summary (max 150 words):
- **Assessment:** Brief verdict on candidate fit
- **Strengths:** Top 2 strengths with examples
- **Concerns:** Key gaps/weaknesses  
- **Score:** Why this specific score
- **Recommendation:** Hire/Don't hire

**TASK:**
1. **Extract CV Data:** Parse the document to extract the candidate's contact information. Crucially, you must separate the candidate's first name (given name) into the 'name' field and their last name (family name) into the 'surname' field. Also extract their work experience, education, skills, certifications, and a list of any professional referees mentioned.
2. **Rank the Candidate:** Analyze the CV against job requirements and provide a decisive matchScore with detailed markdown summary.
3. **Handle Missing Data:** Use 'null' for optional fields if the information is not available.
4. **Format Consistently:** Ensure all dates are in a consistent format (e.g., "Month YYYY").

**CV SCREENING QUESTIONS:**
- "How many years of relevant work experience does this candidate have in the required field?"
- "What specific technical skills, software, or certifications mentioned on the CV match the job requirements?"
- "What is the candidate's highest level of education and is it relevant to this position?"
- "What measurable achievements, quantified results, or career progression indicators are evident on the CV?"
- "Are there any red flags such as employment gaps, job hopping, or missing critical qualifications?"

**OUTPUT FORMAT:**
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
