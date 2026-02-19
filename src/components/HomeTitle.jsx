import React from 'react';

const HomeTitle = () => {

    return (
        <div className={`
  /* 1. 기본은 가로 정렬, 호버 시 세로 느낌이 나도록 너비 제한 */
  flex flex-col items-start justify-start translate-y-20
  
  /* 2. 간격 조절 (가로일 때와 세로일 때 적절히 대응) */
  gap-x-4 gap-y-2
  
  /* 3. 부드러운 전환 효과 */
  transition-all duration-700 ease-in-out group select-none 
`}>
            <span className="flex-shrink-0 opacity-0 animate-slide-in">
                <p className="home-title ">Pick</p>
            </span>
            <span className="flex-shrink-0 opacity-0 animate-slide-in delay-200">
                <p className="home-title ">Your</p>
            </span>
            <span className="flex-shrink-0 opacity-0 animate-slide-in delay-400 flex items-start">
                <p className="home-title ">Canvas</p>
                <p className="home-title text-[#FFE1A8]">.</p>
            </span>
        </div>
    )
};

export default HomeTitle;