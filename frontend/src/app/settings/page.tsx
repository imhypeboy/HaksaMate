"use client"

import type React from "react"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Bell,
  User,
  Globe,
  Lock,
  Save,
  LogOut,
  Camera,
  Shield,
  Eye,
  Smartphone,
  Mail,
  Languages,
  Palette,
  Moon,
  Sun,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { fetchProfile, updateProfile } from "@/lib/profile"

// 타입 정의
interface ProfileSettings {
  name: string
  email: string
  department: string
  studentId: string
  year: string
  profile_image_url: string
  bio?: string
  phone?: string
}

interface NotificationSettings {
  emailNotifications: boolean
  scheduleReminders: boolean
  deadlineAlerts: boolean
  systemUpdates: boolean
  pushNotifications: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
}

interface GeneralSettings {
  language: string
  theme: "light" | "dark" | "system"
  autoSave: boolean
  compactMode: boolean
  animationsEnabled: boolean
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeout: number
  loginNotifications: boolean
  dataExportEnabled: boolean
}

// 상수 정의
const DEPARTMENTS = [
  "컴퓨터공학과",
  "전자공학과",
  "기계공학과",
  "화학공학과",
  "경영학과",
  "경제학과",
  "심리학과",
  "영어영문학과",
  "수학과",
  "물리학과",
]

const LANGUAGES = [
  { code: "ko", name: "한국어" },
  { code: "en", name: "English" },
  { code: "ja", name: "日本語" },
  { code: "zh", name: "中文" },
]

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info"
    message: string
  } | null>(null)

  // 현재 연도 기준 입학년도 리스트
  const currentYear = new Date().getFullYear()
  const admissionYears = useMemo(() => Array.from({ length: 15 }, (_, i) => String(currentYear - i)), [currentYear])

  // 상태 관리
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    name: "",
    email: "",
    department: "",
    studentId: "",
    year: String(currentYear),
    profile_image_url: "",
    bio: "",
    phone: "",
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    scheduleReminders: true,
    deadlineAlerts: true,
    systemUpdates: false,
    pushNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
  })

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    language: "ko",
    theme: "system",
    autoSave: true,
    compactMode: false,
    animationsEnabled: true,
  })

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginNotifications: true,
    dataExportEnabled: true,
  })

  // 알림 표시 함수
  const showNotification = useCallback((type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        setUserId(user.id)

        // 프로필 데이터 로드
        const profile = await fetchProfile(user.id)
        if (profile) {
          setProfileSettings({
            name: profile.name || "",
            email: profile.email || user.email || "",
            department: profile.department || "",
            studentId: profile.student_id || "",
            year: profile.year || String(currentYear),
            profile_image_url: profile.profile_image_url || "",
            bio: profile.bio || "",
            phone: profile.phone || "",
          })
        }

        // 로컬 스토리지에서 설정 로드
        const savedNotifications = localStorage.getItem("notificationSettings")
        const savedGeneral = localStorage.getItem("generalSettings")
        const savedSecurity = localStorage.getItem("securitySettings")

        if (savedNotifications) {
          setNotificationSettings(JSON.parse(savedNotifications))
        }
        if (savedGeneral) {
          setGeneralSettings(JSON.parse(savedGeneral))
        }
        if (savedSecurity) {
          setSecuritySettings(JSON.parse(savedSecurity))
        }
      } catch (error) {
        console.error("초기화 오류:", error)
        showNotification("error", "설정을 불러오는 중 오류가 발생했습니다.")
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [router, currentYear, showNotification])

  // 프로필 저장
  const handleSaveProfile = useCallback(async () => {
    if (!userId) return

    // 유효성 검사
    if (!profileSettings.name.trim()) {
      showNotification("error", "이름을 입력해주세요.")
      return
    }
    if (!profileSettings.email.trim()) {
      showNotification("error", "이메일을 입력해주세요.")
      return
    }

    setSaving(true)
    try {
      await updateProfile(userId, {
        ...profileSettings,
        student_id: profileSettings.studentId,
      })
      showNotification("success", "프로필이 성공적으로 저장되었습니다.")
    } catch (error: any) {
      console.error("프로필 저장 오류:", error)
      showNotification("error", error.message || "프로필 저장에 실패했습니다.")
    } finally {
      setSaving(false)
    }
  }, [userId, profileSettings, showNotification])

  // 설정 저장 (로컬 스토리지)
  const handleSaveSettings = useCallback(() => {
    try {
      localStorage.setItem("notificationSettings", JSON.stringify(notificationSettings))
      localStorage.setItem("generalSettings", JSON.stringify(generalSettings))
      localStorage.setItem("securitySettings", JSON.stringify(securitySettings))
      showNotification("success", "설정이 저장되었습니다.")
    } catch (error) {
      showNotification("error", "설정 저장에 실패했습니다.")
    }
  }, [notificationSettings, generalSettings, securitySettings, showNotification])

  // 로그아웃
  const handleLogout = useCallback(async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      try {
        await supabase.auth.signOut()
        router.push("/auth/login")
      } catch (error) {
        showNotification("error", "로그아웃 중 오류가 발생했습니다.")
      }
    }
  }, [router, showNotification])

  // 프로필 이미지 업로드
  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file || !userId) return

      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification("error", "파일 크기는 5MB 이하여야 합니다.")
        return
      }

      try {
        const fileExt = file.name.split(".").pop()
        const fileName = `${userId}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage.from("profile-images").upload(fileName, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from("profile-images").getPublicUrl(fileName)

        setProfileSettings((prev) => ({
          ...prev,
          profile_image_url: data.publicUrl,
        }))

        showNotification("success", "프로필 이미지가 업로드되었습니다.")
      } catch (error: any) {
        showNotification("error", "이미지 업로드에 실패했습니다.")
      }
    },
    [userId, showNotification],
  )

  // 데이터 내보내기
  const handleDataExport = useCallback(async () => {
    try {
      const exportData = {
        profile: profileSettings,
        notifications: notificationSettings,
        general: generalSettings,
        security: { ...securitySettings, twoFactorEnabled: false }, // 보안상 제외
        exportDate: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `settings-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showNotification("success", "설정이 내보내기되었습니다.")
    } catch (error) {
      showNotification("error", "데이터 내보내기에 실패했습니다.")
    }
  }, [profileSettings, notificationSettings, generalSettings, securitySettings, showNotification])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">설정을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 text-gray-900">
      {/* 알림 토스트 */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg backdrop-blur-md border transition-all duration-300 ${
            notification.type === "success"
              ? "bg-green-100/90 border-green-200 text-green-800"
              : notification.type === "error"
                ? "bg-red-100/90 border-red-200 text-red-800"
                : "bg-blue-100/90 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" && <CheckCircle2 className="h-5 w-5" />}
            {notification.type === "error" && <AlertCircle className="h-5 w-5" />}
            {notification.type === "info" && <AlertCircle className="h-5 w-5" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header className="bg-white/20 backdrop-blur-md text-gray-800 py-4 px-6 flex items-center justify-between shadow-lg border-b border-white/30 sticky top-0 z-40">
        <div className="flex items-center">
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
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={activeTab === "profile" ? handleSaveProfile : handleSaveSettings}
          disabled={saving}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all text-sm"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              저장 중...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              저장
            </>
          )}
        </button>
      </header>

      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 사이드바 네비게이션 */}
          <div className="lg:w-1/4">
            <nav className="bg-white/60 backdrop-blur-md rounded-2xl p-4 sticky top-24 shadow-lg border border-white/30">
              <ul className="space-y-2">
                {[
                  { id: "profile", icon: User, label: "프로필 설정" },
                  { id: "notifications", icon: Bell, label: "알림 설정" },
                  { id: "general", icon: Globe, label: "일반 설정" },
                  { id: "security", icon: Lock, label: "보안 설정" },
                ].map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl flex items-center transition-all ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-indigo-100/80 to-purple-100/80 text-indigo-700 backdrop-blur-sm shadow-md"
                          : "hover:bg-white/40 backdrop-blur-sm text-gray-700"
                      }`}
                    >
                      <tab.icon className="h-5 w-5 mr-3" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  </li>
                ))}

                <li className="pt-4 mt-4 border-t border-white/30">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-xl flex items-center text-red-600 hover:bg-red-50/60 backdrop-blur-sm transition-all"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span className="font-medium">로그아웃</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:w-3/4 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 min-h-[600px]">
            {/* 프로필 설정 */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">프로필 설정</h2>
                  <div className="text-sm text-gray-500">마지막 업데이트: {new Date().toLocaleDateString("ko-KR")}</div>
                </div>

                {/* 프로필 이미지 */}
                <div className="flex flex-col items-center space-y-4 p-6 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-xl border border-white/30">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center overflow-hidden shadow-lg">
                      {profileSettings.profile_image_url ? (
                        <img
                          src={profileSettings.profile_image_url || "/placeholder.svg"}
                          alt="프로필"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-12 w-12 text-white" />
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200">
                      <Camera className="h-4 w-4 text-gray-600" />
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    클릭하여 프로필 사진을 변경하세요
                    <br />
                    <span className="text-xs text-gray-500">JPG, PNG 파일 (최대 5MB)</span>
                  </p>
                </div>

                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-white/30 rounded-xl px-4 py-3 bg-white/60 backdrop-blur-sm focus:bg-white/80 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      value={profileSettings.name}
                      onChange={(e) => setProfileSettings((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="이름을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      이메일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full border border-white/30 rounded-xl px-4 py-3 bg-white/60 backdrop-blur-sm focus:bg-white/80 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      value={profileSettings.email}
                      onChange={(e) => setProfileSettings((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="이메일을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">학과</label>
                    <select
                      className="w-full border border-white/30 rounded-xl px-4 py-3 bg-white/60 backdrop-blur-sm focus:bg-white/80 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      value={profileSettings.department}
                      onChange={(e) => setProfileSettings((prev) => ({ ...prev, department: e.target.value }))}
                    >
                      <option value="">학과를 선택하세요</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">입학년도</label>
                    <select
                      className="w-full border border-white/30 rounded-xl px-4 py-3 bg-white/60 backdrop-blur-sm focus:bg-white/80 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      value={profileSettings.year}
                      onChange={(e) => setProfileSettings((prev) => ({ ...prev, year: e.target.value }))}
                    >
                      {admissionYears.map((year) => (
                        <option key={year} value={year}>
                          {year}년
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">학번</label>
                    <input
                      type="text"
                      className="w-full border border-white/30 rounded-xl px-4 py-3 bg-white/60 backdrop-blur-sm focus:bg-white/80 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      value={profileSettings.studentId}
                      onChange={(e) => setProfileSettings((prev) => ({ ...prev, studentId: e.target.value }))}
                      placeholder="학번을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">전화번호</label>
                    <input
                      type="tel"
                      className="w-full border border-white/30 rounded-xl px-4 py-3 bg-white/60 backdrop-blur-sm focus:bg-white/80 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      value={profileSettings.phone}
                      onChange={(e) => setProfileSettings((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="전화번호를 입력하세요"
                    />
                  </div>
                </div>

                {/* 자기소개 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">자기소개</label>
                  <textarea
                    rows={4}
                    className="w-full border border-white/30 rounded-xl px-4 py-3 bg-white/60 backdrop-blur-sm focus:bg-white/80 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    value={profileSettings.bio}
                    onChange={(e) => setProfileSettings((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="자신을 소개해보세요..."
                    maxLength={500}
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">{profileSettings.bio?.length || 0}/500</div>
                </div>
              </div>
            )}

            {/* 알림 설정 */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">알림 설정</h2>

                <div className="space-y-4">
                  {/* 이메일 알림 */}
                  <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl p-4 border border-white/30">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-blue-600" />
                      이메일 알림
                    </h3>
                    <div className="space-y-3">
                      {[
                        {
                          key: "emailNotifications",
                          label: "이메일 알림 받기",
                          desc: "중요한 업데이트를 이메일로 받습니다",
                        },
                        { key: "scheduleReminders", label: "일정 알림", desc: "수업 및 시험 일정을 미리 알려드립니다" },
                        { key: "deadlineAlerts", label: "마감일 알림", desc: "과제 및 프로젝트 마감일을 알려드립니다" },
                        {
                          key: "systemUpdates",
                          label: "시스템 업데이트",
                          desc: "새로운 기능 및 시스템 변경사항을 알려드립니다",
                        },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800">{item.label}</div>
                            <div className="text-sm text-gray-600">{item.desc}</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationSettings[item.key as keyof NotificationSettings] as boolean}
                              onChange={(e) =>
                                setNotificationSettings((prev) => ({
                                  ...prev,
                                  [item.key]: e.target.checked,
                                }))
                              }
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 모바일 알림 */}
                  <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-xl p-4 border border-white/30">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Smartphone className="h-5 w-5 mr-2 text-green-600" />
                      모바일 알림
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: "pushNotifications", label: "푸시 알림", desc: "모바일 기기로 즉시 알림을 받습니다" },
                        { key: "soundEnabled", label: "알림 소리", desc: "알림 시 소리로 알려드립니다" },
                        { key: "vibrationEnabled", label: "진동 알림", desc: "알림 시 진동으로 알려드립니다" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800">{item.label}</div>
                            <div className="text-sm text-gray-600">{item.desc}</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationSettings[item.key as keyof NotificationSettings] as boolean}
                              onChange={(e) =>
                                setNotificationSettings((prev) => ({
                                  ...prev,
                                  [item.key]: e.target.checked,
                                }))
                              }
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 일반 설정 */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">일반 설정</h2>

                <div className="space-y-6">
                  {/* 언어 설정 */}
                  <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-xl p-4 border border-white/30">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Languages className="h-5 w-5 mr-2 text-purple-600" />
                      언어 및 지역
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">언어</label>
                      <select
                        className="w-full md:w-1/2 border border-white/30 rounded-xl px-4 py-3 bg-white/60 backdrop-blur-sm focus:bg-white/80 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        value={generalSettings.language}
                        onChange={(e) => setGeneralSettings((prev) => ({ ...prev, language: e.target.value }))}
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 테마 설정 */}
                  <div className="bg-gradient-to-r from-yellow-50/50 to-orange-50/50 rounded-xl p-4 border border-white/30">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Palette className="h-5 w-5 mr-2 text-orange-600" />
                      테마 설정
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">테마</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: "light", label: "라이트", icon: Sun },
                          { value: "dark", label: "다크", icon: Moon },
                          { value: "system", label: "시스템", icon: Globe },
                        ].map((theme) => (
                          <button
                            key={theme.value}
                            onClick={() => setGeneralSettings((prev) => ({ ...prev, theme: theme.value as any }))}
                            className={`p-3 rounded-xl border transition-all flex flex-col items-center space-y-2 ${
                              generalSettings.theme === theme.value
                                ? "border-orange-500 bg-orange-100/60 text-orange-700"
                                : "border-white/30 bg-white/40 hover:bg-white/60"
                            }`}
                          >
                            <theme.icon className="h-6 w-6" />
                            <span className="text-sm font-medium">{theme.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 기타 설정 */}
                  <div className="bg-gradient-to-r from-gray-50/50 to-slate-50/50 rounded-xl p-4 border border-white/30">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Globe className="h-5 w-5 mr-2 text-gray-600" />
                      기타 설정
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: "autoSave", label: "자동 저장", desc: "변경사항을 자동으로 저장합니다" },
                        { key: "compactMode", label: "컴팩트 모드", desc: "더 많은 정보를 한 화면에 표시합니다" },
                        { key: "animationsEnabled", label: "애니메이션 효과", desc: "부드러운 전환 효과를 사용합니다" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800">{item.label}</div>
                            <div className="text-sm text-gray-600">{item.desc}</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={generalSettings[item.key as keyof GeneralSettings] as boolean}
                              onChange={(e) =>
                                setGeneralSettings((prev) => ({
                                  ...prev,
                                  [item.key]: e.target.checked,
                                }))
                              }
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 보안 설정 */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">보안 설정</h2>

                <div className="space-y-6">
                  {/* 계정 보안 */}
                  <div className="bg-gradient-to-r from-red-50/50 to-rose-50/50 rounded-xl p-4 border border-white/30">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-red-600" />
                      계정 보안
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">2단계 인증</div>
                          <div className="text-sm text-gray-600">추가 보안 계층으로 계정을 보호합니다</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={securitySettings.twoFactorEnabled}
                            onChange={(e) =>
                              setSecuritySettings((prev) => ({
                                ...prev,
                                twoFactorEnabled: e.target.checked,
                              }))
                            }
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">세션 만료 시간 (분)</label>
                        <select
                          className="w-full md:w-1/2 border border-white/30 rounded-xl px-4 py-3 bg-white/60 backdrop-blur-sm focus:bg-white/80 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          value={securitySettings.sessionTimeout}
                          onChange={(e) =>
                            setSecuritySettings((prev) => ({
                              ...prev,
                              sessionTimeout: Number.parseInt(e.target.value),
                            }))
                          }
                        >
                          <option value={15}>15분</option>
                          <option value={30}>30분</option>
                          <option value={60}>1시간</option>
                          <option value={120}>2시간</option>
                          <option value={480}>8시간</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 개인정보 */}
                  <div className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-xl p-4 border border-white/30">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-blue-600" />
                      개인정보 관리
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">로그인 알림</div>
                          <div className="text-sm text-gray-600">새로운 기기에서 로그인 시 알림을 받습니다</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={securitySettings.loginNotifications}
                            onChange={(e) =>
                              setSecuritySettings((prev) => ({
                                ...prev,
                                loginNotifications: e.target.checked,
                              }))
                            }
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">데이터 내보내기</div>
                          <div className="text-sm text-gray-600">개인 데이터를 내보낼 수 있습니다</div>
                        </div>
                        <button
                          onClick={handleDataExport}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center transition-colors text-sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          내보내기
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 위험 구역 */}
                  <div className="bg-gradient-to-r from-red-100/50 to-pink-100/50 rounded-xl p-4 border border-red-200">
                    <h3 className="font-semibold text-red-800 mb-3 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      위험 구역
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-red-800">계정 삭제</div>
                          <div className="text-sm text-red-600">계정과 모든 데이터가 영구적으로 삭제됩니다</div>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm("정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                              showNotification("info", "계정 삭제 기능은 현재 개발 중입니다.")
                            }
                          }}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center transition-colors text-sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          계정 삭제
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>  
  )
}
