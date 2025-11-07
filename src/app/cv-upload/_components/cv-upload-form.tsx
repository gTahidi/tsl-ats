'use client';

import { useState } from 'react';
import { Select, Upload, Button, Progress, notification, Input, Form, Row, Col } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

const { Dragger } = Upload;

interface Job {
    id: string;
    title: string;
}

interface CvUploadFormProps {
    jobs: Job[];
}

const createEmptyCandidateInfo = () => ({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
});

export default function CvUploadForm({ jobs }: CvUploadFormProps) {
    const [selectedJobId, setSelectedJobId] = useState<string | undefined>(jobs[0]?.id);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [candidateInfo, setCandidateInfo] = useState(createEmptyCandidateInfo);

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
            // AntD UploadFile wraps the real File/Blob in `originFileObj`.
            // We must send the actual Blob so the server receives a proper File.
            const realFile = (file as UploadFile).originFileObj as File | undefined;
            if (realFile) {
                formData.append('file', realFile, file.name);
            } else {
                // Fallback: in unusual cases where originFileObj is missing, attempt best-effort append
                formData.append('file', file as any);
            }
            formData.append('jobId', selectedJobId);
            const emailHint = candidateInfo.email.trim();
            if (emailHint.length > 0) {
                formData.append('emailHint', emailHint);
            }
            const firstName = candidateInfo.firstName.trim();
            if (firstName.length > 0) {
                formData.append('firstName', firstName);
            }
            const lastName = candidateInfo.lastName.trim();
            if (lastName.length > 0) {
                formData.append('lastName', lastName);
            }
            const phone = candidateInfo.phone.trim();
            if (phone.length > 0) {
                formData.append('phone', phone);
            }
            const location = candidateInfo.location.trim();
            if (location.length > 0) {
                formData.append('location', location);
            }
            const linkedinUrl = candidateInfo.linkedinUrl.trim();
            if (linkedinUrl.length > 0) {
                formData.append('linkedinUrl', linkedinUrl);
            }

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
                // API returns the candidate object directly (not wrapped in { candidate: ... })
                const candidateName = `${result?.persona?.name ?? ''} ${result?.persona?.surname ?? ''}`.trim() || 'Unknown';
                successDetails.push(`${file.name} processed for candidate: ${candidateName}`);
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
        setCandidateInfo(createEmptyCandidateInfo());

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

    const hasCandidateInfo = Object.values(candidateInfo).some((value) => value.trim().length > 0);

    return (
        <div className="bg-white p-6 md:p-10 border rounded-lg shadow-sm max-w-5xl mx-auto w-full">
            <Form layout="vertical" className="space-y-6">
                <Row gutter={[32, 24]}>
                    <Col xs={24} md={12}>
                        <Form.Item label="Select Job Posting" required>
                            <Select
                                style={{ width: '100%' }}
                                placeholder="Select a job"
                                value={selectedJobId}
                                onChange={(value) => setSelectedJobId(value)}
                                disabled={isUploading || jobs.length === 0}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                options={jobs.map((job) => ({ label: job.title, value: job.id }))}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Candidate First Name (optional)"
                        >
                            <Input
                                placeholder="Enter first name"
                                value={candidateInfo.firstName}
                                onChange={(e) => setCandidateInfo((prev) => ({ ...prev, firstName: e.target.value }))}
                                disabled={isUploading}
                                allowClear
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={[32, 24]}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Candidate Last Name (optional)"
                        >
                            <Input
                                placeholder="Enter last name"
                                value={candidateInfo.lastName}
                                onChange={(e) => setCandidateInfo((prev) => ({ ...prev, lastName: e.target.value }))}
                                disabled={isUploading}
                                allowClear
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Candidate Email (optional)"
                        >
                            <Input
                                id="emailHint"
                                type="email"
                                placeholder="Enter candidate email"
                                value={candidateInfo.email}
                                onChange={(e) => setCandidateInfo((prev) => ({ ...prev, email: e.target.value }))}
                                disabled={isUploading}
                                allowClear
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={[32, 24]}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Candidate Phone (optional)"
                        >
                            <Input
                                placeholder="Enter phone number"
                                value={candidateInfo.phone}
                                onChange={(e) => setCandidateInfo((prev) => ({ ...prev, phone: e.target.value }))}
                                disabled={isUploading}
                                allowClear
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Candidate Location (optional)"
                        >
                            <Input
                                placeholder="Enter city / country"
                                value={candidateInfo.location}
                                onChange={(e) => setCandidateInfo((prev) => ({ ...prev, location: e.target.value }))}
                                disabled={isUploading}
                                allowClear
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={[32, 24]}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Candidate LinkedIn URL (optional)"
                        >
                            <Input
                                placeholder="https://www.linkedin.com/in/username"
                                value={candidateInfo.linkedinUrl}
                                onChange={(e) => setCandidateInfo((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
                                disabled={isUploading}
                                allowClear
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item label="Upload CV file(s)" style={{ marginBottom: 32 }}>
                    <Dragger {...props} disabled={isUploading} style={{ padding: '24px 0', borderRadius: 8, width: '100%' }}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Click or drag files here</p>
                        <p className="ant-upload-hint">
                            You can upload one or multiple files. Accepted: .pdf, .doc, .docx
                        </p>
                    </Dragger>
                </Form.Item>

                {isUploading && (
                    <>
                        <Form.Item>
                            <Progress percent={progress} status={progress === 100 ? 'success' : 'active'} />
                        </Form.Item>
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-700">Processing Files:</h4>
                            {fileList.map((file, index) => {
                                const fileProgress =
                                    index < Math.floor((progress / 100) * fileList.length)
                                        ? 100
                                        : index === Math.floor((progress / 100) * fileList.length)
                                        ? (progress % (100 / fileList.length)) * fileList.length
                                        : 0;
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
                    </>
                )}

                <Row gutter={[32, 24]} className="mt-12">
                    <Col xs={24} md={12}>
                        <Button
                            onClick={() => {
                                setFileList([]);
                                setCandidateInfo(createEmptyCandidateInfo());
                            }}
                            disabled={isUploading || (fileList.length === 0 && !hasCandidateInfo)}
                            size="large"
                            block
                        >
                            Clear
                        </Button>
                    </Col>
                    <Col xs={24} md={12}>
                        <Button
                            type="primary"
                            onClick={handleUpload}
                            disabled={fileList.length === 0 || isUploading || !selectedJobId}
                            loading={isUploading}
                            size="large"
                            block
                        >
                            {isUploading ? 'Processing...' : `Upload and Process ${fileList.length} File(s)`}
                        </Button>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
