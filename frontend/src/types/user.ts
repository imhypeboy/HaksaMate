export interface User {
    id?: number;
    username: string;
    email: string;
    password?: string; // 클라이언트에서만 사용, 서버로 전송 후 저장하지 않음
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface AuthResponse {
    user: Omit<User, 'password'>;
    token: string;
}