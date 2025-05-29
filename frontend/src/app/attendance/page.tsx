"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Clock, TrendingUp, CheckCircle, XCircle, AlertCircle, BookOpen } from "lucide-react"
import { isAuthenticated } from "@/lib/auth"

interface AttendanceRecord {
    id: string
    date: string
    status: "present" | "absent" | "late"
    subject: string
    time: string
    professor: string
    room: string
    week: number
}

interface AttendanceStats {
    totalClasses: number
    presentCount: number
    absentCount: number
    lateCount: number
    attendanceRate: number
}

interface Subject {
    id: string
    name: string
    professor: string
    room: string
    schedule: string
    totalClasses: number
    attendedClasses: number
}

export default function AttendancePage() {
    const router = useRouter()
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "semester">("week")
    const [selectedSubject, setSelectedSubject] = useState<string>("all")
    const [stats, setStats] = useState<AttendanceStats>({
        totalClasses: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        attendanceRate: 0,
    })

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/auth/login")
        }

        // 더미 과목 데이터
        const dummySubjects: Subject[] = [
            {
                id: "1",
                name: "데이터베이스",
                professor: "김교수",
                room: "IT-301",
                schedule: "월,수 09:00-10:30",
                totalClasses: 15,
                attendedClasses: 13,
            },
            {
                id: "2",
                name: "웹프로그래밍",
                professor: "이교수",
                room: "IT-205",
                schedule: "화,목 11:00-12:30",
                totalClasses: 15,
                attendedClasses: 14,
            },
            {
                id: "3",
                name: "소프트웨어공학",
                professor: "박교수",
                room: "IT-401",
                schedule: "금 13:00-16:00",
                totalClasses: 15,
                attendedClasses: 12,
            },
            {
                id: "4",
                name: "알고리즘",
                professor: "최교수",
                room: "IT-302",
                schedule: "월,수 14:00-15:30",
                totalClasses: 15,
                attendedClasses: 15,
            },
        ]

        // 더미 출석 데이터
        const dummyRecords: AttendanceRecord[] = [
            {
                id: "1",
                date: "2025-05-23",
                status: "present",
                subject: "데이터베이스",
                time: "09:00",
                professor: "김교수",
                room: "IT-301",
                week: 8,
            },
            {
                id: "2",
                date: "2025-05-23",
                status: "late",
                subject: "웹프로그래밍",
                time: "11:00",
                professor: "이교수",
                room: "IT-205",
                week: 8,
            },
            {
                id: "3",
                date: "2025-05-22",
                status: "present",
                subject: "소프트웨어공학",
                time: "13:00",
                professor: "박교수",
                room: "IT-401",
                week: 8,
            },
            {
                id: "4",
                date: "2025-05-21",
                status: "present",
                subject: "알고리즘",
                time: "14:00",
                professor: "최교수",
                room: "IT-302",
                week: 8,
            },
            {
                id: "5",
                date: "2025-05-20",
                status: "absent",
                subject: "데이터베이스",
                time: "09:00",
                professor: "김교수",
                room: "IT-301",
                week: 8,
            },
        ]

        setSubjects(dummySubjects)
        setAttendanceRecords(dummyRecords)

        // 통계 계산
        const totalClasses = dummyRecords.length
        const presentCount = dummyRecords.filter((r) => r.status === "present").length
        const absentCount = dummyRecords.filter((r) => r.status === "absent").length
        const lateCount = dummyRecords.filter((r) => r.status === "late").length
        const attendanceRate = totalClasses > 0 ? Math.round(((presentCount + lateCount) / totalClasses) * 100) : 0

        setStats({
            totalClasses,
            presentCount,
            absentCount,
            lateCount,
            attendanceRate,
        })
    }, [router])

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "present":
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case "absent":
                return <XCircle className="w-5 h-5 text-red-500" />
            case "late":
                return <AlertCircle className="w-5 h-5 text-yellow-500" />
            default:
                return <Clock className="w-5 h-5 text-gray-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "present":
                return "bg-green-100 text-green-800 border-green-200"
            case "absent":
                return "bg-red-100 text-red-800 border-red-200"
            case "late":
                return "bg-yellow-100 text-yellow-800 border-yellow-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case "present":
                return "출석"
            case "absent":
                return "결석"
            case "late":
                return "지각"
            default:
                return "미확인"
        }
    }

    const filteredRecords = attendanceRecords.filter(
        (record) => selectedSubject === "all" || record.subject === selectedSubject,
    )

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
                    출석 관리 시스템
                </h1>
            </header>

            <div className="max-w-6xl mx-auto py-8 px-4">
                {/* 통계 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-indigo-500/80 to-purple-500/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-xl border border-white/30">
                        <div className="flex items-center">
                            <TrendingUp className="h-8 w-8 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold">전체 출석률</h3>
                                <p className="text-3xl font-bold">{stats.attendanceRate}%</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500/80 to-emerald-500/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-xl border border-white/30">
                        <div className="flex items-center">
                            <CheckCircle className="h-8 w-8 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold">출석</h3>
                                <p className="text-3xl font-bold">{stats.presentCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-500/80 to-orange-500/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-xl border border-white/30">
                        <div className="flex items-center">
                            <AlertCircle className="h-8 w-8 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold">지각</h3>
                                <p className="text-3xl font-bold">{stats.lateCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-red-500/80 to-pink-500/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-xl border border-white/30">
                        <div className="flex items-center">
                            <XCircle className="h-8 w-8 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold">결석</h3>
                                <p className="text-3xl font-bold">{stats.absentCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 수강 과목 */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
                        수강 과목
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {subjects.map((subject) => (
                            <div
                                key={subject.id}
                                className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 backdrop-blur-sm p-4 rounded-xl border border-white/30 shadow-md"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                                    <span className="text-sm text-indigo-600 font-medium">
                    {Math.round((subject.attendedClasses / subject.totalClasses) * 100)}%
                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                    {subject.professor} • {subject.room}
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                    <div
                                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                                        style={{ width: `${(subject.attendedClasses / subject.totalClasses) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {subject.attendedClasses}/{subject.totalClasses} 출석
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 출석 기록 */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                            출석 기록
                        </h2>
                        <div className="flex space-x-3">
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                            >
                                <option value="all">전체 과목</option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.name}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value as "week" | "month" | "semester")}
                                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                            >
                                <option value="week">이번 주</option>
                                <option value="month">이번 달</option>
                                <option value="semester">이번 학기</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredRecords.map((record) => (
                            <div
                                key={record.id}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-white/60 to-indigo-50/60 backdrop-blur-sm rounded-xl hover:from-white/80 hover:to-indigo-50/80 transition-all border border-white/30"
                            >
                                <div className="flex items-center space-x-4">
                                    {getStatusIcon(record.status)}
                                    <div>
                                        <h3 className="font-medium text-gray-900">{record.subject}</h3>
                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                          {record.time}
                      </span>
                                            <span>{record.room}</span>
                                            <span>{record.professor}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                  <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(record.status)}`}
                  >
                    {getStatusText(record.status)}
                  </span>
                                    <p className="text-sm text-gray-500 mt-1">{record.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
