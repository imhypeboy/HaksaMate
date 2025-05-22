import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // 테스트용 계정 정보 하드코딩
        if (email === 'test@haksamate.com' && password === 'haksa123') {
            // JWT 토큰 생성 (실제 구현에서는 jsonwebtoken 라이브러리 사용)
            const token = 'example-jwt-token-' + Date.now(); // 매번 다른 토큰 생성

            return NextResponse.json({
                user: {
                    id: 1,
                    username: '테스트사용자',
                    email: 'test@haksamate.com'
                },
                token
            }, { status: 200 });
        }

        return NextResponse.json(
            { message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
            { status: 401 }
        );
    } catch (error) {
        console.error('로그인 처리 중 오류 발생:', error);
        return NextResponse.json(
            { message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}