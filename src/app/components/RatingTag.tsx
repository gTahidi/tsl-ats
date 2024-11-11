import { Rating } from '@/types';
import { Tag } from 'antd';
import React from 'react';

type Props = {
  rating?: Rating;
};

const RatingTag = ({ rating }: Props) => {
  let ratingColor = "default";

  if (!rating) {
    return (
      <Tag color="default">
        Not rated
      </Tag>
    )
  }

  if (rating === "Strong no hire") {
    ratingColor = "red";
  } else if (rating === "No hire") {
    ratingColor = "orange";
  } else if (rating === "Strong hire") {
    ratingColor = "green";
  } else if (rating === "Hire") {
    ratingColor = "blue";
  }

  return (
    <Tag color={ratingColor}>
      {rating}
    </Tag>
  )
}

export default RatingTag;
