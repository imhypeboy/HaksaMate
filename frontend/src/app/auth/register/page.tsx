'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from '@/lib/auth';
import { RegisterData } from '@/types/user';

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // 입력 시 해당 필드의 에러 메시지 제거
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.username.trim()) {
            newErrors.username = '사용자 이름을 입력해주세요.';
        }

        if (!formData.email.trim()) {
            newErrors.email = '이메일을 입력해주세요.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = '유효한 이메일 주소를 입력해주세요.';
        }

        if (!formData.password) {
            newErrors.password = '비밀번호를 입력해주세요.';
        } else if (formData.password.length < 6) {
            newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다.';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            await registerUser(formData);
            router.push('/'); // 회원가입 성공 시 메인 페이지로 이동
        } catch (error: any) {
            console.error('회원가입 오류:', error);
            setGeneralError(
                error.response?.data?.message ||
                '회원가입에 실패했습니다. 다시 시도해주세요.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div>
                    <h1 className="text-center text-3xl font-bold text-gray-900">학사메이트</h1>
                    <h2 className="mt-6 text-center text-2xl font-semibold text-gray-700">
                        회원가입
                    </h2>
                </div>

                {generalError && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                        {generalError}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                사용자 이름
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="name"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                className={`appearance-none relative block w-full px-3 py-2 border ${
                                    errors.username ? 'border-red-500' : 'border-gray-300'
                                } rounded-md bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                                placeholder="사용자 이름"
                            />
                            {errors.username && (
                                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                이메일
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className={`appearance-none relative block w-full px-3 py-2 border ${
                                    errors.email ? 'border-red-500' : 'border-gray-300'
                                } rounded-md bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                                placeholder="이메일 주소"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                비밀번호
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className={`appearance-none relative block w-full px-3 py-2 border ${
                                    errors.password ? 'border-red-500' : 'border-gray-300'
                                } rounded-md bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                                placeholder="비밀번호 (6자 이상)"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                비밀번호 확인
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`appearance-none relative block w-full px-3 py-2 border ${
                                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                } rounded-md bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                                placeholder="비밀번호 확인"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isLoading ? '처리 중...' : '회원가입'}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        이미 계정이 있으신가요?{' '}
                        <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                            로그인
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}