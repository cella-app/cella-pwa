'use client';

import React from 'react';

interface DefaultLeafletIconProps {
  width?: string;
  height?: string;
}

const DefaultLeafletIcon: React.FC<DefaultLeafletIconProps> = ({
  width = "48",
  height = "48",
}) => (
  <svg width={width} height={height} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
    <rect width="48" height="48" fill="url(#pattern0_17_284)"/>
    <defs>
      <pattern id="pattern0_17_284" patternContentUnits="objectBoundingBox" width="1" height="1">
        <use xlinkHref="#image0_17_284" transform="scale(0.0111111)"/>
      </pattern>
      <image id="image0_17_284" width="90" height="90" preserveAspectRatio="none" xlinkHref="data:image/png;base64,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"/>
    </defs>
  </svg>
);

export default DefaultLeafletIcon; 