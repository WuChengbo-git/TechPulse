import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 80, showText = true }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px'
    }}>
      {/* Logo SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 渐变定义 */}
        <defs>
          <linearGradient id="techGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1890ff" />
            <stop offset="50%" stopColor="#52c41a" />
            <stop offset="100%" stopColor="#722ed1" />
          </linearGradient>

          <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1890ff" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#52c41a" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#722ed1" stopOpacity="0.2" />
          </linearGradient>

          {/* 脉冲动画 */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 外圈 - 科技感圆环 */}
        <circle
          cx="100"
          cy="100"
          r="90"
          stroke="url(#techGradient)"
          strokeWidth="4"
          fill="none"
          strokeDasharray="10 5"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 100 100"
            to="360 100 100"
            dur="20s"
            repeatCount="indefinite"
          />
        </circle>

        {/* 中圈 - 数据流 */}
        <circle
          cx="100"
          cy="100"
          r="70"
          stroke="url(#techGradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5 10"
          opacity="0.6"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 100 100"
            to="0 100 100"
            dur="15s"
            repeatCount="indefinite"
          />
        </circle>

        {/* 核心 T 字母 */}
        <g filter="url(#glow)">
          <path
            d="M 70 60 L 130 60 L 130 70 L 105 70 L 105 140 L 95 140 L 95 70 L 70 70 Z"
            fill="url(#techGradient)"
          />
        </g>

        {/* 脉冲波形 */}
        <path
          d="M 40 100 L 50 100 L 60 80 L 70 120 L 80 90 L 90 110 L 100 100"
          stroke="url(#pulseGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        >
          <animate
            attributeName="d"
            values="
              M 40 100 L 50 100 L 60 80 L 70 120 L 80 90 L 90 110 L 100 100;
              M 40 100 L 50 100 L 60 120 L 70 80 L 80 110 L 90 90 L 100 100;
              M 40 100 L 50 100 L 60 80 L 70 120 L 80 90 L 90 110 L 100 100
            "
            dur="2s"
            repeatCount="indefinite"
          />
        </path>

        <path
          d="M 100 100 L 110 110 L 120 90 L 130 120 L 140 80 L 150 100 L 160 100"
          stroke="url(#pulseGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        >
          <animate
            attributeName="d"
            values="
              M 100 100 L 110 110 L 120 90 L 130 120 L 140 80 L 150 100 L 160 100;
              M 100 100 L 110 90 L 120 110 L 130 80 L 140 120 L 150 100 L 160 100;
              M 100 100 L 110 110 L 120 90 L 130 120 L 140 80 L 150 100 L 160 100
            "
            dur="2s"
            repeatCount="indefinite"
          />
        </path>

        {/* 数据点 */}
        {[45, 135, 225, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x = 100 + 60 * Math.cos(rad);
          const y = 100 + 60 * Math.sin(rad);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="url(#techGradient)"
            >
              <animate
                attributeName="r"
                values="4;6;4"
                dur="2s"
                begin={`${i * 0.5}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;1;0.6"
                dur="2s"
                begin={`${i * 0.5}s`}
                repeatCount="indefinite"
              />
            </circle>
          );
        })}
      </svg>

      {/* Logo 文字 */}
      {showText && (
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: 0,
            fontSize: size * 0.4,
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #1890ff, #52c41a, #722ed1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '2px'
          }}>
            TechPulse
          </h1>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: size * 0.15,
            color: '#8c8c8c',
            letterSpacing: '1px'
          }}>
            科技脉搏 · 洞察未来
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;
