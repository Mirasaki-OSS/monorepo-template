'use client';

import { mergePropsWithClassName } from '@md-oss/design-system/lib/utils';
import * as React from 'react';

export type ParticleBackgroundProps = {
	particleCount?: number;
	particleSize?: number;
	particleSpeed?: number;
	lineDistance?: number;
	color?: string;
	className?: string;
	slotProps?: {
		canvas?: React.HTMLAttributes<HTMLCanvasElement>;
	};
};

/**
 * Lightweight canvas-based particle background with animated particles and connecting lines. It creates a dynamic and visually appealing backdrop without relying on external libraries. The component is customizable, allowing you to adjust particle count, size, speed, line distance, and color to fit your design needs.
 */
export function ParticleBackground({
	className,
	particleCount = 60,
	particleSize = 2,
	particleSpeed = 0.35,
	lineDistance = 140,
	color = 'rgba(0, 199, 255, 0.8)',
	slotProps,
}: ParticleBackgroundProps): React.JSX.Element {
	const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
	const animationRef = React.useRef<number | null>(null);

	React.useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let width = canvas.clientWidth;
		let height = canvas.clientHeight;
		const dpr = window.devicePixelRatio || 1;

		type Particle = { x: number; y: number; vx: number; vy: number };
		const particles: Particle[] = [];

		const resize = () => {
			const oldWidth = width;
			const oldHeight = height;
			width = canvas.clientWidth;
			height = canvas.clientHeight;
			canvas.width = width * dpr;
			canvas.height = height * dpr;
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.scale(dpr, dpr);

			// Scale existing particle positions to new canvas size
			if (oldWidth > 0 && oldHeight > 0 && particles.length > 0) {
				const scaleX = width / oldWidth;
				const scaleY = height / oldHeight;
				for (const p of particles) {
					p.x *= scaleX;
					p.y *= scaleY;
				}
			}
		};

		resize();

		// Initialize particles after first resize
		for (let i = 0; i < particleCount; i++) {
			particles.push({
				x: Math.random() * width,
				y: Math.random() * height,
				vx: (Math.random() - 0.5) * particleSpeed,
				vy: (Math.random() - 0.5) * particleSpeed,
			});
		}

		const draw = () => {
			ctx.clearRect(0, 0, width, height);

			// Move and draw particles
			for (const p of particles) {
				p.x += p.vx;
				p.y += p.vy;

				// wrap around edges
				if (p.x < 0) p.x = width;
				if (p.x > width) p.x = 0;
				if (p.y < 0) p.y = height;
				if (p.y > height) p.y = 0;

				ctx.beginPath();
				ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
				ctx.fillStyle = color;
				ctx.fill();
			}

			// Draw lines between close particles
			for (let i = 0; i < particles.length; i++) {
				for (let j = i + 1; j < particles.length; j++) {
					const a = particles[i];
					const b = particles[j];
					if (!a || !b) continue;

					const dx = a.x - b.x;
					const dy = a.y - b.y;
					const dist = Math.hypot(dx, dy);
					if (dist < lineDistance) {
						const alpha = 1 - dist / lineDistance;
						ctx.save();
						ctx.strokeStyle = color;
						ctx.globalAlpha = alpha;
						ctx.lineWidth = 1;
						ctx.beginPath();
						ctx.moveTo(a.x, a.y);
						ctx.lineTo(b.x, b.y);
						ctx.stroke();
						ctx.restore();
					}
				}
			}

			animationRef.current = requestAnimationFrame(draw);
		};

		animationRef.current = requestAnimationFrame(draw);
		window.addEventListener('resize', resize);

		return () => {
			if (animationRef.current) cancelAnimationFrame(animationRef.current);
			window.removeEventListener('resize', resize);
		};
	}, [particleCount, particleSize, particleSpeed, lineDistance, color]);

	const canvasProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLCanvasElement>
	>(
		{ className: 'absolute inset-0 -z-10 h-full w-full pointer-events-none' },
		slotProps?.canvas,
		className
	);

	return <canvas ref={canvasRef} {...canvasProps} />;
}
