import React from 'react';

/**
 * AB Logo component - renders the AssetBlock "AB" monogram logo as an inline SVG.
 * Supports custom size and className props.
 */
export default function ABLogo({ size = 40, className = '', style = {} }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id="abGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="45%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="abGradShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#c4b5fd" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.8" />
        </linearGradient>
        <filter id="abGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* A letter */}
      <path
        d="M 15 78 L 38 22 C 39 19 41 18 43 18 L 45 18 C 47 18 49 19 50 22 L 58 42 L 52 42 L 44 24 C 43.5 23 43 22.5 42 23 L 42 23 C 41 23.5 40.5 24 40 25 L 22 72 C 21 74 22 76 24 76 L 28 76 L 32 66 L 54 66 L 50 76 L 15 78 Z"
        fill="url(#abGradMain)"
        filter="url(#abGlow)"
      />
      {/* B letter - overlapping the A */}
      <path
        d="M 48 78 L 48 22 L 68 22 C 78 22 85 28 85 36 C 85 41 82 45 78 47 C 83 49 87 54 87 60 C 87 70 79 78 68 78 Z M 56 30 L 56 45 L 66 45 C 73 45 77 41 77 36 C 77 31 73 28 66 28 Z M 56 52 L 56 70 L 68 70 C 76 70 80 65 80 60 C 80 55 76 52 68 52 Z"
        fill="url(#abGradMain)"
        filter="url(#abGlow)"
      />
      {/* Shine overlay on A */}
      <path
        d="M 15 78 L 38 22 C 39 19 41 18 43 18 L 45 18 C 47 18 49 19 50 22 L 58 42 L 52 42 L 44 24 C 43.5 23 43 22.5 42 23 L 42 23 C 41 23.5 40.5 24 40 25 L 22 72 C 21 74 22 76 24 76 L 28 76 L 32 66 L 54 66 L 50 76 L 15 78 Z"
        fill="url(#abGradShine)"
        opacity="0.3"
      />
      {/* Shine overlay on B */}
      <path
        d="M 48 78 L 48 22 L 68 22 C 78 22 85 28 85 36 C 85 41 82 45 78 47 C 83 49 87 54 87 60 C 87 70 79 78 68 78 Z M 56 30 L 56 45 L 66 45 C 73 45 77 41 77 36 C 77 31 73 28 66 28 Z M 56 52 L 56 70 L 68 70 C 76 70 80 65 80 60 C 80 55 76 52 68 52 Z"
        fill="url(#abGradShine)"
        opacity="0.3"
      />
    </svg>
  );
}
