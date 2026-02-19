// src/components/icons/BigPixelCursor.jsx
import React from 'react';

const BigPixelCursor = ({ className = "w-24 h-24", color = "black" }) => {
  return (
    <svg 
      viewBox="0 3 20 20" 
      fill="none" 
      xmlns="http://www.w3.org" 
      //shapeRendering="crispEdges" // 픽셀 뭉개짐 방지
      className={className}
    >
      {/* 2. 검정색 도트 외곽선 (계단식으로 변환) */}
      <path 
        d="M0 0V19H1V18H2V17H3V16H4V17H5V18H6V19H7V20H8V21H9V20H10V19H9V18H8V17H7V16H8V15H9V14H10V13H11V12H10V11H9V10H8V9H7V8H6V7H5V6H4V5H3V4H2V3H1V2H0V0Z" 
        fill={color} 
      />

      {/* 3. 내부 흰색 채우기 (원본 실루엣 유지하며 계단식 처리) */}
      <path 
        d="M1 2V15H2V14H3V13H4V12H5V13H6V14H7V15H8V16H9V15H8V14H7V13H6V12H5V11H9V10H8V9H7V8H6V7H5V6H4V5H3V4H2V2H1Z" 
        fill="white" 
      />
    </svg>
  );
};

export default BigPixelCursor;
