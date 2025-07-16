import CvUploadForm from './_components/cv-upload-form';

// This function can be expanded to fetch jobs from your database
async function getJobs() {
  // For now, we'll use a placeholder. We'll fetch real jobs next.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${appUrl}/api/jobs`, { cache: 'no-store' });
  if (!response.ok) {
    console.error('Failed to fetch jobs');
    return [];
  }
  return response.json();
}

export default async function CvUploadPage() {
  const jobs = await getJobs();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Upload and Process CV</h1>
        <p className="text-gray-600 mb-8 text-center">
          Select a job posting, choose a CV file, and we&apos;ll use Gemini AI to parse it and create a new candidate profile.
        </p>
        <CvUploadForm jobs={jobs} />
      </div>
    </main>
  );
}
