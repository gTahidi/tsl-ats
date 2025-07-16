import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });

/**
 * Generates an embedding for a given text using the Google Gemini API.
 * @param text The text to generate an embedding for.
 * @returns A promise that resolves to an array of numbers representing the embedding.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate embedding from Gemini API.');
    }
}

/**
 * Generates embeddings for multiple texts in a batch.
 * @param texts An array of strings to generate embeddings for.
 * @returns A promise that resolves to an array of number arrays (embeddings).
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
        const requests = texts.map(text => ({ content: { role: 'user', parts: [{ text }] } }));
        const result = await embeddingModel.batchEmbedContents({ requests });
        return result.embeddings.map(e => e.values);
    } catch (error) {
        console.error('Error generating batch embeddings:', error);
        throw new Error('Failed to generate batch embeddings from Gemini API.');
    }
}
