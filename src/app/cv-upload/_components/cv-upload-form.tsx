'use client';

import { useState } from 'react';
import { Select, Upload, Button, Progress, notification, message as antdMessage } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

const { Dragger } = Upload;
const { Option } = Select;

interface Job {
    id: string;
    title: string;
}

interface CvUploadFormProps {
    jobs: Job[];
}

export default function CvUploadForm({ jobs }: CvUploadFormProps) {
    const [selectedJobId, setSelectedJobId] = useState<string | undefined>(jobs[0]?.id);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleUpload = async () => {
        if (!selectedJobId) {
            notification.error({ message: 'No Job Selected', description: 'Please select a job to associate the CVs with.' });
            return;
        }

        setIsUploading(true);
        setProgress(0);

        const totalFiles = fileList.length;
        let processedFiles = 0;
        const successDetails: string[] = [];
        const errorDetails: string[] = [];

        for (const file of fileList) {
            const formData = new FormData();
            formData.append('file', file as any);
            formData.append('jobId', selectedJobId);

            try {
                const response = await fetch('/api/cv/upload-and-process', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorResult = await response.json();
                    throw new Error(errorResult.details || `Server responded with status ${response.status}`);
                }
                const result = await response.json();
                successDetails.push(`${file.name} processed for candidate: ${result.candidate.persona.name}`);
            } catch (error: any) {
                errorDetails.push(`${file.name}: ${error.message}`);
            }

            processedFiles++;
            setProgress(Math.round((processedFiles / totalFiles) * 100));

            // Add a short delay to avoid overwhelming the API
            if (processedFiles < totalFiles) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
            }
        }

        setIsUploading(false);
        setFileList([]); // Clear file list after processing

        if (errorDetails.length > 0) {
            notification.error({
                message: 'Upload Process Completed with Errors',
                description: (
                    <div>
                        <p>{`Successfully processed: ${successDetails.length}`}</p>
                        <p>{`Failed: ${errorDetails.length}`}</p>
                        <ul>
                            {errorDetails.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                    </div>
                ),
                duration: 0, // Keep open until user closes
            });
        } else {
            notification.success({
                message: 'All CVs Processed Successfully',
                description: `Successfully processed ${successDetails.length} CV(s).`,
            });
        }
    };

    const props: UploadProps = {
        onRemove: (file) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: (file) => {
            setFileList((prev) => [...prev, file]);
            return false; // Prevent antd from uploading automatically
        },
        fileList,
        multiple: true,
        accept: '.pdf,.doc,.docx',
    };

    return (
        <div className="bg-white p-8 border rounded-lg shadow-md space-y-8">
            <div>
                <label htmlFor="jobId" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Job Posting
                </label>
                <Select
                    style={{ width: '100%' }}
                    placeholder="Select a job"
                    value={selectedJobId}
                    onChange={(value) => setSelectedJobId(value)}
                    disabled={isUploading}
                >
                    {jobs.length === 0 ? (
                        <Option value="" disabled>No jobs found. Please create one first.</Option>
                    ) : (
                        jobs.map((job) => (
                            <Option key={job.id} value={job.id}>
                                {job.title}
                            </Option>
                        ))
                    )}
                </Select>
            </div>

            {/* Added more spacing with margin-top */}
            <div style={{ marginTop: '32px' }}>
                <Dragger {...props}>
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag files to this area to upload</p>
                    <p className="ant-upload-hint">
                        Support for a single or bulk upload. Strictly prohibit from uploading company data or other
                        band files. Accepted formats: .pdf, .doc, .docx
                    </p>
                </Dragger>
            </div>

            {/* Individual progress bars for each file */}
            {isUploading && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Processing Files:</h4>
                    {fileList.map((file, index) => {
                        const fileProgress = index < Math.floor((progress / 100) * fileList.length) ? 100 : 
                                           index === Math.floor((progress / 100) * fileList.length) ? 
                                           (progress % (100 / fileList.length)) * fileList.length : 0;
                        return (
                            <div key={file.uid || index} className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>{file.name}</span>
                                    <span>{Math.round(fileProgress)}%</span>
                                </div>
                                <Progress 
                                    percent={fileProgress} 
                                    size="small" 
                                    status={fileProgress === 100 ? 'success' : 'active'}
                                    showInfo={false}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            <Button
                type="primary"
                onClick={handleUpload}
                disabled={fileList.length === 0 || isUploading || !selectedJobId}
                loading={isUploading}
                style={{ width: '100%' }}
                size="large"
            >
                {isUploading ? 'Processing...' : `Upload and Process ${fileList.length} File(s)`}
            </Button>
        </div>
    );
}