import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Part } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function fileToGenerativePart(file: File): Promise<Part> {
  const base64EncodedData = Buffer.from(await file.arrayBuffer()).toString('base64');
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
}

export async function extractTextWithGemini(file: File): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

  const filePart = await fileToGenerativePart(file);
  const prompt = 'Extract the full text content from this document. Do not summarize or add any extra commentary, just return the raw text.';

  const result = await model.generateContent({ 
      contents: [{ role: 'user', parts: [filePart, { text: prompt }] }],
      generationConfig: {
        temperature: 0,
      }
  });

  const response = result.response;
  return response.text();
}
