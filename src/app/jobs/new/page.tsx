'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateJobPage() {
  // Keep existing state and handlers
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    linkedinUrl: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create job posting');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Job Posting</h1>
          <Link href="/" className="text-indigo-600 hover:text-indigo-500">Back to Jobs</Link>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          
          <div className="space-y-6">
            <FormField label="Job Title" name="title" value={formData.title} onChange={handleChange} required />
            <FormField label="Company" name="company" value={formData.company} onChange={handleChange} required />
            <FormField label="Location" name="location" value={formData.location} onChange={handleChange} />
            <FormField label="Description" name="description" value={formData.description} onChange={handleChange} type="textarea" />
            <FormField label="LinkedIn URL" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} type="url" />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Job Posting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ 
  label, 
  name, 
  value, 
  onChange, 
  required = false, 
  type = 'text' 
}: { 
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  type?: 'text' | 'url' | 'textarea';
}) {
  const inputProps = {
    id: name,
    name,
    value,
    onChange,
    required,
    className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
  };

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label} {required && '*'}
      </label>
      {type === 'textarea' ? (
        <textarea {...inputProps} rows={4} />
      ) : (
        <input type={type} {...inputProps} />
      )}
    </div>
  );
}
