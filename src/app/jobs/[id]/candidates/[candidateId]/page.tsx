import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProcessSteps from '@/app/components/ProcessSteps';
import CVUpload from '@/app/components/CVUpload';
import { getDownloadUrl } from '@/lib/s3';

async function getCandidate(jobId: string, candidateId: string) {
  return prisma.candidate.findFirst({
    where: {
      id: candidateId,
      jobId,
    },
    include: {
      job: true,
      steps: {
        orderBy: {
          date: 'desc',
        },
      },
    },
  });
}

export default async function CandidateDetailPage({
  params,
}: {
  params: { id: string; candidateId: string };
}) {
  const candidate = await getCandidate(params.id, params.candidateId);
  if (!candidate) notFound();

  const cvUrl = candidate.cvUrl ? await getDownloadUrl(candidate.cvUrl) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/jobs/${params.id}`} className="text-indigo-600 hover:text-indigo-500">
            ← Back to Job
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{candidate.name}</h1>
          <p className="text-xl text-gray-600">{candidate.job.title}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Candidate Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Candidate Information</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1">{candidate.email}</dd>
              </div>
              {candidate.linkedinUrl && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">LinkedIn</dt>
                  <dd className="mt-1">
                    <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500">
                      View Profile
                    </a>
                  </dd>
                </div>
              )}
              {candidate.notes && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 whitespace-pre-wrap">{candidate.notes}</dd>
                </div>
              )}

              {/* CV Section */}
              <div>
                <dt className="text-sm font-medium text-gray-500">CV</dt>
                <dd className="mt-1">
                  {cvUrl ? (
                    <a
                      href={cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      View CV
                    </a>
                  ) : (
                    <CVUpload
                      candidateId={candidate.id}
                    />
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Process Steps */}
          <div className="bg-white shadow rounded-lg p-6">
            <ProcessSteps
              candidateId={candidate.id}
              jobId={params.id}
              steps={candidate?.steps || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
