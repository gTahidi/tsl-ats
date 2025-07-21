'use client';

import React, { useState } from 'react';
import { Modal, Typography, Descriptions, Card, Divider, List } from 'antd';
import RatingTag from './RatingTag';

const { Title, Paragraph, Text } = Typography;

// Component to parse and display AI-generated summary
const SummaryDisplay: React.FC<{ summary: string }> = ({ summary }) => {
  const parseSection = (text: string, sectionName: string) => {
    // Simple approach: split by ** and find the section
    const sections = text.split('**');
    for (let i = 0; i < sections.length - 1; i++) {
      if (sections[i].toLowerCase().includes(sectionName.toLowerCase() + ':')) {
        return sections[i + 1]?.trim() || null;
      }
    }
    return null;
  };

  const assessment = parseSection(summary, 'Assessment');
  const strengths = parseSection(summary, 'Strengths');
  const concerns = parseSection(summary, 'Concerns');
  const score = parseSection(summary, 'Score');
  const recommendation = parseSection(summary, 'Recommendation');

  return (
    <div style={{ 
      backgroundColor: '#f9f9f9', 
      padding: '20px', 
      borderRadius: '8px', 
      border: '1px solid #e8e8e8' 
    }}>
      {assessment && (
        <div style={{ marginBottom: '16px' }}>
          <Text strong style={{ color: '#1890ff' }}>Assessment:</Text>
          <Paragraph style={{ marginTop: '4px', marginBottom: '0' }}>{assessment}</Paragraph>
        </div>
      )}
      
      {strengths && (
        <div style={{ marginBottom: '16px' }}>
          <Text strong style={{ color: '#52c41a' }}>Strengths:</Text>
          <Paragraph style={{ marginTop: '4px', marginBottom: '0' }}>{strengths}</Paragraph>
        </div>
      )}
      
      {concerns && (
        <div style={{ marginBottom: '16px' }}>
          <Text strong style={{ color: '#ff7875' }}>Concerns:</Text>
          <Paragraph style={{ marginTop: '4px', marginBottom: '0' }}>{concerns}</Paragraph>
        </div>
      )}
      
      {score && (
        <div style={{ marginBottom: '16px' }}>
          <Text strong style={{ color: '#722ed1' }}>Score Justification:</Text>
          <Paragraph style={{ marginTop: '4px', marginBottom: '0' }}>{score}</Paragraph>
        </div>
      )}
      
      {recommendation && (
        <div>
          <Text strong style={{ color: '#fa8c16' }}>Recommendation:</Text>
          <Paragraph style={{ marginTop: '4px', marginBottom: '0' }}>
            <Text strong style={{ 
              color: recommendation.toLowerCase().includes("don't") || recommendation.toLowerCase().includes('not') ? '#ff4d4f' : '#52c41a'
            }}>
              {recommendation}
            </Text>
          </Paragraph>
        </div>
      )}
      
      {/* Fallback if parsing fails */}
      {!assessment && !strengths && !concerns && !score && !recommendation && (
        <Paragraph>{summary}</Paragraph>
      )}
    </div>
  );
};

interface Question {
  question: string;
  answer: string;
}

interface RatingData {
  matchScore: number;
  summary: string;
  questions?: Question[];
  pros?: string[];
  cons?: string[];
}

interface RatingModalProps {
  candidateId: string;
  initialRating?: number | null;
  // Full rating data object (if already available)
  ratingObject?: {
    matchScore: number;
    summary: string;
    questions?: Question[];
    pros?: string[];
    cons?: string[];
  } | null;
}

const RatingModal: React.FC<RatingModalProps> = ({ candidateId, initialRating, ratingObject }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ratingData, setRatingData] = useState<RatingData | null>(ratingObject || null);
  
  const handleViewRating = async () => {
    if (initialRating === null || initialRating === undefined) {
      return; // Don't open modal if not rated
    }
    
    setModalVisible(true);
    
    // If we already have the rating data (either from props or previous load), no need to fetch
    if (ratingData) {
      return; 
    }
    
    // Only fetch if we don't already have the data
    setLoading(true);
    try {
      const response = await fetch(`/api/candidates/${candidateId}/rating`);
      if (!response.ok) {
        throw new Error('Failed to fetch rating data');
      }
      
      const data = await response.json();
      setRatingData(data);
    } catch (error) {
      console.error('Error fetching rating data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <div onClick={handleViewRating} style={{ cursor: initialRating ? 'pointer' : 'default' }}>
        <RatingTag rating={initialRating} />
      </div>
      
      <Modal
        title={<Title level={4}>Candidate Rating Details</Title>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading rating details...</div>
        ) : ratingData ? (
          <div>
            <Descriptions bordered>
              <Descriptions.Item label="Match Score" span={3}>
                <RatingTag rating={ratingData.matchScore} /> 
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  ({ratingData.matchScore}/100)
                </Text>
              </Descriptions.Item>
            </Descriptions>
            
            <Divider orientation="left">Summary</Divider>
            <SummaryDisplay summary={ratingData.summary} />
            
            {ratingData.questions && ratingData.questions.length > 0 && (
              <>
                <Divider orientation="left">Interview Questions & Answers</Divider>
                <List
                  itemLayout="vertical"
                  dataSource={ratingData.questions}
                  renderItem={(item, index) => (
                    <Card 
                      style={{ marginBottom: 16 }} 
                      title={`Question ${index + 1}`}
                    >
                      <Paragraph strong>{item.question}</Paragraph>
                      <Paragraph>{item.answer}</Paragraph>
                    </Card>
                  )}
                />
              </>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            No rating data available for this candidate.
          </div>
        )}
      </Modal>
    </>
  );
};

export default RatingModal;
