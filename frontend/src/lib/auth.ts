import axios from 'axios';
import { LoginCredentials, RegisterData, AuthResponse } from '@/types/user';

// 로그인 API 호출
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axios.post('/api/auth/login', credentials);
    const data = response.data;

    // 토큰을 로컬 스토리지에 저장
    if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
};

// 회원가입 API 호출
export const registerUser = async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await axios.post('/api/auth/register', userData);
    const data = response.data;

    // 토큰을 로컬 스토리지에 저장
    if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
};

// 로그아웃
export const logoutUser = (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
};

// 현재 로그인된 사용자 정보 가져오기
export const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;

    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

// 인증 상태 확인
export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;

    return !!localStorage.getItem('authToken');
};

// API 요청에 인증 토큰 추가하는 헤더 생성
export const authHeader = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};