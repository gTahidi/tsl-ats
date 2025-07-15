import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedCvSchema, type ParsedCv } from './schema';

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Parses a CV file using the Gemini API with document processing
 * @param file The CV file to process
 * @returns A promise that resolves to the parsed and validated CV data
 */
export async function parseCvWithGemini(file: File): Promise<ParsedCv> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-pro',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  try {
    // Convert file to base64 for Gemini
    const base64File = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

    // Call Gemini with the document
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {
            fileData: {
              mimeType: file.type || 'application/pdf',
              data: base64File.split(',')[1] // Remove the data URL prefix
            }
          },
          {
            text: `Extract the CV information in a structured JSON format including:
            - Personal details (name, email, phone, location, links)
            - Work experience (company, title, dates, description, achievements)
            - Education (institution, degree, field, dates)
            - Skills (languages, technologies, tools, methodologies)
            - Projects (name, description, technologies, role)
            - Certifications (name, issuer, date)
            
            Format the response as a valid JSON object that matches this TypeScript interface:
            interface ParsedCv {
              contactInfo: {
                name: string;
                email: string;
                phone?: string;
                location?: string;
                linkedinUrl?: string;
                githubUrl?: string;
                portfolioUrl?: string;
              };
              workExperience: Array<{
                company: string;
                title: string;
                startDate: string;
                endDate?: string;
                current: boolean;
                description?: string;
                achievements?: string[];
              }>;
              education: Array<{
                institution: string;
                degree: string;
                field: string;
                startDate: string;
                endDate?: string;
                current: boolean;
              }>;
              skills: {
                languages?: string[];
                frameworks?: string[];
                tools?: string[];
                methodologies?: string[];
              };
              projects?: Array<{
                name: string;
                description: string;
                technologies: string[];
                role?: string;
                url?: string;
              }>;
              certifications?: Array<{
                name: string;
                issuer: string;
                date: string;
                credentialUrl?: string;
              }>;
            }`
          }
        ]
      }]
    });

    // Get the response text
    const response = await result.response;
    const responseText = response.text();
    
    // Parse the response as JSON
    try {
      // Extract JSON from markdown code block if present
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                       responseText.match(/```([\s\S]*?)\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? (jsonMatch[2] || jsonMatch[1]) : responseText;
      const parsedJson = JSON.parse(jsonString);
      
      // Validate the parsed JSON against our schema
      return ParsedCvSchema.parse(parsedJson);
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      throw new Error(`Failed to parse CV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error processing CV with Gemini:', error);
    throw new Error(`CV processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
