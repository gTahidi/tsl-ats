import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getJobs() {
  const jobs = await prisma.jobPosting.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return jobs;
}

export default async function HomePage() {
  const jobs = await getJobs();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Job Postings</h1>
          <Link
            href="/jobs/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create Job Posting
          </Link>
        </div>
        <div className="mt-8 space-y-4">
          {jobs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No job postings yet.</p>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      <Link href={`/jobs/${job.id}`} className="hover:text-indigo-600">
                        {job.title}
                      </Link>
                    </h2>
                    <p className="mt-1 text-gray-600">{job.company}</p>
                    {job.location && (
                      <p className="mt-1 text-gray-500 text-sm">{job.location}</p>
                    )}
                  </div>
                  {job.linkedinUrl && (
                    <a
                      href={job.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
                {job.description && (
                  <p className="mt-4 text-gray-600 text-sm line-clamp-2">
                    {job.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
