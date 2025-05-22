'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginUser } from '@/lib/auth';
import { LoginCredentials } from '@/types/user';
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon, CheckCircle2, ShieldCheckIcon } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const formId = useId(); // 접근성 향상을 위한 고유 ID
    const [credentials, setCredentials] = useState<LoginCredentials>({
        email: '',
        password: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [animateForm, setAnimateForm] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<number>(0);

    // 페이지 로드 시 애니메이션 효과
    useEffect(() => {
        const timer = setTimeout(() => setAnimateForm(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // 메모리 누수 방지를 위한 clean-up 함수
    useEffect(() => {
        return () => {
            // 컴포넌트 언마운트 시 진행 중인 작업 취소
            if (isLoading) {
                setIsLoading(false);
            }
        };
    }, [isLoading]);

    // 입력 핸들러 최적화
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));

        // 비밀번호 강도 체크
        if (name === 'password') {
            // 간단한 비밀번호 강도 체크
            const hasLetter = /[a-zA-Z]/.test(value);
            const hasNumber = /[0-9]/.test(value);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
            const length = value.length;

            let strength = 0;
            if (length > 0) strength += 1;
            if (length >= 8) strength += 1;
            if (hasLetter) strength += 1;
            if (hasNumber) strength += 1;
            if (hasSpecial) strength += 1;

            setPasswordStrength(strength);
        }

        // 오류 메시지 입력 시 초기화
        if (error) setError(null);
    }, [error]);

    const togglePasswordVisibility = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await loginUser(credentials);
            setIsSuccess(true);

            // 로그인 정보 저장 (rememberMe 활용)
            if (rememberMe) {
                try {
                    localStorage.setItem('rememberedEmail', credentials.email);
                } catch (storageError) {
                    console.warn('로컬 스토리지 접근 오류:', storageError);
                }
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            // 성공 애니메이션 후 리디렉션
            setTimeout(() => {
                router.push('/');
            }, 800);
        } catch (error: any) {
            console.error('로그인 오류:', error);
            setError(
                error.response?.data?.message ||
                '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.'
            );
            setIsLoading(false);
        }
    };

    // 저장된 이메일이 있으면 불러오기
    useEffect(() => {
        try {
            const savedEmail = localStorage.getItem('rememberedEmail');
            if (savedEmail) {
                setCredentials(prev => ({ ...prev, email: savedEmail }));
                setRememberMe(true);
            }
        } catch (error) {
            console.warn('로컬 스토리지 접근 오류:', error);
        }
    }, []);

    // 암호 강도 표시 색상
    const getStrengthColor = (strength: number) => {
        if (strength <= 1) return 'bg-red-500';
        if (strength <= 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-400 to-pink-300 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* 배경 아날로그 요소들 */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-200 rounded-lg rotate-12 opacity-20 animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-200 rounded-full -rotate-12 opacity-20"></div>
            <div className="absolute top-1/4 right-1/4 w-16 h-16 border-4 border-white opacity-20 rounded-full"></div>

            {/* 글래스모피즘 메인 컨테이너 */}
            <div
                className={`max-w-md w-full sm:w-[90%] md:w-[440px] space-y-8 bg-white/80 backdrop-blur-md p-8 rounded-xl shadow-lg transition-all duration-500 relative ${animateForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                aria-labelledby={`${formId}-heading`}
            >
                {/* 종이클립 아날로그 요소 */}
                <div className="absolute -top-5 right-10 w-14 h-14 rotate-12" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                        <path d="M21.4383 11.6622L12.2483 20.8522C11.1225 21.9781 9.59552 22.6106 8.00334 22.6106C6.41115 22.6106 4.88418 21.9781 3.75834 20.8522C2.63251 19.7264 2 18.1994 2 16.6072C2 15.015 2.63251 13.488 3.75834 12.3622L12.9483 3.17222C13.6989 2.42166 14.7169 2 15.7783 2C16.8398 2 17.8578 2.42166 18.6083 3.17222C19.3589 3.92279 19.7806 4.94077 19.7806 6.00222C19.7806 7.06368 19.3589 8.08166 18.6083 8.83222L9.42834 18.0122C9.05306 18.3875 8.54406 18.5983 8.01334 18.5983C7.48261 18.5983 6.97361 18.3875 6.59834 18.0122C6.2231 17.6369 6.01224 17.1279 6.01224 16.5972C6.01224 16.0665 6.2231 15.5575 6.59834 15.1822L15.0683 6.71222" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>

                <div className="text-center relative">
                    <h1 id={`${formId}-heading`} className="text-3xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">학사메이트</h1>
                    <h2 className="mt-6 text-2xl font-semibold text-gray-700">
                        로그인
                    </h2>
                    {/* 아날로그 요소 - 밑줄 */}
                    <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-pink-500 mx-auto mt-2 rounded-full" aria-hidden="true"></div>
                </div>

                {error && (
                    <div
                        className="bg-red-50 text-red-700 p-4 rounded-md text-sm border-l-4 border-red-500 flex items-start"
                        role="alert"
                        aria-live="assertive"
                    >
                        <span className="mt-0.5" aria-hidden="true">❗</span>
                        <span className="ml-2">{error}</span>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit} id={formId}>
                    <div className="rounded-md space-y-6">
                        <div className="group">
                            <label htmlFor={`${formId}-email`} className="block text-sm font-medium text-gray-700 mb-2 transition-colors group-focus-within:text-indigo-600">
                                이메일
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400" aria-hidden="true">
                                    <MailIcon size={18} />
                                </div>
                                <input
                                    id={`${formId}-email`}
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={credentials.email}
                                    onChange={handleChange}
                                    className="pl-10 block w-full px-3 py-3 border border-gray-300 rounded-lg bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="이메일 주소"
                                    disabled={isLoading || isSuccess}
                                    aria-invalid={error ? "true" : "false"}
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label htmlFor={`${formId}-password`} className="block text-sm font-medium text-gray-700 mb-2 transition-colors group-focus-within:text-indigo-600">
                                비밀번호
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400" aria-hidden="true">
                                    <LockIcon size={18} />
                                </div>
                                <input
                                    id={`${formId}-password`}
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={credentials.password}
                                    onChange={handleChange}
                                    className="pl-10 block w-full px-3 py-3 border border-gray-300 rounded-lg bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="비밀번호"
                                    disabled={isLoading || isSuccess}
                                    aria-invalid={error ? "true" : "false"}
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                                    tabIndex={-1}
                                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                                    disabled={isLoading || isSuccess}
                                >
                                    {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                                </button>
                            </div>

                            {/* 비밀번호 강도 표시 */}
                            {credentials.password && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex gap-1 h-1">
                                        {[1, 2, 3, 4, 5].map((segment) => (
                                            <div
                                                key={segment}
                                                className={`h-full flex-1 rounded-full transition-all ${
                                                    passwordStrength >= segment ? getStrengthColor(passwordStrength) : 'bg-gray-200'
                                                }`}
                                                aria-hidden="true"
                                            ></div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 flex items-center">
                                        <ShieldCheckIcon size={12} className="mr-1" />
                                        {passwordStrength <= 1 && "매우 약한 비밀번호"}
                                        {passwordStrength === 2 && "약한 비밀번호"}
                                        {passwordStrength === 3 && "보통 비밀번호"}
                                        {passwordStrength === 4 && "강한 비밀번호"}
                                        {passwordStrength >= 5 && "매우 강한 비밀번호"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-y-2">
                        <div className="flex items-center">
                            <input
                                id={`${formId}-remember-me`}
                                name="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={() => setRememberMe(prev => !prev)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all"
                                disabled={isLoading || isSuccess}
                            />
                            <label htmlFor={`${formId}-remember-me`} className="ml-2 block text-sm text-gray-700">
                                로그인 상태 유지
                            </label>
                        </div>

                        <div className="text-sm">
                            <Link
                                href="/auth/forgot-password"
                                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded"
                                aria-label="비밀번호 재설정 페이지로 이동"
                            >
                                비밀번호를 잊으셨나요?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading || isSuccess}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all duration-300 shadow-md hover:shadow-lg"
                            aria-busy={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    로그인 중...
                                </>
                            ) : '로그인'}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        계정이 없으신가요?{' '}
                        <Link
                            href="/auth/register"
                            className="group font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded"
                        >
                            회원가입
                            <svg className="ml-0.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path d="M6.5 12.5L11 8L6.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </Link>
                    </p>
                </div>

                {/* 스크롤 텔링 요소 */}
                <div className="hidden md:block absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center text-white">
                    <p className="text-sm mb-2">학사메이트와 함께하는 스마트한 학교생활</p>
                    <div className="animate-bounce">
                        <svg className="mx-auto h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>

                {/* 성공 애니메이션 오버레이 */}
                {isSuccess && (
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl z-10 animate-fade-in"
                        aria-live="assertive"
                        role="status"
                    >
                        <div className="text-green-500 animate-scale-up flex flex-col items-center">
                            <CheckCircle2 className="h-16 w-16 animate-pulse" aria-hidden="true" />
                            <p className="mt-2 text-lg font-medium">로그인 성공!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}