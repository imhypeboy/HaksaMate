'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from '@/lib/auth';
import { RegisterData } from '@/types/user';
import { UserIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<RegisterData>({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<number>(0);

    // 입력값 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        // 비밀번호 강도 체크
        if (name === 'password') {
            let strength = 0;
            if (value.length >= 6) strength += 1;
            if (/[A-Z]/.test(value)) strength += 1;
            if (/[a-z]/.test(value)) strength += 1;
            if (/[0-9]/.test(value)) strength += 1;
            if (/[^A-Za-z0-9]/.test(value)) strength += 1;
            setPasswordStrength(strength);
        }
    };

    // 폼 검증
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.username.trim()) newErrors.username = '사용자 이름을 입력해주세요.';
        if (!formData.email.trim()) newErrors.email = '이메일을 입력해주세요.';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = '유효한 이메일 주소를 입력해주세요.';
        if (!formData.password) newErrors.password = '비밀번호를 입력해주세요.';
        else if (formData.password.length < 6) newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다.';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);
        if (!validateForm()) return;
        setIsLoading(true);
        try {
            await registerUser(formData);
            setIsSuccess(true);
            setTimeout(() => router.push('/'), 1000);
        } catch (error: any) {
            setGeneralError(
                error.response?.data?.message || '회원가입에 실패했습니다. 다시 시도해주세요.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // 비밀번호 강도 색상 함수
    const getStrengthColor = (strength: number) => {
        if (strength <= 2) return 'bg-red-400';
        if (strength === 3) return 'bg-yellow-400';
        return 'bg-green-500';
    };

    // **JSX 전체 반드시 괄호로 감쌈!!**
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl relative">
                <div className="text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent select-none">학사메이트</h1>
                    <h2 className="mt-6 text-2xl font-semibold text-gray-700">회원가입</h2>
                    <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-pink-500 mx-auto mt-2 rounded-full" aria-hidden="true"></div>
                </div>
                {generalError && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border-l-4 border-red-400">
                        {generalError}
                    </div>
                )}
                {isSuccess && (
                    <div className="flex flex-col items-center justify-center p-4 text-green-600 animate-fade-in">
                        <CheckCircle2 className="h-10 w-10 mb-2 animate-pulse" />
                        <span>회원가입이 완료되었습니다!</span>
                    </div>
                )}
                {!isSuccess && (
                    <form className="mt-8 space-y-5" onSubmit={handleSubmit} autoComplete="off">
                        <div className="space-y-4">
                            {/* 사용자 이름 */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">사용자 이름</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        value={formData.username}
                                        onChange={handleChange}
                                        className={`pl-10 w-full px-3 py-2 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition`}
                                        placeholder="사용자 이름"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                                )}
                            </div>
                            {/* 이메일 */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                                <div className="relative">
                                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`pl-10 w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition`}
                                        placeholder="이메일 주소"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>
                            {/* 비밀번호 */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                                <div className="relative">
                                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`pl-10 w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition`}
                                        placeholder="비밀번호 (6자 이상)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                                    </button>
                                </div>
                                {/* 비밀번호 강도바 */}
                                {formData.password && (
                                    <div className="mt-2 flex gap-1 h-1">
                                        {[1,2,3,4,5].map(i => (
                                            <div key={i} className={`h-full flex-1 rounded-full ${passwordStrength >= i ? getStrengthColor(passwordStrength) : 'bg-gray-200'} transition-all`} />
                                        ))}
                                    </div>
                                )}
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>
                            {/* 비밀번호 확인 */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                                <div className="relative">
                                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirm ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={`pl-10 w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition`}
                                        placeholder="비밀번호 확인"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showConfirm ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 transition shadow-md hover:shadow-lg"
                            >
                                {isLoading ? '처리 중...' : '회원가입'}
                            </button>
                        </div>
                    </form>
                )}
                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        이미 계정이 있으신가요?{' '}
                        <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                            로그인
                        </Link>
                    </p>
                </div>
                <div className="text-center mt-8 text-xs text-gray-400 select-none">
                    학사메이트와 함께하는 스마트한 학교생활
                </div>
            </div>
        </div>
    );
}
