import React from 'react';

/**
 * 재사용 가능한 폼 입력 필드 컴포넌트
 * 
 * @param {string} label - 입력 필드 라벨
 * @param {boolean} required - 필수 입력 여부 (기본: false)
 * @param {string} hint - 라벨 아래 힌트 텍스트
 * @param {string} placeholder - placeholder 텍스트
 * @param {string} value - 입력값
 * @param {function} onChange - 변경 핸들러
 * @param {string} type - input 타입 (기본: "text")
 * @param {object} props - 나머지 input 속성들 (step, min, max 등)
 */
function FormInput({ 
    label, 
    required = false, 
    hint, 
    placeholder, 
    value, 
    onChange, 
    type = "text", 
    ...props 
}) {
    return (
        <div>
            {label && (
                <label className="block text-xs font-bold text-slate-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                type={type}
                required={required}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full p-3 bg-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                {...props}
            />
            {hint && (
                <p className="text-xs text-slate-400 mt-1">{hint}</p>
            )}
        </div>
    );
}

export default FormInput;
