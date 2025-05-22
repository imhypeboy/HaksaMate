import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, email, password, confirmPassword } = body;

        // 기본적인 유효성 검사
        if (!username || !email || !password) {
            return NextResponse.json(
                { message: '모든 필드를 입력해주세요.' },
                { status: 400 }
            );
        }

        if (email === 'test@haksamate.com') {
            return NextResponse.json(
                { message: '이미 사용 중인 이메일입니다.' },
                { status: 400 }
            );
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                { message: '비밀번호가 일치하지 않습니다.' },
                { status: 400 }
            );
        }

        // 이메일 형식 검사
        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: '유효한 이메일 주소를 입력해주세요.' },
                { status: 400 }
            );
        }

        // 비밀번호 길이 검사
        if (password.length < 6) {
            return NextResponse.json(
                { message: '비밀번호는 최소 6자 이상이어야 합니다.' },
                { status: 400 }
            );
        }

        // 실제 구현에서는 이메일 중복 검사 및 데이터베이스에 사용자 저장
        // 여기서는 간단한 예시로 성공 응답을 반환합니다

        // JWT 토큰 생성 (실제 구현에서는 jsonwebtoken 라이브러리 사용)
        const token = 'example-jwt-token-' + Date.now();

        return NextResponse.json({
            user: {
                id: Math.floor(Math.random() * 1000) + 2, // 랜덤 ID (테스트 계정은 ID 1)
                username,
                email
            },
            token
        }, { status: 201 });
    } catch (error) {
        console.error('회원가입 처리 중 오류 발생:', error);
        return NextResponse.json(
            { message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}