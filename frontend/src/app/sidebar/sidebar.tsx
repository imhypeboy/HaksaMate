"use client"

import { Sidebar as ProSidebar, Menu, MenuItem } from "react-pro-sidebar"
import {
    Calendar,
    MessageSquare,
    Settings,
    X,
    MenuIcon,
    GraduationCap,
    BookOpen,
    UserCheck,
    Bot,
    Bell,
    Utensils,
    Bus,
    CreditCard
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"

interface SidebarProps {
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const isActive = (path: string) => pathname === path
    const [mounted, setMounted] = useState(false)

    // 마운트 후 애니메이션을 위한 상태
    useEffect(() => {
        setMounted(true)
    }, [])

    const menuItems = [
        { label: "시간표", icon: <Calendar size={18} />, path: "/" },
        { label: "성적 관리", icon: <GraduationCap size={18} />, path: "/grades" },
        { label: "시험 일정", icon: <BookOpen size={18} />, path: "/exams" },
        { label: "출석 관리", icon: <UserCheck size={18} />, path: "/attendance" },
        { label: "AI 학습 도우미", icon: <Bot size={18} />, path: "/ai-tutor" },
        { label: "학사 일정", icon: <Bell size={18} />, path: "/academic-calendar" },
        { label: "식단 정보", icon: <Utensils size={18} />, path: "/cafeteria" },
        { label: "셔틀버스", icon: <Bus size={18} />, path: "/shuttle" },
        { label: "디지털 학생증", icon: <CreditCard size={18} />, path: "/digital-id" },
        { label: "커뮤니티", icon: <MessageSquare size={18} />, path: "/community" },
        { label: "설정", icon: <Settings size={18} />, path: "/settings" },
    ]

    return (
        <>
            {/* 햄버거 버튼: 사이드바가 닫혀 있을 때만 좌상단에 고정 */}
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="
            fixed top-4 left-4 z-[1100]
            bg-white/70 backdrop-blur-md border border-white/30 shadow-lg
            rounded-full p-3
            flex items-center justify-center
            hover:bg-white/80 active:bg-white/90
            transition-all duration-300
          "
                    aria-label="사이드바 열기"
                >
                    <MenuIcon size={22} className="text-indigo-600" />
                </button>
            )}

            {/* 사이드바 패널 */}
            <div
                className={`
          fixed top-0 left-0 h-full z-[1050]
          transition-transform duration-500 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${mounted ? "opacity-100" : "opacity-0"}
        `}
                style={{ width: 250, minWidth: 220, maxWidth: 320 }}
            >
                <ProSidebar
                    collapsed={!sidebarOpen}
                    width="100%"
                    collapsedWidth="0px"
                    className="h-full bg-transparent"
                    rootStyles={{
                        height: "100%",
                    }}
                >
                    <div className="flex flex-col h-full p-4 bg-white/60 backdrop-blur-md border-r border-white/30 shadow-xl">
                        {/* 헤더 영역 */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="font-bold text-xl pl-2 select-none bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                학사메이트
                            </div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="
                  p-2 rounded-full text-gray-700
                  hover:bg-white/50 transition-colors
                  flex items-center justify-center
                "
                                aria-label="사이드바 닫기"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* 메뉴 */}
                        <Menu
                            className="mt-4 flex-1 overflow-y-auto"
                            menuItemStyles={{
                                button: {
                                    padding: "12px 16px",
                                    borderRadius: "12px",
                                    marginBottom: "8px",
                                    transition: "all 0.3s ease",
                                    [`&:hover`]: {
                                        backgroundColor: "rgba(255, 255, 255, 0.4)",
                                    },
                                },
                            }}
                        >
                            {menuItems.map(({ label, icon, path }) => (
                                <MenuItem
                                    key={path}
                                    icon={icon}
                                    className={`
                    mb-2 rounded-xl transition-all duration-300
                    ${
                                        isActive(path)
                                            ? "bg-gradient-to-r from-indigo-500/40 to-purple-500/40 backdrop-blur-sm shadow-md border border-white/30"
                                            : "text-gray-600 hover:text-indigo-700"
                                    }
                  `}
                                    onClick={() => router.push(path)}
                                >
                  <span
                      className={`text-base ${
                          isActive(path)
                              ? "font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent"
                              : ""
                      }`}
                  >
                    {label}
                  </span>
                                </MenuItem>
                            ))}
                        </Menu>

                        {/* 푸터 영역 */}
                        <div className="mt-auto pt-4 border-t border-white/30">
                            <div className="text-xs text-gray-500 text-center p-2">
                                <p className="mb-1">학사메이트 v1.0</p>
                                <p>© 2025 학사메이트</p>
                            </div>
                        </div>
                    </div>
                </ProSidebar>
            </div>

            {/* 배경 오버레이 - 모바일에서 사이드바 열릴 때 배경 클릭으로 닫기 가능 */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[1040] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </>
    )
}