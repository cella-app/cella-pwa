import React, { useState, useEffect } from 'react';

interface CloudShapeProps {
	size: number;
	opacity: number;
}

const FloatingClouds = () => {
	const [clouds, setClouds] = useState([
		{ id: 1, x: window.innerWidth + 100, y: 150, speed: 1.2, size: 2 },
		{ id: 2, x: -300, y: 200, speed: 0.8, size: 1.8, direction: 'right' },
		{ id: 3, x: window.innerWidth + 200, y: 250, speed: 1.5, size: 2.2 },
		{ id: 4, x: -250, y: 300, speed: 1.1, size: 1.9, direction: 'right' },
		{ id: 5, x: window.innerWidth + 150, y: 350, speed: 0.9, size: 2.1 },
		{ id: 6, x: -200, y: 180, speed: 1.3, size: 1.7, direction: 'right' }
	]);

	useEffect(() => {
		const interval = setInterval(() => {
			setClouds(prevClouds =>
				prevClouds.map(cloud => {
					let newX = cloud.x;

					if (cloud.direction === 'right') {
						newX += cloud.speed;
						if (newX > window.innerWidth + 300) {
							newX = -300;
						}
					} else {
						newX -= cloud.speed;
						if (newX < -300) {
							newX = window.innerWidth + 300;
						}
					}

					return { ...cloud, x: newX };
				})
			);
		}, 16); // ~60fps

		return () => clearInterval(interval);
	}, []);

	const CloudShape = ({ size, opacity }: CloudShapeProps) => (
		<div style={{ position: 'relative', transform: `scale(${size})` }}>
			{/* Đám mây chính - tròn lớn */}
			<div style={{
				width: '120px',
				height: '80px',
				backgroundColor: 'white',
				borderRadius: '60px',
				opacity: opacity,
				boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
			}}></div>

			{/* Phần trên trái */}
			<div style={{
				position: 'absolute',
				top: '-25px',
				left: '25px',
				width: '70px',
				height: '50px',
				backgroundColor: 'white',
				borderRadius: '35px',
				opacity: opacity
			}}></div>

			{/* Phần trên phải */}
			<div style={{
				position: 'absolute',
				top: '-20px',
				right: '15px',
				width: '60px',
				height: '45px',
				backgroundColor: 'white',
				borderRadius: '30px',
				opacity: opacity
			}}></div>

			{/* Phần trái */}
			<div style={{
				position: 'absolute',
				top: '-10px',
				left: '-10px',
				width: '50px',
				height: '40px',
				backgroundColor: 'white',
				borderRadius: '25px',
				opacity: opacity
			}}></div>

			{/* Phần phải */}
			<div style={{
				position: 'absolute',
				top: '5px',
				right: '-15px',
				width: '55px',
				height: '42px',
				backgroundColor: 'white',
				borderRadius: '28px',
				opacity: opacity
			}}></div>
		</div>
	);

	return (
		<div style={{
			position: 'relative',
			width: '100%',
			height: '100vh',
			background: 'linear-gradient(to bottom, #60a5fa, #93c5fd, #bfdbfe)',
			overflow: 'hidden'
		}}>
			{/* Nền trời */}
			<div style={{
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				background: 'linear-gradient(to bottom, #0ea5e9, #38bdf8)'
			}}></div>


			{/* Render các đám mây */}
			{clouds.map(cloud => (
				<div
					key={cloud.id}
					style={{
						position: 'absolute',
						left: `${cloud.x}px`,
						top: `${cloud.y}px`,
						transition: 'none'
					}}
				>
					<CloudShape size={cloud.size} opacity={1} />
				</div>
			))}
		</div>
	);
};

export default FloatingClouds;