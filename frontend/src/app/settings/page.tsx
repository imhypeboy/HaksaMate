"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, User, Globe, Lock, Save, LogOut } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { fetchProfile, updateProfile } from "@/lib/profile"

export default function SettingsPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("profile")
    const [saving, setSaving] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    // 최근 10년치 입학년도 리스트 (올해~10년 전)
    const currentYear = new Date().getFullYear()
    const admissionYears = Array.from({ length: 10 }, (_, i) => String(currentYear - i))

    // 프로필 상태
    const [profileSettings, setProfileSettings] = useState({
        name: "",
        email: "",
        department: "",
        studentId: "",
        year: String(currentYear),
        profile_image_url: "",
    })

    // 기타 세팅 (알림, 일반 등은 로컬상태)
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        scheduleReminders: true,
        deadlineAlerts: true,
        systemUpdates: false,
    })
    const [generalSettings, setGeneralSettings] = useState({
        language: "ko",
        autoSave: true,
    })

    // 인증 및 프로필 불러오기
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/auth/login")
                return
            }
            setUserId(user.id)
            try {
                const profile = await fetchProfile(user.id)
                setProfileSettings({
                    name: profile?.name || "",
                    email: profile?.email || "",
                    department: profile?.department || "",
                    studentId: profile?.student_id || "",
                    year: profile?.year || String(currentYear),
                    profile_image_url: profile?.profile_image_url || "",
                })
            } catch (e) {
                // 최초 로그인시 row 없으면 insert 필요 → upsert로 해결
            }
        }
        init()
        // eslint-disable-next-line
    }, [router])

    // 저장
    const handleSave = async () => {
        setSaving(true)
        try {
            if (!userId) return
            await updateProfile(userId, profileSettings)
            alert("설정이 저장되었습니다.")
        } catch (e: any) {
            alert(e.message || "설정 저장 실패")
        }
        setSaving(false)
    }

    const handleLogout = async () => {
        if (window.confirm("로그아웃 하시겠습니까?")) {
            await supabase.auth.signOut()
            router.push("/auth/login")
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 text-gray-900">
            <header className="bg-white/20 backdrop-blur-md text-gray-800 py-4 px-6 flex items-center shadow-lg border-b border-white/30">
                <button
                    onClick={() => router.push("/")}
                    className="mr-4 hover:bg-white/20 p-2 rounded-full transition-colors backdrop-blur-sm"
                    aria-label="뒤로 가기"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    설정
                </h1>
            </header>
            <div className="max-w-5xl mx-auto py-8 px-4">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* 사이드 탭 */}
                    <div className="md:w-1/4">
                        <nav className="bg-white/60 backdrop-blur-md rounded-2xl p-4 sticky top-8 shadow-lg border border-white/30">
                            <ul className="space-y-1">
                                <li>
                                    <button onClick={() => setActiveTab("profile")}
                                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center transition-all ${
                                                activeTab === "profile"
                                                    ? "bg-gradient-to-r from-indigo-100/80 to-purple-100/80 text-indigo-700 backdrop-blur-sm shadow-md"
                                                    : "hover:bg-white/40 backdrop-blur-sm"
                                            }`}>
                                        <User className="h-5 w-5 mr-3" />
                                        <span>프로필 설정</span>
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => setActiveTab("notifications")}
                                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center transition-all ${
                                                activeTab === "notifications"
                                                    ? "bg-gradient-to-r from-indigo-100/80 to-purple-100/80 text-indigo-700 backdrop-blur-sm shadow-md"
                                                    : "hover:bg-white/40 backdrop-blur-sm"
                                            }`}>
                                        <Bell className="h-5 w-5 mr-3" />
                                        <span>알림 설정</span>
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => setActiveTab("general")}
                                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center transition-all ${
                                                activeTab === "general"
                                                    ? "bg-gradient-to-r from-indigo-100/80 to-purple-100/80 text-indigo-700 backdrop-blur-sm shadow-md"
                                                    : "hover:bg-white/40 backdrop-blur-sm"
                                            }`}>
                                        <Globe className="h-5 w-5 mr-3" />
                                        <span>일반 설정</span>
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => setActiveTab("security")}
                                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center transition-all ${
                                                activeTab === "security"
                                                    ? "bg-gradient-to-r from-indigo-100/80 to-purple-100/80 text-indigo-700 backdrop-blur-sm shadow-md"
                                                    : "hover:bg-white/40 backdrop-blur-sm"
                                            }`}>
                                        <Lock className="h-5 w-5 mr-3" />
                                        <span>보안 설정</span>
                                    </button>
                                </li>
                                <li className="pt-4 mt-4 border-t">
                                    <button onClick={handleLogout}
                                            className="w-full text-left px-4 py-3 rounded-md flex items-center text-red-600 hover:bg-red-50">
                                        <LogOut className="h-5 w-5 mr-3" />
                                        <span>로그아웃</span>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                    {/* 메인 설정 패널 */}
                    <div className="md:w-3/4 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6">
                        {activeTab === "profile" && (
                            <div>
                                <h2 className="text-xl font-bold mb-6">프로필 설정</h2>
                                <div className="space-y-4">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="w-full md:w-1/2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                                            <input
                                                type="text"
                                                className="w-full border border-white/30 rounded-xl px-3 py-2 bg-white/60 backdrop-blur-sm focus:bg-white/80 transition-all"
                                                value={profileSettings.name}
                                                onChange={(e) => setProfileSettings({ ...profileSettings, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="w-full md:w-1/2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                                            <input
                                                type="email"
                                                className="w-full border border-white/30 rounded-xl px-3 py-2 bg-white/60 backdrop-blur-sm focus:bg-white/80 transition-all"
                                                value={profileSettings.email}
                                                onChange={(e) => setProfileSettings({ ...profileSettings, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="w-full md:w-1/2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">학과</label>
                                            <input
                                                type="text"
                                                className="w-full border border-white/30 rounded-xl px-3 py-2 bg-white/60 backdrop-blur-sm focus:bg-white/80 transition-all"
                                                value={profileSettings.department}
                                                onChange={(e) => setProfileSettings({ ...profileSettings, department: e.target.value })}
                                            />
                                        </div>
                                        <div className="w-full md:w-1/2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">입학년도</label>
                                            <select
                                                className="w-full border border-white/30 rounded-xl px-3 py-2 bg-white/60 backdrop-blur-sm focus:bg-white/80 transition-all"
                                                value={profileSettings.year}
                                                onChange={(e) => setProfileSettings({ ...profileSettings, year: e.target.value })}
                                            >
                                                {admissionYears.map((year) => (
                                                    <option key={year} value={year}>{year}년</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">학번</label>
                                        <input
                                            type="text"
                                            className="w-full border border-white/30 rounded-xl px-3 py-2 bg-white/60 backdrop-blur-sm focus:bg-white/80 transition-all"
                                            value={profileSettings.studentId}
                                            onChange={(e) => setProfileSettings({ ...profileSettings, studentId: e.target.value })}
                                        />
                                    </div>
                                    {/* 프로필 사진 추가 필요 시 profile_image_url 연동 */}
                                    {/* <div className="mt-4"> ... </div> */}
                                </div>
                            </div>
                        )}

                        {activeTab === "notifications" && (
                            <div>
                                <h2 className="text-xl font-bold mb-6">알림 설정</h2>
                                {/* ... 이하 기존코드 동일 ... */}
                            </div>
                        )}

                        {activeTab === "general" && (
                            <div>
                                <h2 className="text-xl font-bold mb-6">일반 설정</h2>
                                {/* ... 이하 기존코드 동일 ... */}
                            </div>
                        )}

                        {activeTab === "security" && (
                            <div>
                                <h2 className="text-xl font-bold mb-6">보안 설정</h2>
                                {/* ... 이하 기존코드 동일 ... */}
                            </div>
                        )}

                        <div className="mt-8 pt-4 border-t flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                            >
                                {saving ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                             xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor"
                                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        저장 중...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        설정 저장
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
