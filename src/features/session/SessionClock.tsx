"use client";

import React, { useState, useEffect, useRef } from "react";
import {
	Box,
	Card,
	Typography,
	Button,
	SvgIcon,
} from "@mui/material";
import { Pause, Play, Lock, LockOpen } from "lucide-react";
import { rootStyle } from "@/theme";
import { Session, SessionStatusEnum } from "@/shared/data/models/Session";
import { tracking, pause, resume, end, getAmount } from '@/features/session/session.action';
import { useSessionStore } from '@/features/session/stores/session.store';
import { useRouter } from 'next/navigation';
import { MIN_AMOUNT } from '@/shared/config/payment';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface SessionClockProps {
	session: Session;
}

const TRACKING_TIME = 15 * 1000; 

const SessionClock: React.FC<SessionClockProps> = ({ session }) => {
	const router = useRouter();
	const { 
		currentPause, 
		pauseLogs, 
		loadCurrentPause,
		setCurrentPause,
		loadPauseLogs
	} = useSessionStore();

	const [focusTime, setFocusTime] = useState(0);
	const [pauseTime, setPauseTime] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const [hasRenderedOnce, setHasRenderedOnce] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [endSessionButtonText, setEndSessionButtonText] = useState("End Session");
	const [showMinAmountPopup, setShowMinAmountPopup] = useState(false);
	const [calculatedAmount, setCalculatedAmount] = useState(0);

	const focusInterval = useRef<NodeJS.Timeout | null>(null);
	const pauseInterval = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (session?.start_time) {
			const start = new Date(session.start_time).getTime();
			const now = Date.now();

			// Tổng thời gian đã pause (ms)
			let totalPauseMs = 0;
			if (pauseLogs && pauseLogs.length > 0) {
				for (const log of pauseLogs) {
					if (log.pause_at && log.resume_at) {
						const pauseStart = new Date(log.pause_at).getTime();
						const pauseEnd = new Date(log.resume_at).getTime();
						totalPauseMs += Math.max(0, pauseEnd - pauseStart);
					}
				}
			}
			// Nếu đang PAUSING, cộng thêm thời gian pause hiện tại
			if (isPaused && currentPause?.pause_at) {
				const pauseStart = new Date(currentPause.pause_at).getTime();
				totalPauseMs += Math.max(0, now - pauseStart);
			}

			const focusSeconds = Math.floor((now - start - totalPauseMs) / 1000);
			setFocusTime(focusSeconds > 0 ? focusSeconds : 0);
		}
	}, [session?.start_time, pauseLogs, isPaused, currentPause]);

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

	useEffect(() => {
		if (session?.status === SessionStatusEnum.PAUSING) {
			setIsPaused(true);
			if (session.id) {
				loadCurrentPause(session.id);
			}
		} else {
			setIsPaused(false);
			setCurrentPause(null);
		}
	}, [session?.status, session?.id, loadCurrentPause, setCurrentPause]);

	useEffect(() => {
		if (session?.id) {
			loadPauseLogs(session.id);
		}
	}, [session?.id, loadPauseLogs]);

	useEffect(() => {
		if (isPaused && currentPause?.pause_at) {
			const pauseStart = new Date(currentPause.pause_at).getTime();
			const now = Date.now();
			const pauseSeconds = Math.floor((now - pauseStart) / 1000);
			setPauseTime(pauseSeconds);
		} else {
			setPauseTime(0);
		}
	}, [isPaused, currentPause?.pause_at]);

	const formatTime = (seconds: number) => {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		if (hrs > 0) {
			return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
		}
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const handleToggle = async () => {
		if (!session?.id || isLoading) return;

		setIsLoading(true);
		console.log("handleToggle: Setting isLoading to true");
		try {
			if (isPaused) {
				await resume(session.id);
				setIsPaused(false);
				await loadPauseLogs(session.id);
			} else {
				// Pause session
				await pause(session.id);
				setIsPaused(true);
				await loadCurrentPause(session.id);
			}
		} catch (error) {
			console.error("Error toggling session:", error);
		} finally {
			setIsLoading(false);
			console.log("handleToggle: Setting isLoading to false");
		}
	};

	const handleEndSession = async () => {
		if (!session?.id || isLoading) return;

		setIsLoading(true);
		setEndSessionButtonText("Calculating amount...");
		console.log("handleEndSession: Setting isLoading to true");
		try {
			const amountResponse = await getAmount(session.id);
			const amount = amountResponse.amount;
			setCalculatedAmount(amount);

			if (amount < MIN_AMOUNT) {
				setShowMinAmountPopup(true);
			} else {
				setEndSessionButtonText("Ending...");
				await end(session.id);
				router.push(`/session/${session.id}/checkout`);
			}
		} catch (error) {
			console.error("Error ending session:", error);
			setEndSessionButtonText("End Session"); // Reset button text on error
		} finally {
			setIsLoading(false);
			console.log("handleEndSession: Setting isLoading to false");
		}
	};

	const handleConfirmEndSession = async () => {
		setShowMinAmountPopup(false);
		if (!session?.id) return;

		setIsLoading(true);
		setEndSessionButtonText("Ending...");
		try {
			await end(session.id);
			router.push(`/session/${session.id}/checkout`);
		} catch (error) {
			console.error("Error ending session after confirmation:", error);
			setEndSessionButtonText("End Session"); // Reset button text on error
		} finally {
			setIsLoading(false);
		}
	};

	const handleCloseMinAmountPopup = () => {
		setShowMinAmountPopup(false);
		setEndSessionButtonText("End Session"); // Reset button text if user cancels
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
					cursor: isLoading ? "not-allowed" : "pointer", // Disable cursor when loading
					opacity: isLoading ? 0.7 : 1, // Reduce opacity when loading
					alignSelf: "flex-end",
					mb: 2,
				}}
			>
				{/* Inner Box for the toggle switch */}
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
						{"Free 5-minute break after 50 minutes!"}
					</Typography>
				</Box>
			</Box>
			<Typography sx={{ fontSize: "24px", fontWeight: 700, fontFamily: rootStyle.mainFontFamily, mb: 2 }}>
				{isPaused ? "Pod Locked" : "Pod Unlocked"}
			</Typography>


			<Button
				variant="contained"
				fullWidth
				onClick={handleToggle}
				sx={{ mb: 4, fontWeight: 600, fontSize: 16 }}
				startIcon={!isPaused ? <Pause /> : <Play />}
				disabled={isLoading}
			>
				{!isPaused ? "Pause Session" : "Resume Session"}
			</Button>

			<Button
				variant="outlined"
				fullWidth
				color="error"
				onClick={handleEndSession}
				disabled={isLoading}
			>
				{endSessionButtonText}
			</Button>

			<Dialog
				open={showMinAmountPopup}
				onClose={handleCloseMinAmountPopup}
				fullWidth
				maxWidth="xs"
				PaperProps={{ sx: { borderRadius: 3, p: { xs: 1, sm: 2 }, background: rootStyle.backgroundColor } }}
			>
				<DialogTitle sx={{ fontWeight: 700, fontSize: 24, pb: 0, textAlign: 'center' }}>{"Minimum Amount Required"}</DialogTitle>
				<DialogContent sx={{ pb: 0, textAlign: 'center' }}>
					<DialogContentText sx={{ fontSize: 16, color: rootStyle.descriptionColor, mb: 2 }}>
						{`The minimum amount to pay is ${MIN_AMOUNT.toLocaleString('en-US', { style: 'currency', currency: 'EUR' })}. Your current calculated amount is ${calculatedAmount.toLocaleString('en-US', { style: 'currency', currency: 'EUR' }) }. Do you still want to end the session?`}
					</DialogContentText>
				</DialogContent>
				<DialogActions
					sx={{
						justifyContent: 'center',
						gap: 2,
						pb: { xs: 1.5, sm: 2 },
						flexDirection: 'row',
						alignItems: 'center',
					}}
				>
					<Button
						onClick={handleCloseMinAmountPopup}
						disabled={isLoading}
						variant="outlined"
						fullWidth
						sx={{
							borderRadius: 3,
							fontWeight: 700,
							color: rootStyle.elementColor,
							borderColor: rootStyle.elementColor,
							px: 2,
							background: 'transparent',
							maxWidth: 180,
							minWidth: 125
						}}
					>
						Keep session
					</Button>
					<Button
						onClick={handleConfirmEndSession}
						color="error"
						disabled={isLoading}
						variant="contained"
						fullWidth
						sx={{
							borderRadius: 3,
							fontWeight: 700,
							px: 2,
							background: '#C2412B',
							maxWidth: 180,
							minWidth: 125
						}}
					>
						End anyway
					</Button>
				</DialogActions>
			</Dialog>

			{pauseLogs.filter(log => log.resume_at).map((pauseLog, idx) => {
				const pauseStart = new Date(pauseLog.pause_at);
				const pauseEnd = pauseLog.resume_at ? new Date(pauseLog.resume_at) : null;
				const duration = pauseEnd ? Math.floor((pauseEnd.getTime() - pauseStart.getTime()) / 1000) : 0;
				const key = pauseLog.id ? `${pauseLog.id}-${idx}` : `pause-${idx}`;
				return (
					<Typography variant="body2" color="text.secondary" key={key}>
						{`#${idx + 1} — Paused ${formatTime(duration)}`}
					</Typography>
				);
			})}
		</Card>
	);
};

export default SessionClock;
