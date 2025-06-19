"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import {
  MessageSquare,
  Users,
  Hash,
  MessageCircle,
  Share,
  Trash2,
  Plus,
  Sparkles,
  TrendingUp,
  FlameIcon as Fire,
  Heart,
  Send,
  ImageIcon,
  Smile,
  MoreHorizontal,
  Search,
  Bell,
  Bookmark,
  X,
} from "lucide-react"
import Sidebar from "../sidebar/sidebar"
import {
  fetchPosts,
  createPost,
  deletePost,
  fetchUserLikedPostIds,
  likePost,
  unlikePost,
  fetchComments,
  createComment,
  deleteComment,
} from "@/lib/community"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

interface Post {
  id: number
  author_id: string
  author_username: string
  content: string
  tags: string[]
  likes: number
  created_at: string
}

interface Comment {
  id: number
  post_id: number
  author_id: string
  author_username: string
  content: string
  created_at: string
}

export default function CommunityPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "following">("all")
  const [newPost, setNewPost] = useState("")
  const [posts, setPosts] = useState<Post[]>([])
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState<string>("")
  const [likedPostIds, setLikedPostIds] = useState<number[]>([])
  const [comments, setComments] = useState<Record<number, Comment[]>>({})
  const [newComment, setNewComment] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [showNewPostForm, setShowNewPostForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  // 트렌딩 토픽 데이터 메모이제이션
  const trendingTopics = useMemo(
    () => [
      { tag: "webdev", posts: 2345, trend: "up", color: "from-blue-400 to-cyan-400", emoji: "💻" },
      { tag: "react", posts: 1890, trend: "up", color: "from-purple-400 to-pink-400", emoji: "⚛️" },
      { tag: "typescript", posts: 1567, trend: "stable", color: "from-indigo-400 to-blue-400", emoji: "📘" },
      { tag: "nextjs", posts: 1234, trend: "up", color: "from-green-400 to-emerald-400", emoji: "🚀" },
      { tag: "javascript", posts: 987, trend: "down", color: "from-yellow-400 to-orange-400", emoji: "⚡" },
    ],
    [],
  )

  const communityRules = useMemo(
    () => [
      { icon: "🤝", title: "서로 존중하는 언어 사용", desc: "모든 구성원을 배려하는 대화" },
      { icon: "🚫", title: "스팸 및 광고 금지", desc: "주제와 관련 없는 홍보 금지" },
      { icon: "💡", title: "건설적인 토론 문화", desc: "지식 공유와 학습을 위한 소통" },
      { icon: "🔒", title: "개인정보 보호", desc: "타인의 프라이버시 존중" },
    ],
    [],
  )

  // 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          router.push("/auth/login")
          return
        }
        setUser(session.user)

        const { data, error } = await supabase.from("profiles").select("nickname").eq("id", session.user.id).single()

        if (!error && data) {
          setUsername(data.nickname)
        } else {
          setUsername(session.user.email?.split("@")[0] || "사용자")
        }

        const liked = await fetchUserLikedPostIds(session.user.id)
        setLikedPostIds(liked)
      } catch (error) {
        console.error("Auth check failed:", error)
      }
    }

    checkAuth()
    loadPosts()
  }, [router])

  // 게시글 로드
  const loadPosts = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchPosts()
      setPosts(data)

      // 댓글 로드 최적화
      const commentsData: Record<number, Comment[]> = {}
      await Promise.all(
        data.map(async (post) => {
          try {
            const postComments = await fetchComments(post.id)
            commentsData[post.id] = postComments
          } catch (error) {
            console.error(`Failed to fetch comments for post ${post.id}:`, error)
            commentsData[post.id] = []
          }
        }),
      )
      setComments(commentsData)
    } catch (error) {
      console.error("Failed to load posts:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 게시글 생성
  const handleCreatePost = useCallback(async () => {
    if (!newPost.trim() || !user || isCreatingPost) return

    setIsCreatingPost(true)
    try {
      await createPost({
        author_id: user.id,
        author_username: username,
        content: newPost.trim(),
        tags: [],
      })
      setNewPost("")
      setShowNewPostForm(false)
      await loadPosts()
    } catch (error) {
      console.error("Failed to create post:", error)
      alert("게시글 등록에 실패했습니다.")
    } finally {
      setIsCreatingPost(false)
    }
  }, [newPost, user, username, isCreatingPost, loadPosts])

  // 게시글 삭제
  const handleDeletePost = useCallback(
    async (id: number) => {
      if (!user) return
      if (!window.confirm("정말 삭제하시겠습니까?")) return

      try {
        await deletePost(id, user.id)
        await loadPosts()
      } catch (error) {
        console.error("Failed to delete post:", error)
        alert("게시글 삭제에 실패했습니다.")
      }
    },
    [user, loadPosts],
  )

  // 좋아요 토글
  const handleLike = useCallback(
    async (postId: number) => {
      if (!user) {
        alert("로그인이 필요합니다.")
        return
      }

      try {
        if (likedPostIds.includes(postId)) {
          await unlikePost(postId, user.id)
          setLikedPostIds((prev) => prev.filter((id) => id !== postId))
        } else {
          await likePost(postId, user.id)
          setLikedPostIds((prev) => [...prev, postId])
        }
        await loadPosts()
      } catch (error) {
        console.error("Failed to toggle like:", error)
        alert("좋아요 처리에 실패했습니다.")
      }
    },
    [user, likedPostIds, loadPosts],
  )

  // 댓글 추가
  const handleAddComment = useCallback(
    async (postId: number) => {
      if (!user) {
        alert("로그인이 필요합니다.")
        return
      }

      const content = newComment[postId]?.trim()
      if (!content) return

      try {
        await createComment({
          post_id: postId,
          author_id: user.id,
          author_username: username,
          content,
        })
        setNewComment((prev) => ({ ...prev, [postId]: "" }))

        const postComments = await fetchComments(postId)
        setComments((prev) => ({ ...prev, [postId]: postComments }))
        await loadPosts()
      } catch (error) {
        console.error("Failed to add comment:", error)
        alert("댓글 등록에 실패했습니다.")
      }
    },
    [user, username, newComment, loadPosts],
  )

  // 댓글 삭제
  const handleDeleteComment = useCallback(
    async (commentId: number, postId: number) => {
      if (!user) return

      try {
        await deleteComment(commentId, user.id)
        const postComments = await fetchComments(postId)
        setComments((prev) => ({ ...prev, [postId]: postComments }))
        await loadPosts()
      } catch (error) {
        console.error("Failed to delete comment:", error)
        alert("댓글 삭제에 실패했습니다.")
      }
    },
    [user, loadPosts],
  )

  // 필터링된 게시글
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => (searchQuery ? post.content.toLowerCase().includes(searchQuery.toLowerCase()) : true))
  }, [posts, searchQuery])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* 배경 장식 요소들 - 성능 최적화 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/10 to-orange-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/5 to-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="flex relative z-10">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* 메인 컨텐츠 영역 - 레이아웃 개선 */}
        <div className={`flex-1 transition-all duration-300 ease-out ${sidebarOpen ? "md:ml-[280px]" : "ml-0"}`}>
          {/* 개선된 헤더 */}
          <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg shadow-black/5">
            <div className="py-3 px-4 md:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                    대학생 커뮤니티
                  </h1>
                </div>

                {/* 헤더 액션 버튼들 */}
                <div className="flex items-center gap-2">
                  {/* 모바일 검색 토글 */}
                  <button
                    onClick={() => setShowMobileSearch(!showMobileSearch)}
                    className="md:hidden p-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/80 transition-all duration-200"
                  >
                    <Search className="w-5 h-5 text-slate-600" />
                  </button>

                  {/* 데스크톱 검색바 */}
                  <div className="hidden md:flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="게시글 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 w-64 bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:bg-white/80 transition-all duration-300"
                      />
                    </div>
                    <button className="p-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/80 transition-all duration-200">
                      <Bell className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 모바일 검색바 */}
              {showMobileSearch && (
                <div className="md:hidden mt-3 animate-in slide-in-from-top duration-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="게시글 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10 py-3 w-full bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:bg-white/80 transition-all duration-300"
                    />
                    <button
                      onClick={() => setShowMobileSearch(false)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </header>

          <div className="flex">
            {/* 메인 컨텐츠 - 개선된 레이아웃 */}
            <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
              {/* 탭 네비게이션 - 개선된 디자인 */}
              <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-xl shadow-black/5 border border-white/20 p-4 md:p-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <nav className="flex bg-white/50 backdrop-blur-sm rounded-2xl p-1 border border-white/30 w-full md:w-auto">
                    {(["all", "popular", "following"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                          activeTab === tab
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                            : "text-slate-600 hover:text-slate-800 hover:bg-white/60"
                        }`}
                      >
                        {tab === "all" && (
                          <>
                            <Hash className="w-4 h-4" />
                            <span className="hidden sm:inline">전체</span>
                          </>
                        )}
                        {tab === "popular" && (
                          <>
                            <Fire className="w-4 h-4" />
                            <span className="hidden sm:inline">인기</span>
                          </>
                        )}
                        {tab === "following" && (
                          <>
                            <Heart className="w-4 h-4" />
                            <span className="hidden sm:inline">팔로잉</span>
                          </>
                        )}
                      </button>
                    ))}
                  </nav>

                  {user && (
                    <button
                      onClick={() => setShowNewPostForm(!showNewPostForm)}
                      className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="h-4 w-4" />새 글 작성
                    </button>
                  )}
                </div>

                {/* 새 글 작성 폼 - 개선된 UI */}
                {showNewPostForm && user && (
                  <div className="border-t border-white/20 pt-6 animate-in slide-in-from-top duration-300">
                    <div className="relative">
                      <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="새로운 주제를 시작해보세요... ✨"
                        className="w-full p-4 md:p-6 border-0 rounded-2xl resize-none bg-white/70 backdrop-blur-sm text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:bg-white/90 transition-all duration-300 shadow-inner"
                        rows={4}
                      />
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <button className="p-2 rounded-xl bg-white/60 hover:bg-white/80 text-slate-600 hover:text-slate-800 transition-all duration-200">
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-xl bg-white/60 hover:bg-white/80 text-slate-600 hover:text-slate-800 transition-all duration-200">
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end items-center mt-4 gap-3">
                      <button
                        onClick={() => {
                          setShowNewPostForm(false)
                          setNewPost("")
                        }}
                        className="w-full sm:w-auto px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors duration-200"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleCreatePost}
                        disabled={!newPost.trim() || isCreatingPost}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-2xl shadow-lg shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex items-center justify-center gap-2"
                      >
                        {isCreatingPost ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            게시 중...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            게시하기
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 게시글 목록 - 개선된 로딩 및 빈 상태 */}
              <div className="space-y-6">
                {isLoading ? (
                  <div className="text-center py-16">
                    <div className="relative mx-auto w-16 h-16">
                      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                      <div
                        className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"
                        style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
                      ></div>
                    </div>
                    <p className="mt-4 text-slate-600 font-medium">게시글을 불러오는 중...</p>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-xl shadow-black/5 border border-white/20 p-12 md:p-16 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="w-12 h-12 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      {searchQuery ? "검색 결과가 없습니다" : "아직 게시글이 없습니다"}
                    </h3>
                    <p className="text-slate-600">
                      {searchQuery ? "다른 키워드로 검색해보세요" : "첫 번째 게시글을 작성해보세요! ✨"}
                    </p>
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <article
                      key={post.id}
                      className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-xl shadow-black/5 border border-white/20 p-6 md:p-8 hover:shadow-2xl hover:shadow-black/10 transition-all duration-500 hover:scale-[1.01] group"
                    >
                      {/* 게시글 헤더 - 개선된 레이아웃 */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start gap-4">
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                              <span className="text-white font-bold text-lg">
                                {post.author_username[0]?.toUpperCase()}
                              </span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-800 text-lg truncate">{post.author_username}</h3>
                            <p className="text-sm text-slate-500 flex items-center gap-1">
                              <span>{new Date(post.created_at).toLocaleString("ko-KR")}</span>
                              <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                              <span>공개</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {user && user.id === post.author_id && (
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button className="p-2 rounded-xl bg-white/60 hover:bg-white/80 text-slate-600 hover:text-slate-800 transition-all duration-200 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 게시글 내용 */}
                      <div className="mb-6">
                        <p className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap break-words">
                          {post.content}
                        </p>
                      </div>

                      {/* 태그 */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex gap-2 mb-6 flex-wrap">
                          {post.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-sm rounded-full border border-blue-200/50 hover:from-blue-200 hover:to-purple-200 transition-all duration-200 cursor-pointer"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 액션 버튼 - 개선된 반응형 */}
                      <div className="flex items-center justify-between mb-6 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30">
                        <div className="flex items-center gap-3 md:gap-4">
                          <button
                            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl transition-all duration-300 ${
                              likedPostIds.includes(post.id)
                                ? "bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg shadow-pink-500/25"
                                : "bg-white/60 hover:bg-white/80 text-slate-600 hover:text-pink-500"
                            }`}
                            onClick={() => handleLike(post.id)}
                          >
                            <Heart className={`w-4 h-4 ${likedPostIds.includes(post.id) ? "fill-current" : ""}`} />
                            <span className="font-semibold text-sm md:text-base">{post.likes}</span>
                          </button>
                          <button className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-white/60 hover:bg-white/80 text-slate-600 hover:text-blue-500 transition-all duration-200">
                            <MessageCircle className="w-4 h-4" />
                            <span className="font-semibold text-sm md:text-base">{comments[post.id]?.length ?? 0}</span>
                          </button>
                          <button className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-white/60 hover:bg-white/80 text-slate-600 hover:text-green-500 transition-all duration-200">
                            <Share className="w-4 h-4" />
                            <span className="hidden sm:inline font-semibold text-sm md:text-base">공유</span>
                          </button>
                        </div>
                        <button className="p-2 rounded-xl bg-white/60 hover:bg-white/80 text-slate-600 hover:text-yellow-500 transition-all duration-200">
                          <Bookmark className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 댓글 섹션 - 개선된 UI */}
                      <div className="space-y-4">
                        {(comments[post.id] || []).map((comment: Comment) => (
                          <div
                            key={comment.id}
                            className="flex items-start gap-3 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30"
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-xs">
                                {comment.author_username[0]?.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-slate-800 text-sm truncate">
                                  {comment.author_username}
                                </span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-xs text-slate-500">
                                    {new Date(comment.created_at).toLocaleString("ko-KR")}
                                  </span>
                                  {user && user.id === comment.author_id && (
                                    <button
                                      onClick={() => handleDeleteComment(comment.id, post.id)}
                                      className="text-red-400 hover:text-red-600 transition-colors duration-200"
                                      title="댓글 삭제"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-slate-700 break-words">{comment.content}</p>
                            </div>
                          </div>
                        ))}

                        {/* 댓글 작성 - 개선된 반응형 */}
                        {user && (
                          <div className="flex items-start gap-3 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-xs">{username[0]?.toUpperCase()}</span>
                            </div>
                            <div className="flex-1 flex flex-col sm:flex-row gap-2">
                              <input
                                className="flex-1 px-4 py-3 rounded-xl border-0 bg-white/70 backdrop-blur-sm text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:bg-white/90 transition-all duration-300"
                                type="text"
                                placeholder="댓글을 입력하세요... 💭"
                                value={newComment[post.id] || ""}
                                onChange={(e) => setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleAddComment(post.id)
                                }}
                              />
                              <button
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 md:px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-blue-500/25 hover:scale-105 flex-shrink-0"
                                onClick={() => handleAddComment(post.id)}
                              >
                                등록
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </main>

            {/* 오른쪽 사이드바 - 개선된 반응형 */}
            <aside className="hidden xl:block w-80 p-6 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                {/* 트렌딩 토픽 - 개선된 디자인 */}
                <section className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-xl shadow-black/5 border border-white/20 p-6">
                  <h2 className="text-lg font-bold mb-6 flex items-center text-slate-800">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center mr-3">
                      <Hash className="w-4 h-4 text-white" />
                    </div>
                    트렌딩 토픽
                  </h2>
                  <div className="space-y-3">
                    {trendingTopics.map((topic, index) => (
                      <div
                        key={topic.tag}
                        className="group p-4 hover:bg-white/60 rounded-2xl transition-all duration-300 cursor-pointer border border-white/20 hover:border-white/40 hover:shadow-lg hover:shadow-black/5"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{topic.emoji}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800">#{topic.tag}</span>
                                {topic.trend === "up" && <TrendingUp className="w-3 h-3 text-green-500" />}
                                {topic.trend === "down" && <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />}
                              </div>
                              <div className="text-xs text-slate-400">
                                {index === 0 && "🔥 급상승 중"}
                                {index === 1 && "⭐ 인기 급상승"}
                                {index === 2 && "💎 꾸준한 인기"}
                                {index === 3 && "🚀 새로운 트렌드"}
                                {index === 4 && "📈 관심 증가"}
                              </div>
                            </div>
                          </div>
                          <span className="text-sm text-slate-500 font-medium">{topic.posts.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 커뮤니티 규칙 - 개선된 디자인 */}
                <section className="backdrop-blur-xl bg-gradient-to-br from-blue-50/80 to-purple-50/80 rounded-3xl shadow-xl shadow-black/5 border border-white/20 p-6">
                  <h2 className="text-lg font-bold mb-6 flex items-center text-slate-800">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    커뮤니티 규칙
                  </h2>
                  <ul className="space-y-4 text-sm text-slate-700">
                    {communityRules.map((rule, index) => (
                      <li
                        key={index}
                        className="p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/70 transition-all duration-200"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg flex-shrink-0">{rule.icon}</span>
                          <div>
                            <div className="font-semibold text-slate-800 mb-1">{rule.title}</div>
                            <div className="text-xs text-slate-600">{rule.desc}</div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
