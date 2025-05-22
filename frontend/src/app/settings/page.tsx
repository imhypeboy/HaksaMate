"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, User, Globe, Lock, Save, LogOut } from "lucide-react"
import { isAuthenticated } from "@/lib/auth"
import { useEffect } from "react"

export default function SettingsPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("profile")
    const [saving, setSaving] = useState(false)

    // 프로필 설정 상태
    const [profileSettings, setProfileSettings] = useState({
        name: "홍길동",
        email: "student@university.ac.kr",
        department: "컴퓨터공학과",
        studentId: "2021123456",
        year: "3",
    })

    // 알림 설정 상태
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        scheduleReminders: true,
        deadlineAlerts: true,
        systemUpdates: false,
    })

    // 일반 설정 상태
    const [generalSettings, setGeneralSettings] = useState({
        language: "ko",
        darkMode: false,
        autoSave: true,
    })

    useEffect(() => {
        // 인증 상태 확인
        if (!isAuthenticated()) {
            router.push("/auth/login")
        }
    }, [router])

    const handleSave = async () => {
        setSaving(true)

        // 여기에 설정 저장 API 호출 로직 구현
        await new Promise((resolve) => setTimeout(resolve, 1000)) // 저장 시뮬레이션

        setSaving(false)
        alert("설정이 저장되었습니다.")
    }

    const handleLogout = () => {
        if (window.confirm("로그아웃 하시겠습니까?")) {
            // 로그아웃 로직 구현
            router.push("/auth/login")
        }
    }

    return (
        <div className="min-h-screen bg-white text-gray-900">
            <header className="bg-blue-700 text-white py-4 px-6 flex items-center shadow-md">
                <button
                    onClick={() => router.push("/")}
                    className="mr-4 hover:bg-blue-600 p-2 rounded-full transition-colors"
                    aria-label="뒤로 가기"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-xl font-bold">설정</h1>
            </header>

            <div className="max-w-5xl mx-auto py-8 px-4">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* 설정 탭 메뉴 */}
                    <div className="md:w-1/4">
                        <nav className="bg-gray-50 rounded-lg p-4 sticky top-8">
                            <ul className="space-y-1">
                                <li>
                                    <button
                                        onClick={() => setActiveTab("profile")}
                                        className={`w-full text-left px-4 py-3 rounded-md flex items-center ${
                                            activeTab === "profile" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                                        }`}
                                    >
                                        <User className="h-5 w-5 mr-3" />
                                        <span>프로필 설정</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setActiveTab("notifications")}
                                        className={`w-full text-left px-4 py-3 rounded-md flex items-center ${
                                            activeTab === "notifications" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                                        }`}
                                    >
                                        <Bell className="h-5 w-5 mr-3" />
                                        <span>알림 설정</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setActiveTab("general")}
                                        className={`w-full text-left px-4 py-3 rounded-md flex items-center ${
                                            activeTab === "general" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                                        }`}
                                    >
                                        <Globe className="h-5 w-5 mr-3" />
                                        <span>일반 설정</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setActiveTab("security")}
                                        className={`w-full text-left px-4 py-3 rounded-md flex items-center ${
                                            activeTab === "security" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                                        }`}
                                    >
                                        <Lock className="h-5 w-5 mr-3" />
                                        <span>보안 설정</span>
                                    </button>
                                </li>
                                <li className="pt-4 mt-4 border-t">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-3 rounded-md flex items-center text-red-600 hover:bg-red-50"
                                    >
                                        <LogOut className="h-5 w-5 mr-3" />
                                        <span>로그아웃</span>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>

                    {/* 설정 내용 */}
                    <div className="md:w-3/4 bg-white rounded-lg shadow-sm border p-6">
                        {activeTab === "profile" && (
                            <div>
                                <h2 className="text-xl font-bold mb-6">프로필 설정</h2>
                                <div className="space-y-4">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="w-full md:w-1/2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                                            <input
                                                type="text"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={profileSettings.name}
                                                onChange={(e) => setProfileSettings({ ...profileSettings, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="w-full md:w-1/2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                                            <input
                                                type="email"
                                                className="w-full border rounded-md px-3 py-2"
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
                                                className="w-full border rounded-md px-3 py-2"
                                                value={profileSettings.department}
                                                onChange={(e) => setProfileSettings({ ...profileSettings, department: e.target.value })}
                                            />
                                        </div>
                                        <div className="w-full md:w-1/2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">학년</label>
                                            <select
                                                className="w-full border rounded-md px-3 py-2"
                                                value={profileSettings.year}
                                                onChange={(e) => setProfileSettings({ ...profileSettings, year: e.target.value })}
                                            >
                                                <option value="1">1학년</option>
                                                <option value="2">2학년</option>
                                                <option value="3">3학년</option>
                                                <option value="4">4학년</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">학번</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-md px-3 py-2"
                                            value={profileSettings.studentId}
                                            onChange={(e) => setProfileSettings({ ...profileSettings, studentId: e.target.value })}
                                        />
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">프로필 사진</label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                                                <User className="h-10 w-10 text-blue-700" />
                                            </div>
                                            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm">사진 변경</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "notifications" && (
                            <div>
                                <h2 className="text-xl font-bold mb-6">알림 설정</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <h3 className="font-medium">이메일 알림</h3>
                                            <p className="text-sm text-gray-500">중요 공지 및 업데이트를 이메일로 받기</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={notificationSettings.emailNotifications}
                                                onChange={(e) =>
                                                    setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })
                                                }
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-t">
                                        <div>
                                            <h3 className="font-medium">일정 알림</h3>
                                            <p className="text-sm text-gray-500">수업 시작 전 알림 받기</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={notificationSettings.scheduleReminders}
                                                onChange={(e) =>
                                                    setNotificationSettings({ ...notificationSettings, scheduleReminders: e.target.checked })
                                                }
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-t">
                                        <div>
                                            <h3 className="font-medium">마감일 알림</h3>
                                            <p className="text-sm text-gray-500">과제 및 시험 마감일 알림 받기</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={notificationSettings.deadlineAlerts}
                                                onChange={(e) =>
                                                    setNotificationSettings({ ...notificationSettings, deadlineAlerts: e.target.checked })
                                                }
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-t">
                                        <div>
                                            <h3 className="font-medium">시스템 업데이트</h3>
                                            <p className="text-sm text-gray-500">시스템 업데이트 및 새로운 기능 알림</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={notificationSettings.systemUpdates}
                                                onChange={(e) =>
                                                    setNotificationSettings({ ...notificationSettings, systemUpdates: e.target.checked })
                                                }
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "general" && (
                            <div>
                                <h2 className="text-xl font-bold mb-6">일반 설정</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">언어</label>
                                        <select
                                            className="w-full border rounded-md px-3 py-2"
                                            value={generalSettings.language}
                                            onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                                        >
                                            <option value="ko">한국어</option>
                                            <option value="en">English</option>
                                            <option value="ja">日本語</option>
                                            <option value="zh">中文</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-t">
                                        <div>
                                            <h3 className="font-medium">자동 저장</h3>
                                            <p className="text-sm text-gray-500">변경사항 자동 저장</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={generalSettings.autoSave}
                                                onChange={(e) => setGeneralSettings({ ...generalSettings, autoSave: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "security" && (
                            <div>
                                <h2 className="text-xl font-bold mb-6">보안 설정</h2>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-medium mb-4">비밀번호 변경</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
                                                <input
                                                    type="password"
                                                    className="w-full border rounded-md px-3 py-2"
                                                    placeholder="현재 비밀번호 입력"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                                                <input
                                                    type="password"
                                                    className="w-full border rounded-md px-3 py-2"
                                                    placeholder="새 비밀번호 입력"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
                                                <input
                                                    type="password"
                                                    className="w-full border rounded-md px-3 py-2"
                                                    placeholder="새 비밀번호 다시 입력"
                                                />
                                            </div>
                                            <button className="mt-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md">
                                                비밀번호 변경
                                            </button>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <h3 className="font-medium mb-4">로그인 기록</h3>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium">서울, 대한민국</p>
                                                        <p className="text-sm text-gray-500">Chrome - Windows</p>
                                                    </div>
                                                    <p className="text-sm text-gray-500">오늘, 14:32</p>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t">
                                                    <div>
                                                        <p className="font-medium">서울, 대한민국</p>
                                                        <p className="text-sm text-gray-500">Safari - macOS</p>
                                                    </div>
                                                    <p className="text-sm text-gray-500">어제, 09:15</p>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t">
                                                    <div>
                                                        <p className="font-medium">서울, 대한민국</p>
                                                        <p className="text-sm text-gray-500">Chrome - Android</p>
                                                    </div>
                                                    <p className="text-sm text-gray-500">2023년 5월 20일</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 저장 버튼 */}
                        <div className="mt-8 pt-4 border-t flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
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
