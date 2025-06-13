"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Users, Hash, ThumbsUp, MessageCircle, Share, Menu, Trash2 } from "lucide-react";
import Sidebar from "@/app/sidebar/sidebar";
import {
    fetchPosts, createPost, deletePost,
    fetchUserLikedPostIds, likePost, unlikePost,
    fetchComments, createComment, deleteComment
} from "@/lib/community";
import { supabase } from "@/lib/supabaseClient";

export default function CommunityPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "popular" | "following">("all");
    const [newPost, setNewPost] = useState("");
    const [posts, setPosts] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [username, setUsername] = useState<string>("");
    const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
    const [comments, setComments] = useState<Record<number, any[]>>({});
    const [newComment, setNewComment] = useState<Record<number, string>>({});

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                const { data, error } = await supabase
                    .from('profiles')
                    .select('nickname')
                    .eq('id', user.id)
                    .single();
                if (!error && data) setUsername(data.nickname);
                // 좋아요 누른 게시글 불러오기
                const liked = await fetchUserLikedPostIds(user.id);
                setLikedPostIds(liked);
            }
        };
        getUser();
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const data = await fetchPosts();
            setPosts(data);
            // 게시글별 댓글 불러오기
            for (let post of data) {
                const postComments = await fetchComments(post.id);
                setComments(prev => ({ ...prev, [post.id]: postComments }));
            }
        } catch {
            alert("게시글 불러오기 실패");
        }
    };

    const handleCreatePost = async () => {
        if (!newPost.trim() || !user) return;
        try {
            await createPost({
                author_id: user.id,
                author_username: username,
                content: newPost.trim(),
                tags: [],
            });
            setNewPost("");
            await loadPosts();
        } catch {
            alert("글 등록 실패");
        }
    };

    const handleDeletePost = async (id: number) => {
        if (!user) return;
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            await deletePost(id, user.id);
            await loadPosts();
        } catch {
            alert("삭제 실패");
        }
    };

    // ----------- 좋아요 기능 ----------
    const handleLike = async (postId: number) => {
        if (!user) return alert("로그인 필요");
        if (likedPostIds.includes(postId)) {
            await unlikePost(postId, user.id);
            setLikedPostIds(likedPostIds.filter(id => id !== postId));
        } else {
            await likePost(postId, user.id);
            setLikedPostIds([...likedPostIds, postId]);
        }
        await loadPosts();
    };

    // ----------- 댓글 기능 -----------
    const handleAddComment = async (postId: number) => {
        if (!user) return alert("로그인 필요");
        const content = newComment[postId]?.trim();
        if (!content) return;
        await createComment({
            post_id: postId,
            author_id: user.id,
            author_username: username,
            content
        });
        setNewComment(prev => ({ ...prev, [postId]: "" }));
        // 댓글 다시 불러오기
        const postComments = await fetchComments(postId);
        setComments(prev => ({ ...prev, [postId]: postComments }));
        await loadPosts();
    };

    const handleDeleteComment = async (commentId: number, postId: number) => {
        if (!user) return;
        await deleteComment(commentId, user.id);
        // 댓글 다시 불러오기
        const postComments = await fetchComments(postId);
        setComments(prev => ({ ...prev, [postId]: postComments }));
        await loadPosts();
    };

    // ------------------------------
    const trendingTopics = [
        { tag: "webdev", posts: 2345 },
        { tag: "react", posts: 1890 },
        { tag: "typescript", posts: 1567 },
    ];

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 text-gray-900">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto">
                <header className="mb-8">
                    <div className="flex items-center mb-4">
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

                    {user && (
                        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 mb-6 border border-white/30 transition-all hover:shadow-xl">
                            <textarea
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                                placeholder="새로운 주제를 시작해보세요..."
                                className="w-full p-4 border border-white/30 rounded-xl resize-none bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-300 focus:border-transparent text-gray-900 transition-all"
                                rows={3}
                            />
                            <div className="flex justify-between items-center mt-4">
                                <div></div>
                                <button
                                    onClick={handleCreatePost}
                                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                                    disabled={!newPost.trim()}
                                >
                                    게시
                                </button>
                            </div>
                        </div>
                    )}

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

                <section className="space-y-6">
                    {posts.length === 0 && (
                        <div className="text-center text-gray-500 p-8">아직 게시글이 없습니다.</div>
                    )}
                    {posts.map((post) => (
                        <article
                            key={post.id}
                            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-white/30"
                        >
                            <div className="flex items-start mb-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mr-3 shadow-md">
                                    <span className="text-indigo-600 font-semibold">{post.author_username[0]}</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{post.author_username}</h3>
                                    <p className="text-sm text-gray-500">{new Date(post.created_at).toLocaleString("ko-KR")}</p>
                                </div>
                                {user && user.id === post.author_id && (
                                    <button
                                        onClick={() => handleDeletePost(post.id)}
                                        className="ml-auto text-red-500 hover:text-red-700"
                                        title="삭제"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-800 mb-4">{post.content}</p>
                            <div className="flex gap-2 mb-4">
                                {post.tags && post.tags.map((tag: string) => (
                                    <span
                                        key={tag}
                                        className="px-2 py-1 bg-gradient-to-r from-indigo-100/80 to-purple-100/80 backdrop-blur-sm text-indigo-700 text-sm rounded-full shadow-sm"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-6 text-gray-500 mb-2">
                                <button className={`flex items-center ${likedPostIds.includes(post.id) ? "text-indigo-600" : "hover:text-indigo-500"}`}
                                        onClick={() => handleLike(post.id)}>
                                    <ThumbsUp className="w-5 h-5 mr-1" />
                                    {post.likes}
                                </button>
                                <span className="flex items-center"><MessageCircle className="w-5 h-5 mr-1" />{comments[post.id]?.length ?? 0}</span>
                                <span className="flex items-center"><Share className="w-5 h-5 mr-1" /></span>
                            </div>
                            {/* ----------- 댓글 ------------ */}
                            <div className="mt-3">
                                <div className="space-y-2">
                                    {(comments[post.id] || []).map((comment: any) => (
                                        <div key={comment.id} className="flex items-start gap-2">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">{comment.author_username[0]}</div>
                                            <div className="bg-gray-50 px-3 py-2 rounded-xl">
                                                <div className="font-semibold text-gray-800">{comment.author_username}</div>
                                                <div className="text-gray-700">{comment.content}</div>
                                                <div className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString("ko-KR")}</div>
                                            </div>
                                            {user && user.id === comment.author_id && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id, post.id)}
                                                    className="ml-2 text-red-400 hover:text-red-700"
                                                    title="댓글 삭제"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {user && (
                                    <div className="flex items-center gap-2 mt-3">
                                        <input
                                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200"
                                            type="text"
                                            placeholder="댓글을 입력하세요"
                                            value={newComment[post.id] || ""}
                                            onChange={e => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                            onKeyDown={e => {
                                                if (e.key === "Enter") handleAddComment(post.id);
                                            }}
                                        />
                                        <button
                                            className="bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-600"
                                            onClick={() => handleAddComment(post.id)}
                                        >
                                            등록
                                        </button>
                                    </div>
                                )}
                            </div>
                        </article>
                    ))}
                </section>
            </main>

            <aside className="hidden lg:block w-80 p-8 border-l border-white/30 bg-white/60 backdrop-blur-md">
                <div className="sticky top-8">
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
    );
}
