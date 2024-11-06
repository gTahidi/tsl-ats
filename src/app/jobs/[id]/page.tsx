import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getJob(id: string) {
  return prisma.jobPosting.findUnique({
    where: { id },
    include: {
      candidates: {
        include: {
          persona: true,
          process: { include: { steps: true } }
        },
      },
    },
  });
}

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const job = await getJob(params.id);
  if (!job) notFound();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Job Header */}
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-500">
            ← Back to Jobs
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{job.title}</h1>
          <p className="text-xl text-gray-600">{job.company}</p>
        </div>

        {/* Job Description */}
        {job.description && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="whitespace-pre-wrap">{job.description}</p>
          </div>
        )}

        {/* Candidates Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Candidates ({job.candidates.length})
            </h2>
            <Link
              href={`/jobs/${job.id}/candidates/new`}
              className="btn-primary"
            >
              Add Candidate
            </Link>
          </div>
          
          {/* Candidate List */}
          {job.candidates.length === 0 ? (
            <p className="text-center py-4">No candidates yet.</p>
          ) : (
            <div className="space-y-4">
              {job.candidates.map((candidate) => (
                <div key={candidate.id} className="border rounded-lg p-4">
                  <Link href={`/jobs/${job.id}/candidates/${candidate.id}`}>
                    <h3>{candidate.persona.name}</h3>
                    <p>Status: {candidate.status}</p>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
