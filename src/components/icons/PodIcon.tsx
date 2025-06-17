import React from 'react';

interface PodIconProps {
  width?: string;
  height?: string;
  fill?: string;
}

const PodIcon: React.FC<PodIconProps> = ({
  width = '24',
  height = '24',
  fill = '#014D3C',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C7.589 2 4 5.589 4 10c0 4.688 6.156 10.601 7.394 11.71a1 1 0 0 0 1.212 0C13.844 20.601 20 14.688 20 10c0-4.411-3.589-8-8-8zm0 10.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
      fill={fill}
    />
  </svg>
);

export default PodIcon;
