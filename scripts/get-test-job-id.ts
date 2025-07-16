import { db } from '../src/db';
import { jobPostings } from '../src/db/schema';

async function getFirstJobId() {
  try {
    console.log('Querying for a job posting...');
    const result = await db.select({ id: jobPostings.id }).from(jobPostings).limit(1);
    if (result.length === 0) {
      console.error('Error: No job postings found in the database. Please create one to run the test.');
      process.exit(1);
    }
    const jobId = result[0].id;
    console.log(`Found Job ID: ${jobId}`);
    return jobId;
  } catch (error) {
    console.error('Failed to fetch job ID:', error);
    process.exit(1);
  }
}

getFirstJobId();
