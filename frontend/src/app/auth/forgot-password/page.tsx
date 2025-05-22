'use client';

import { useState } from 'react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // 실제로는 비밀번호 재설정 이메일 발송 API 호출!
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-300 via-blue-200 to-pink-200">
            <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white/70 backdrop-blur-md border border-white/30">
                <h2 className="text-2xl font-extrabold text-center mb-2 text-purple-600 tracking-tight">비밀번호 재설정</h2>
                <p className="text-center text-gray-600 mb-8">
                    가입한 이메일로<br />
                    비밀번호 재설정 링크를 보내드려요.
                </p>
                {submitted ? (
                    <div className="text-center text-green-600 font-semibold">
                        📧 이메일이 전송되었습니다!<br />
                        메일함을 확인해 주세요.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                이메일 주소
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-300 focus:outline-none bg-white/90 transition"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-500 via-pink-400 to-blue-400 text-white shadow-lg hover:scale-105 transition"
                        >
                            비밀번호 재설정 링크 받기
                        </button>
                    </form>
                )}
                <div className="mt-8 text-center text-sm">
                    <a href="/auth/login" className="text-purple-600 hover:underline font-semibold transition">
                        로그인으로 돌아가기
                    </a>
                </div>
            </div>
        </div>
    );
}
