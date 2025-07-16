'use client';

import { useState, FormEvent } from 'react';

interface Job {
  id: string;
  title: string;
}

interface CvUploadFormProps {
  jobs: Job[];
}

type UploadStatus = 'idle' | 'uploading' | 'parsing' | 'success' | 'error';

export default function CvUploadForm({ jobs }: CvUploadFormProps) {
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile || !selectedJobId) {
      setStatus('error');
      setMessage('Please select a job and a CV file.');
      return;
    }

    setStatus('uploading');
    setMessage('Uploading file and processing with AI... This may take a moment.');

    const formData = new FormData();
    formData.append('cv', selectedFile);
    formData.append('jobId', selectedJobId);

    try {
      const response = await fetch('/api/cv/upload-and-process', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'An unknown error occurred.');
      }
      
      setStatus('success');
      setMessage(`Successfully created candidate: ${result.persona.name} ${result.persona.surname}`);
      event.currentTarget.reset();
      setSelectedFile(null);

    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to process CV.');
      console.error('Upload error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 border rounded-lg shadow-md space-y-6">
      <div>
        <label htmlFor="jobId" className="block text-sm font-medium text-gray-700 mb-1">
          Job Posting
        </label>
        <select
          id="jobId"
          name="jobId"
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          disabled={status === 'uploading'}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {jobs.length === 0 ? (
            <option disabled>No jobs found. Please create a job first.</option>
          ) : (
            jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))
          )}
        </select>
      </div>

      <div>
        <label htmlFor="cv" className="block text-sm font-medium text-gray-700 mb-1">
          CV / Resume
        </label>
        <input
          id="cv"
          name="cv"
          type="file"
          onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
          disabled={status === 'uploading'}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          accept=".pdf,.doc,.docx,.txt"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'uploading' || !selectedFile || !selectedJobId}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {status === 'uploading' ? 'Processing...' : 'Upload and Process'}
      </button>

      {message && (
        <div
          className={`p-4 rounded-md text-sm ${status === 'error' ? 'bg-red-100 text-red-700' : ''} ${status === 'success' ? 'bg-green-100 text-green-700' : ''} ${status === 'uploading' ? 'bg-blue-100 text-blue-700' : ''}`}>
          <p>{message}</p>
        </div>
      )}
    </form>
  );
}
