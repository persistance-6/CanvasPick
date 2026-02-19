import React from 'react';

const NFTCard = ({
    imageSrc = "https://images.squarespace-cdn.com/content/v1/571117a23c44d8a2c71311bd/1600875941899-Z1X9E1O5TYZWHO1HIZ8E/IMG_1506.jpg", // 기본 이미지
    title = "Untitled Masterpiece",
    artist = "Unknown Artist",
    className = "",
    id = "#00001"
}) => {
    return (
        <div className={`flex h-full w-full flex-col items-center justify-start select-none ${className}`}>
            {/* 1. 작품명 (Title) - 맨 위 배치 */}
            <div className="w-full mb-4 px-1">
                <h3 className="text-white font-bold text-xl truncate tracking-tight leading-tight">
                    {title}
                </h3>
            </div>

            {/* 2. 작품 이미지 영역 - 중간 배치 */}
            <div className="w-full h-[80%] rounded-3xl bg-white/10 border border-white/5 shadow-inner overflow-hidden">
                <img
                    src={imageSrc}
                    alt={title}
                    className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                />
            </div>

            {/* 3. 아티스트 정보 영역 - 이미지 아래 배치 */}
            <div className="w-full mt-4 px-1 flex justify-between">
                <div className="h-7 flex items-center">
                    <p className="text-white text-sm font-medium truncate">
                        {artist}
                    </p>
                </div>
                <div className="h-7 w-fit bg-white/20 px-4 flex items-center rounded-full backdrop-blur-sm border border-white/10">
                    <p className="text-white/90 text-xs font-semibold truncate">
                        {id}
                    </p>
                </div>
            </div>
        </div>

    );
};

export default NFTCard;
