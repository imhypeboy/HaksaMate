"use client"

import { useState } from "react"
import { MessageSquare, Users, Hash, ThumbsUp, MessageCircle, Share, Menu } from "lucide-react"
import Sidebar from "@/app/sidebar/sidebar"

export default function CommunityPage() {
    // 사이드바 초기 상태를 false(접힌 상태)로 설정
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<"all" | "popular" | "following">("all")
    const [newPost, setNewPost] = useState("")

    const posts = [
        {
            id: 1,
            author: "DevMaster",
            content: "Next.js 14의 새로운 서버 액션 기능 사용해보신 분 계신가요?",
            likes: 45,
            comments: 12,
            tags: ["nextjs", "frontend"],
            timestamp: "2시간 전",
        },
        {
            id: 2,
            author: "UI_Designer",
            content: "Figma 자동 레이아웃 활용 팁 공유합니다! → [링크]",
            likes: 89,
            comments: 24,
            tags: ["figma", "design"],
            timestamp: "5시간 전",
        },
    ]

    const trendingTopics = [
        { tag: "webdev", posts: 2345 },
        { tag: "react", posts: 1890 },
        { tag: "typescript", posts: 1567 },
    ]

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 text-gray-900">
            {/* 좌측 사이드바 */}
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* 메인 콘텐츠 */}
            <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto">
                <header className="mb-8">
                    <div className="flex items-center mb-4">
                        {/* 사이드바 토글 버튼 추가 */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="mr-3 p-2 rounded-full bg-white/70 backdrop-blur-md border border-white/30 shadow-md hover:bg-white/80 transition-all"
                            aria-label="사이드바 토글"
                        >
                            <Menu className="h-5 w-5 text-indigo-600" />
                        </button>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            <MessageSquare className="mr-2 text-indigo-500" size={28} />
                            대학생 커뮤니티
                        </h1>
                    </div>

                    {/* 새 포스트 작성 */}
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 mb-6 border border-white/30 transition-all hover:shadow-xl">
            <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="새로운 주제를 시작해보세요..."
                className="w-full p-4 border border-white/30 rounded-xl resize-none bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-300 focus:border-transparent text-gray-900 transition-all"
                rows={3}
            />
                        <div className="flex justify-between items-center mt-4">
                            <button className="flex items-center text-gray-600 hover:text-indigo-500 transition-colors">
                                <Hash className="w-5 h-5 mr-1" />
                                태그 추가
                            </button>
                            <button
                                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                                disabled={!newPost.trim()}
                            >
                                게시
                            </button>
                        </div>
                    </div>

                    {/* 탭 */}
                    <nav className="flex border-b border-white/30 mb-6">
                        {(["all", "popular", "following"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-sm font-medium transition-all ${
                                    activeTab === tab
                                        ? "text-indigo-600 border-b-2 border-indigo-500"
                                        : "text-gray-600 hover:text-indigo-500"
                                }`}
                            >
                                {tab === "all" && "전체 보기"}
                                {tab === "popular" && "인기 글"}
                                {tab === "following" && "팔로잉"}
                            </button>
                        ))}
                    </nav>
                </header>

                {/* 포스트 목록 */}
                <section className="space-y-6">
                    {posts.map((post) => (
                        <article
                            key={post.id}
                            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-white/30"
                        >
                            <div className="flex items-start mb-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mr-3 shadow-md">
                                    <span className="text-indigo-600 font-semibold">{post.author[0]}</span>
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
                                        className="px-2 py-1 bg-gradient-to-r from-indigo-100/80 to-purple-100/80 backdrop-blur-sm text-indigo-700 text-sm rounded-full shadow-sm"
                                    >
                    #{tag}
                  </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-6 text-gray-500">
                                <button className="flex items-center hover:text-indigo-500 transition-colors">
                                    <ThumbsUp className="w-5 h-5 mr-1" />
                                    {post.likes}
                                </button>
                                <button className="flex items-center hover:text-purple-500 transition-colors">
                                    <MessageCircle className="w-5 h-5 mr-1" />
                                    {post.comments}
                                </button>
                                <button className="flex items-center hover:text-pink-500 transition-colors">
                                    <Share className="w-5 h-5 mr-1" />
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            </main>

            {/* 오른쪽 섹션 */}
            <aside className="hidden lg:block w-80 p-8 border-l border-white/30 bg-white/60 backdrop-blur-md">
                <div className="sticky top-8">
                    {/* 트렌딩 토픽 */}
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold mb-4 flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            <Hash className="w-5 h-5 mr-2 text-indigo-500" />
                            트렌딩 토픽
                        </h2>
                        <div className="space-y-3">
                            {trendingTopics.map((topic) => (
                                <div
                                    key={topic.tag}
                                    className="flex justify-between items-center p-3 hover:bg-white/50 rounded-xl text-gray-700 transition-colors border border-white/20"
                                >
                                    <span className="font-medium">#{topic.tag}</span>
                                    <span className="text-sm text-gray-500">{topic.posts.toLocaleString()} posts</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 규칙 */}
                    <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-md border border-white/30">
                        <h2 className="text-lg font-semibold mb-4 flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            <Users className="w-5 h-5 mr-2 text-indigo-500" />
                            커뮤니티 규칙
                        </h2>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li className="flex items-start">
                                <div className="w-1.5 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mt-2 mr-3" />
                                서로 존중하는 언어 사용
                            </li>
                            <li className="flex items-start">
                                <div className="w-1.5 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mt-2 mr-3" />
                                주제와 관련 없는 광고 금지
                            </li>
                            <li className="flex items-start">
                                <div className="w-1.5 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mt-2 mr-3" />
                                지식 공유를 위한 건강한 토론
                            </li>
                        </ul>
                    </section>
                </div>
            </aside>
        </div>
    )
}
