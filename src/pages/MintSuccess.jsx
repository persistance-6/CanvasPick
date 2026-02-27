import React from 'react';

function MintSuccess({ mintedArtId, onViewArtwork, onNavigateHome }) {

    return (
        <div className="pt-20 min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
                {/* 성공 아이콘 */}
                <div className="mb-6">
                    <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                {/* 메시지 */}
                <h1 className="text-3xl font-bold text-slate-900 mb-3">
                    민팅이 완료되었습니다!
                </h1>
                <p className="text-slate-500 mb-8 text-sm">
                    작품이 성공적으로 10,000조각의 NFT로 발행되었습니다.<br />
                    이제 갤러리에서 작품을 확인하고 거래할 수 있습니다.
                </p>

                {/* 버튼 영역 */}
                <div className="space-y-3">
                    {/* 작품 보러 가기 (브랜드 색상) */}
                    <button
                        onClick={() => onViewArtwork?.(mintedArtId)}
                        className="w-full btn-brand-gradient text-slate-900 font-bold py-3 rounded-xl transition-all hover:scale-[1.02]"
                    >
                        작품 보러 가기
                    </button>

                    {/* 홈 화면으로 (회색) */}
                    <button
                        onClick={onNavigateHome}
                        className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-xl transition-colors"
                    >
                        홈 화면으로
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MintSuccess;
