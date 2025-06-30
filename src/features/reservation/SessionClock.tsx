"use client";

import React, { useState, useEffect, useRef } from "react";
import {
	Box,
	Card,
	Typography,
	Button,
	SvgIcon,
	Divider,
} from "@mui/material";
import { Pause, Play, Lock, LockOpen } from "lucide-react";
import { rootStyle } from "@/theme";
import { Session, SessionStatusEnum } from "@/shared/data/models/Session";
import { tracking, pause, resume, end } from '@/features/reservation/session.action';
import { useRouter } from 'next/navigation';

interface SessionClockProps {
	session: Session;
}

const TRACKING_TIME = 15 * 1000; 

const SessionClock: React.FC<SessionClockProps> = ({ session }) => {
	const router = useRouter();

	const [focusTime, setFocusTime] = useState(0);
	const [pauseTime, setPauseTime] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const [pauseLogs, setPauseLogs] = useState<number[]>([]);
	const [hasRenderedOnce, setHasRenderedOnce] = useState(false);

	const focusInterval = useRef<NodeJS.Timeout | null>(null);
	const pauseInterval = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (session?.start_time && session?.latest_tracking) {
			const start = new Date(session.start_time).getTime();
			const latest = new Date(session.latest_tracking).getTime();
			const secondsPassed = Math.floor((latest - start) / 1000);
			setFocusTime(secondsPassed);
		}
	}, [session?.start_time, session?.latest_tracking]);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setHasRenderedOnce(true);
		}, 100); // Tăng từ 50ms lên 100ms để đảm bảo render xong
		return () => {
			clearTimeout(timeout);
			if (focusInterval.current) {
				clearInterval(focusInterval.current);
			}
			if (pauseInterval.current) {
				clearInterval(pauseInterval.current);
			}
		};
	}, []);


	useEffect(() => {
		if (!session?.id || isPaused) return;

		const interval = setInterval(() => {
			tracking(session.id).catch(console.error);
		}, TRACKING_TIME);

		return () => clearInterval(interval);
	}, [session?.id, isPaused]);


	useEffect(() => {
		if (!isPaused) {
			focusInterval.current = setInterval(() => {
				setFocusTime((prev) => prev + 1);
			}, 1000);
		} else {
			clearInterval(focusInterval.current!);
		}
		return () => clearInterval(focusInterval.current!);
	}, [isPaused]);

	useEffect(() => {
		if (isPaused) {
			pauseInterval.current = setInterval(() => {
				setPauseTime((prev) => prev + 1);
			}, 1000);
		} else {
			clearInterval(pauseInterval.current!);
		}
		return () => clearInterval(pauseInterval.current!);
	}, [isPaused]);

	useState(() => {
		if (session.status === SessionStatusEnum.PAUSING) {
			setIsPaused(true)
		}
	})

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const handleToggle = async () => {
		if (!session?.id) return;

		if (isPaused) {
			if (pauseTime > 0) {
				setPauseLogs((prev) => [...prev, pauseTime]);
				setPauseTime(0);
			}
			await resume(session.id);
			setIsPaused(false);
		} else {
			await pause(session.id);
			setIsPaused(true);
			setPauseTime(0);
		}
	};

	const handleEndSession = async () => {
		if (!session?.id) return;
		await end(session.id);
		router.push(`/session/${session.id}/checkout`)
		// window.location.href = `/session/${session.id}/checkout`;
	};

	const strokeWidth = 12;
	const radius = 130 - strokeWidth / 2;
	const circumference = 2 * Math.PI * radius;

	const arcLength = circumference * 0.15;
	const dashArray = `${arcLength} ${circumference}`;

	const fakeMaxTime = 60;

	const progress = (focusTime % fakeMaxTime) / fakeMaxTime;
	const rotation = progress * 360;

	return (
		<Card
			sx={{
				height: "100vh",
				p: 4,
				background: "transparent",
				width: "100%",
				maxWidth: 400,
				textAlign: "center",
				border: "none !important",
				boxShadow: "none !important",
				fontFamily: rootStyle.mainFontFamily,
				display: "flex",
				flexDirection: "column",
				justifyContent: "flex-start",
				alignItems: "center",
			}}
		>
			{/* Toggle */}
			<Box
				onClick={handleToggle}
				sx={{
					width: 44,
					height: 24,
					borderRadius: 12,
					backgroundColor: !isPaused ? rootStyle.elementColor : "#e0e0e0",
					position: "relative",
					cursor: "pointer",
					alignSelf: "flex-end",
					mb: 2,
				}}
			>
				<Box
					sx={{
						position: "absolute",
						top: "2px",
						left: !isPaused ? "22px" : "2px",
						width: 20,
						height: 20,
						bgcolor: "white",
						borderRadius: "50%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						transition: "all 0.3s ease",
						boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
					}}
				>
					<SvgIcon fontSize="inherit" >
						{!isPaused ? <LockOpen fontSize="small" /> : <Lock fontSize="small" />}
					</SvgIcon>
				</Box>
			</Box>

			{/* Trạng thái */}
			<Typography variant="h4" fontWeight={700} mb={2} sx={{
				fontSize: "36px",
				fontFamily: rootStyle.titleFontFamily
			}}>
				{isPaused ? "Session Paused" : "In Session"}
			</Typography>

			{/* Vòng đồng hồ */}
			<Box sx={{ position: "relative", width: 260, height: 260, mx: "auto", mb: 3 }}>
				<svg width="260" height="260" style={{ transform: "rotate(-90deg)" }}>
					{/* Định nghĩa gradient */}
					<defs>
						<linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="objectBoundingBox">
							<stop offset="10%" stopColor="#20A48C" stopOpacity="1" />
							<stop offset="75%" stopColor="#0C3E35" stopOpacity="1" />
							<stop offset="100%" stopColor="#20A48C" stopOpacity="1" />
						</linearGradient>
					</defs>

					{/* Nền đầy đủ màu 20A48C */}
					<circle
						cx="130"
						cy="130"
						r={radius}
						stroke="#20A48C"
						strokeWidth={strokeWidth}
						fill="transparent"
					/>

					{/* Đoạn đậm chạy quanh với gradient hòa trộn */}
					<circle
						cx="130"
						cy="130"
						r={radius}
						stroke="url(#progressGradient)"
						strokeWidth={strokeWidth}
						fill="transparent"
						strokeDasharray={dashArray}
						strokeDashoffset="0"
						strokeLinecap="round"
						style={{
							// Chỉ áp dụng transition khi đã render lần đầu
							transition: hasRenderedOnce ? "transform 0.5s ease-out" : "none",
							transform: `rotate(${rotation}deg)`,
							transformOrigin: "center"
						}}
					/>
				</svg>

				<Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
					<Typography variant="h4" fontWeight={700} sx={{
						fontSize: "60px"
					}}>
						{isPaused ? formatTime(pauseTime) : formatTime(focusTime)}
					</Typography>
					<Typography color="text.secondary" sx={{
						fontSize: "24px",
						fontWeight: 700,
						fontFamily: rootStyle.mainFontFamily,
						mb: 2,
						display: isPaused ? "none" : "block",
						color: "black"
					}}>
						{"Stay focused"}
					</Typography>
					<Typography color="text.secondary" sx={{
						fontSize: "16px",
						fontWeight: 200,
						fontFamily: rootStyle.mainFontFamily,
						display: isPaused ? "block" : "none",
						textAlign: "center",
						color: "black",
					}}>
							{"5:00 of this break is free"}
					</Typography>
					<Typography color="text.secondary" sx={{
						fontSize: "16px",
						fontWeight: 200,
						fontFamily: rootStyle.mainFontFamily,
						display: isPaused ? "block" : "none",
						textAlign: "center",
						color: "black"

					}}>
						{"• no charge yet"}
					</Typography>
				</Box>
			</Box>
			<Typography sx={{ fontSize: "24px", fontWeight: 700, fontFamily: rootStyle.mainFontFamily, mb: 2 }}>
				{isPaused ? "Pop Locked" : "Pop Unlocked"}
			</Typography>


			<Button
				variant="contained"
				fullWidth
				onClick={handleToggle}
				sx={{ mb: 4, fontWeight: 600, fontSize: 16 }}
				startIcon={!isPaused ? <Pause /> : <Play />}
			>
				{!isPaused ? "Pause Session" : "Resume Session"}
			</Button>

			<Button
				variant="outlined"
				fullWidth
				color="error"
				onClick={handleEndSession}
			>
				End Session
			</Button>

			{pauseLogs.length > 0 && (
				<>
					<Divider sx={{ my: 3 }} />
					<Typography variant="subtitle2" gutterBottom>
						Pause Logs
					</Typography>
					<Box textAlign="left" width="100%">
						{pauseLogs.map((p, idx) => (
							<Typography variant="body2" color="text.secondary" key={idx}>
								{`#${idx + 1} — Paused ${formatTime(p)}`}
							</Typography>
						))}
					</Box>
				</>
			)}
		</Card>
	);
};

export default SessionClock;