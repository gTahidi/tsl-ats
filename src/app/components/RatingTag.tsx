import { Tag } from 'antd';
import React from 'react';

type Props = {
  rating?: number | null;
};

const RatingTag = ({ rating }: Props) => {
  if (rating === null || rating === undefined) {
    return <Tag color="default">Not Rated</Tag>;
  }

  let color = 'default';
  if (rating >= 90) {
    color = 'green';
  } else if (rating >= 75) {
    color = 'cyan';
  } else if (rating >= 60) {
    color = 'blue';
  } else if (rating >= 40) {
    color = 'orange';
  } else {
    color = 'red';
  }

  return (
    <Tag color={color}>
      {Math.round(rating)}/100
    </Tag>
  );
};

export default RatingTag;
