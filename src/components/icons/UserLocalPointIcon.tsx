import React from 'react';
import { Dot } from 'lucide-react';

interface UserLocalPointIconProps {
	width?: string;
	height?: string;
	fill?: string;
}

const UserLocalPointIcon: React.FC<UserLocalPointIconProps> = ({
	fill = '#4285F4',
}) => {
	return (
			<Dot size={'172'} strokeWidth={'3'} color={fill} />
	);
};

export default UserLocalPointIcon;
