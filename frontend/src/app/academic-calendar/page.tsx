"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Bell, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { isAuthenticated } from "@/lib/auth"

interface AcademicEvent {
    id: number
    title: string
    description: string
    startDate: string
    endDate?: string
    category: "수강신청" | "시험" | "휴학" | "등록금" | "행사" | "기타"
    priority: "높음" | "보통" | "낮음"
    isCompleted?: boolean
    daysLeft?: number
}

export default function AcademicCalendarPage() {
    const router = useRouter()
    const [selectedCategory, setSelectedCategory] = useState<string>("전체")
    const [showNotifications, setShowNotifications] = useState(true)

    const academicEvents: AcademicEvent[] = [
        {
            id: 1,
            title: "2024년 2학기 수강신청",
            description: "2024년 2학기 수강신청 기간입니다. 미리 수강계획을 세워두세요.",
            startDate: "2024-08-15",
            endDate: "2024-08-20",
            category: "수강신청",
            priority: "높음",
            daysLeft: 85
        },
        {
            id: 2,
            title: "2024년 1학기 기말고사",
            description: "1학기 기말고사 기간입니다.",
            startDate: "2024-06-10",
            endDate: "2024-06-20",
            category: "시험",
            priority: "높음",
            daysLeft: 21
        },
        {
            id: 3,
            title: "2024년 2학기 등록금 납부",
            description: "2학기 등록금 납부 기간입니다.",
            startDate: "2024-08-01",
            endDate: "2024-08-31",
            category: "등록금",
            priority: "높음",
            daysLeft: 71
        },
        {
            id: 4,
            title: "여름 계절학기 신청",
            description: "여름 계절학기 수강신청 기간입니다.",
            startDate: "2024-05-25",
            endDate: "2024-05-30",
            category: "수강신청",
            priority: "보통",
            daysLeft: 5
        },
        {
            id: 5,
            title: "대학 축제",
            description: "2024년 대학 축제가 개최됩니다.",
            startDate: "2024-05-28",
            endDate: "2024-05-30",
            category: "행사",
            priority: "낮음",
            daysLeft: 8
        },
        {
            id: 6,
            title: "휴학 신청 마감",
            description: "2024년 2학기 휴학 신청 마감일입니다.",
            startDate: "2024-07-31",
            category: "휴학",
            priority: "보통",
            daysLeft: 70
        }
    ]

    const categories = ["전체", "수강신청", "시험", "휴학", "등록금", "행사", "기타"]

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/auth/login")
        }
    }, [router])

    const getFilteredEvents = () => {
        if (selectedCategory === "전체") return academicEvents
        return academicEvents.filter(event => event.category === selectedCategory)
    }

    const getUpcomingEvents = () => {
        return academicEvents
            .filter(event => event.daysLeft && event.daysLeft <= 30)
            .sort((a, b) => (a.daysLeft || 0) - (b.daysLeft || 0))
            .slice(0, 3)
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "높음": return "bg-red-100 text-red-800"
            case "보통": return "bg-yellow-100 text-yellow-800"
            case "낮음": return "bg-green-100 text-green-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "수강신청": return "bg-blue-100 text-blue-800"
            case "시험": return "bg-red-100 text-red-800"
            case "휴학": return "bg-purple-100 text-purple-800"
            case "등록금": return "bg-orange-100 text-orange-800"
            case "행사": return "bg-green-100 text-green-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const filteredEvents = getFilteredEvents()
    const upcomingEvents = getUpcomingEvents()

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
                    학사 일정 알림
                </h1>
            </header>

            <div className="max-w-6xl mx-auto py-8 px-4">
                {/* 긴급 알림 */}
                {showNotifications && upcomingEvents.length > 0 && (
                    <div className="bg-gradient-to-r from-orange-500/80 to-red-500/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-xl mb-8 border border-white/30">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start">
                                <AlertTriangle className="h-6 w-6 mr-3 mt-1" />
                                <div>
                                    <h2 className="text-xl font-bold mb-2">긴급 알림</h2>
                                    <p className="opacity-90 mb-3">다가오는 중요한 학사 일정이 있습니다!</p>
                                    <div className="space-y-2">
                                        {upcomingEvents.map((event) => (
                                            <div key={event.id} className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold">{event.title}</span>
                                                    <span className="text-sm bg-white/30 px-2 py-1 rounded">
                            {event.daysLeft}일 남음
                          </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowNotifications(false)}
                                className="text-white/70 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* 통계 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-blue-500/80 to-indigo-500/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-xl border border-white/30">
                        <div className="flex items-center">
                            <Calendar className="h-8 w-8 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold">전체 일정</h3>
                                <p className="text-3xl font-bold">{academicEvents.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500/80 to-red-500/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-xl border border-white/30">
                        <div className="flex items-center">
                            <Clock className="h-8 w-8 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold">임박한 일정</h3>
                                <p className="text-3xl font-bold">{upcomingEvents.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500/80 to-emerald-500/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-xl border border-white/30">
                        <div className="flex items-center">
                            <Bell className="h-8 w-8 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold">알림 설정</h3>
                                <p className="text-3xl font-bold">ON</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 학사 일정 목록 */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">학사 일정</h2>
                        <select
                            className="border rounded-md px-3 py-2"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4">
                        {filteredEvents.map((event) => (
                            <div
                                key={event.id}
                                className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-sm p-4 rounded-xl border border-white/30 hover:shadow-lg transition-all"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold">{event.title}</h3>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(event.priority)}`}>
                        {event.priority}
                      </span>
                                        </div>
                                        <p className="text-gray-600 mb-2">{event.description}</p>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            <span>
                        {new Date(event.startDate).toLocaleDateString()}
                                                {event.endDate && ` ~ ${new Date(event.endDate).toLocaleDateString()}`}
                      </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {event.daysLeft !== undefined && (
                                            <div className={`text-sm font-medium ${
                                                event.daysLeft <= 7 ? "text-red-600" :
                                                    event.daysLeft <= 30 ? "text-orange-600" : "text-gray-600"
                                            }`}>
                                                {event.daysLeft > 0 ? `${event.daysLeft}일 남음` : "진행중"}
                                            </div>
                                        )}
                                        <button className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                            알림 설정
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
