"use client";

import { motion, Transition } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, useMemo } from "react";

interface BorderBeamProps {
    /**
     * The size of the border beam.
     */
    size?: number;
    /**
     * The duration of the border beam.
     */
    duration?: number;
    /**
     * The delay of the border beam.
     */
    delay?: number;
    /**
     * The color of the border beam from.
     */
    colorFrom?: string;
    /**
     * The color of the border beam to.
     */
    colorTo?: string;
    /**
     * The motion transition of the border beam.
     */
    transition?: Transition;
    /**
     * The class name of the border beam.
     */
    className?: string;
    /**
     * The style of the border beam.
     */
    style?: React.CSSProperties;
    /**
     * Whether to reverse the animation direction.
     */
    reverse?: boolean;
    /**
     * The initial offset position (0-100).
     */
    initialOffset?: number;
    /**
     * The border width of the beam.
     */
    borderWidth?: number;
}

export const BorderBeam = ({
    className,
    size = 150,
    delay = 0,
    duration = 8,
    colorFrom = "#ffaa40",
    colorTo = "#9c40ff",
    transition,
    style,
    reverse = false,
    initialOffset = 0,
    borderWidth = 2,
}: BorderBeamProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0, borderRadius: 24 });
    const gradientId = `borderBeamGradient-${Math.random().toString(36).substr(2, 9)}`;

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current?.parentElement) {
                const parent = containerRef.current.parentElement;
                const rect = parent.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(parent);
                const borderRadius = parseFloat(computedStyle.borderRadius) || 24;
                
                if (rect.width > 0 && rect.height > 0) {
                    setDimensions({
                        width: rect.width,
                        height: rect.height,
                        borderRadius,
                    });
                }
            }
        };

        // 초기 업데이트
        updateDimensions();
        
        // 약간의 지연 후 다시 업데이트 (레이아웃이 완료된 후)
        const timeoutId = setTimeout(updateDimensions, 100);
        
        // ResizeObserver로 크기 변경 감지
        const resizeObserver = new ResizeObserver(() => {
            updateDimensions();
        });
        
        if (containerRef.current?.parentElement) {
            resizeObserver.observe(containerRef.current.parentElement);
        }

        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
        };
    }, []);

    const { width, height, borderRadius } = dimensions;
    
    const pathData = useMemo(() => {
        if (width === 0 || height === 0) return "";
        return `M ${borderRadius} 0 L ${width - borderRadius} 0 Q ${width} 0 ${width} ${borderRadius} L ${width} ${height - borderRadius} Q ${width} ${height} ${width - borderRadius} ${height} L ${borderRadius} ${height} Q 0 ${height} 0 ${height - borderRadius} L 0 ${borderRadius} Q 0 0 ${borderRadius} 0 Z`;
    }, [width, height, borderRadius]);
    
    const pathLength = useMemo(() => {
        if (width === 0 || height === 0) return 0;
        return 2 * (width + height) - 8 * borderRadius + 2 * Math.PI * borderRadius;
    }, [width, height, borderRadius]);
    
    const beamLength = size;

    return (
        <div
            ref={containerRef}
            className={cn(
                "pointer-events-none absolute inset-0 overflow-visible",
                className
            )}
            style={style}
        >
            {width > 0 && height > 0 && (
                <svg
                    width="100%"
                    height="100%"
                    className="absolute inset-0"
                    style={{ filter: "blur(6px)", overflow: "visible" }}
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={colorFrom} stopOpacity="0" />
                            <stop offset="50%" stopColor={colorFrom} stopOpacity="1" />
                            <stop offset="100%" stopColor={colorTo} stopOpacity="1" />
                        </linearGradient>
                    </defs>
                    <motion.path
                        d={pathData}
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth={borderWidth}
                        strokeLinecap="round"
                        strokeDasharray={`${beamLength} ${pathLength}`}
                        initial={{
                            strokeDashoffset: reverse ? pathLength + initialOffset : -initialOffset,
                        }}
                        animate={{
                            strokeDashoffset: reverse
                                ? [pathLength + initialOffset, -beamLength - initialOffset]
                                : [-initialOffset, pathLength + beamLength + initialOffset],
                        }}
                        transition={{
                            repeat: Infinity,
                            ease: "linear",
                            duration,
                            delay: -delay,
                            ...transition,
                        }}
                    />
                </svg>
            )}
        </div>
    );
};
