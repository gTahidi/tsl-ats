import { db } from '@/db';
import { cvChunks } from '@/db/schema';
import { generateBatchEmbeddings } from '@/lib/gemini/generate-embeddings';
import { ParsedCv } from '@/lib/gemini/schema';

/**
 * Creates text chunks from parsed CV data to be used for embeddings.
 * @param parsedCv The parsed CV data.
 * @returns An array of strings, where each string is a meaningful chunk of CV content.
 */
function createChunksFromCv(parsedCv: ParsedCv): string[] {
    const chunks: string[] = [];

    // Chunk 1: AI-generated summary and skills
    const skillsSummary = [
        `Candidate Summary: ${parsedCv.ranking.summary}`,
        `Skills: ${[...parsedCv.skills.languages, ...parsedCv.skills.frameworks, ...parsedCv.skills.tools, ...parsedCv.skills.methodologies].join(', ')}`
    ].join('\n');
    chunks.push(skillsSummary);

    // Chunk for each work experience entry
    parsedCv.workExperience.forEach(exp => {
        const workChunk = [
            `Job Title: ${exp.jobTitle} at ${exp.company}`,
            `Description: ${exp.description}`,
            exp.achievements ? `Achievements: ${exp.achievements.join(', ')}` : ''
        ].filter(Boolean).join('\n');
        chunks.push(workChunk);
    });

    return chunks;
}

/**
 * Processes a parsed CV to create, generate, and store text chunks and their embeddings.
 * @param cvId The ID of the CV to associate the chunks with.
 * @param parsedCv The parsed CV data from Gemini.
 */
export async function createAndStoreCvEmbeddings(cvId: string, parsedCv: ParsedCv) {
    const chunks = createChunksFromCv(parsedCv);
    if (chunks.length === 0) {
        console.log(`No content to chunk for CV ID: ${cvId}`);
        return;
    }

    try {
        const embeddings = await generateBatchEmbeddings(chunks);

        const chunkData = chunks.map((chunk, index) => ({
            cvId: cvId,
            chunkText: chunk,
            embedding: embeddings[index],
        }));

        await db.insert(cvChunks).values(chunkData);
        console.log(`Successfully stored ${chunkData.length} chunks for CV ID: ${cvId}`);

    } catch (error) {
        console.error(`Failed to create and store embeddings for CV ID: ${cvId}`, error);
        // In a real application, you might want to add this to a retry queue.
    }
}
