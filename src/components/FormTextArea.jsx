import React from 'react';

/**
 * 재사용 가능한 TextArea 폼 컴포넌트
 * 
 * @param {string} label - 입력 필드 라벨
 * @param {boolean} required - 필수 입력 여부 (기본: false)
 * @param {string} hint - 라벨 아래 힌트 텍스트
 * @param {string} placeholder - placeholder 텍스트
 * @param {string} value - 입력값
 * @param {function} onChange - 변경 핸들러
 * @param {number} rows - textarea 줄 수 (기본: 4)
 * @param {object} props - 나머지 textarea 속성들
 */
function FormTextArea({ 
    label, 
    required = false, 
    hint, 
    placeholder = "여기에 설명 입력", 
    value, 
    onChange, 
    rows = 4,
    ...props 
}) {
    return (
        <div>
            {label && (
                <label className="block text-xs font-bold text-slate-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <textarea
                required={required}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                rows={rows}
                className="w-full p-3 bg-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 resize-none"
                {...props}
            />
            {hint && (
                <p className="text-xs text-slate-400 mt-1">{hint}</p>
            )}
        </div>
    );
}

export default FormTextArea;
