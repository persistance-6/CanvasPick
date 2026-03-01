import React from 'react';
import { X } from 'lucide-react';

/**
 * 범용 확인 모달 컴포넌트
 * @param {boolean} isOpen - 모달 표시 여부
 * @param {function} onClose - 모달 닫기 함수
 * @param {string} title - 모달 제목
 * @param {string} message - 확인 메시지
 * @param {React.ReactNode} children - 추가 내용 (수량, 가격 등)
 * @param {string} confirmText - 확인 버튼 텍스트
 * @param {string} cancelText - 취소 버튼 텍스트
 * @param {function} onConfirm - 확인 버튼 클릭 시 실행할 함수
 * @param {boolean} isProcessing - 처리 중 상태 (버튼 비활성화)
 */
function ConfirmModal({
  isOpen,
  onClose,
  title = '확인',
  message = '정말 진행하시겠습니까?',
  children,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  isProcessing = false,
}) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-slate-700 text-center font-medium">{message}</p>
          {children}
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 btn-brand-gradient font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isProcessing ? '처리 중...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
