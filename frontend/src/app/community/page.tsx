'use client';

import { useState } from 'react';
import { MessageSquare, Bell, Users, Hash, ThumbsUp, MessageCircle, Share } from 'lucide-react';
import Sidebar from '@/app/sidebar/sidebar';

export default function CommunityPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'following'>('all');
    const [newPost, setNewPost] = useState('');

    const posts = [
        {
            id: 1,
            author: 'DevMaster',
            content: 'Next.js 14의 새로운 서버 액션 기능 사용해보신 분 계신가요?',
            likes: 45,
            comments: 12,
            tags: ['nextjs', 'frontend'],
            timestamp: '2시간 전',
        },
        {
            id: 2,
            author: 'UI_Designer',
            content: 'Figma 자동 레이아웃 활용 팁 공유합니다! → [링크]',
            likes: 89,
            comments: 24,
            tags: ['figma', 'design'],
            timestamp: '5시간 전',
        },
    ];

    const trendingTopics = [
        { tag: 'webdev', posts: 2345 },
        { tag: 'react', posts: 1890 },
        { tag: 'typescript', posts: 1567 },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* 좌측 사이드바 */}
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* 메인 콘텐츠 */}
            <main className="flex-1 p-8 max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
                        <MessageSquare className="mr-2 text-blue-500" size={28} />
                        대학생 커뮤니티
                    </h1>

                    {/* 새 포스트 작성 */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="새로운 주제를 시작해보세요..."
                className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-300 focus:border-transparent text-gray-900"
                rows={3}
            />
                        <div className="flex justify-between items-center mt-4">
                            <button className="flex items-center text-gray-600 hover:text-blue-500">
                                <Hash className="w-5 h-5 mr-1" />
                                태그 추가
                            </button>
                            <button
                                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                                disabled={!newPost.trim()}
                            >
                                게시
                            </button>
                        </div>
                    </div>

                    {/* 탭 */}
                    <nav className="flex border-b border-gray-200">
                        {(['all', 'popular', 'following'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-sm font-medium ${
                                    activeTab === tab
                                        ? 'text-blue-500 border-b-2 border-blue-500'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab === 'all' && '전체 보기'}
                                {tab === 'popular' && '인기 글'}
                                {tab === 'following' && '팔로잉'}
                            </button>
                        ))}
                    </nav>
                </header>

                {/* 포스트 목록 */}
                <section className="space-y-6">
                    {posts.map((post) => (
                        <article
                            key={post.id}
                            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start mb-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-blue-500 font-semibold">{post.author[0]}</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{post.author}</h3>
                                    <p className="text-sm text-gray-500">{post.timestamp}</p>
                                </div>
                            </div>

                            <p className="text-gray-800 mb-4">{post.content}</p>

                            <div className="flex gap-2 mb-4">
                                {post.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2 py-1 bg-blue-100 text-blue-600 text-sm rounded-full"
                                    >
                    #{tag}
                  </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-6 text-gray-500">
                                <button className="flex items-center hover:text-blue-500">
                                    <ThumbsUp className="w-5 h-5 mr-1" />
                                    {post.likes}
                                </button>
                                <button className="flex items-center hover:text-green-500">
                                    <MessageCircle className="w-5 h-5 mr-1" />
                                    {post.comments}
                                </button>
                                <button className="flex items-center hover:text-purple-500">
                                    <Share className="w-5 h-5 mr-1" />
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            </main>

            {/* 오른쪽 섹션 */}
            <aside className="w-80 p-8 border-l border-gray-200 bg-white">
                <div className="sticky top-8">
                    {/* 트렌딩 토픽 */}
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                            <Hash className="w-5 h-5 mr-2 text-blue-500" />
                            트렌딩 토픽
                        </h2>
                        <div className="space-y-3">
                            {trendingTopics.map((topic) => (
                                <div
                                    key={topic.tag}
                                    className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg text-gray-700"
                                >
                                    <span className="font-medium">#{topic.tag}</span>
                                    <span className="text-sm text-gray-500">
                    {topic.posts.toLocaleString()} posts
                  </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 규칙 */}
                    <section>
                        <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-700">
                            <Users className="w-5 h-5 mr-2 text-blue-500" />
                            커뮤니티 규칙
                        </h2>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li className="flex items-start">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3" />
                                서로 존중하는 언어 사용
                            </li>
                            <li className="flex items-start">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3" />
                                주제와 관련 없는 광고 금지
                            </li>
                            <li className="flex items-start">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3" />
                                지식 공유를 위한 건강한 토론
                            </li>
                        </ul>
                    </section>
                </div>
            </aside>
        </div>
    );
}
