"use client"

import { useEffect, useState, useMemo } from "react"
import Modal from "react-modal"
import { fetchSubjects, createSubject, generateTimetable, deleteSubject, updateSubject } from "@/lib/api"
import type { Subject, TimetableSlot } from "@/types/subject"
import Sidebar from "./sidebar/sidebar"
import { useRouter } from "next/navigation"
import axios from "axios"
import { User } from "lucide-react"
import { supabase } from '@/lib/supabaseClient'; // supabase 클라이언트

export default function Page() {
    const router = useRouter()
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [form, setForm] = useState<Subject>({
        name: "",
        dayOfWeek: "MONDAY",
        startTime: "",
        endTime: "",
        required: false,
    })
    const [timetable, setTimetable] = useState<TimetableSlot[]>([])
    const [timeError, setTimeError] = useState<string | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [showProfileModal, setShowProfileModal] = useState(false)
    const [userEmail, setUserEmail] = useState<string | null>(null) // 사용자 이메일
    const [userId, setUserId] = useState<string | null>(null) // 사용자 uid

    const timeOptions = Array.from({ length: 21 }, (_, i) => {
        const hour = Math.floor(i / 2) + 8
        const minute = i % 2 === 0 ? "00" : "30"
        return `${hour.toString().padStart(2, "0")}:${minute}`
    })

    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
    const hours = Array.from({ length: 12 }, (_, i) => i + 9)

    // Supabase 인증 상태 확인
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push("/auth/login")
                return
            }
            setUserEmail(session.user.email || null)
            setUserId(session.user.id)
            loadSubjects()
            if (typeof window !== "undefined") {
                Modal.setAppElement("body")
            }
        }
        checkAuth()
    }, [router])

    // (필요하다면) 유저 정보 변화 감지
    useEffect(() => {
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_OUT" || !session) {
                router.push("/auth/login")
            }
            if (session) {
                setUserEmail(session.user.email || null)
                setUserId(session.user.id)
            } else {
                setUserEmail(null)
                setUserId(null)
            }
        })
        return () => {
            listener.subscription.unsubscribe()
        }
    }, [router])

    const loadSubjects = async () => {
        try {
            setIsLoading(true)
            const data = await fetchSubjects()
            setSubjects(data)
        } catch (error) {
            console.error("과목 로딩 중 오류 발생:", error)
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    alert("서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.")
                } else if (error.response?.status === 500) {
                    alert("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
                } else {
                    alert("과목을 불러오는 중 오류가 발생했습니다.")
                }
            }
        } finally {
            setIsLoading(false)
        }
    }

    const timeToMinutes = (time: string) => {
        const [h, m] = time.split(":").map(Number)
        return h * 60 + m
    }

    const handleStartTimeChange = (startTime: string) => {
        const startIndex = timeOptions.findIndex((t) => t === startTime)
        const defaultEnd = timeOptions[startIndex + 2] || ""
        setForm((prev) => ({ ...prev, startTime, endTime: defaultEnd }))
    }

    const handleAddOrUpdate = async () => {
        if (!form.name || !form.startTime || !form.endTime) {
            setTimeError("모든 입력을 채워주세요.")
            return
        }
        if (timeToMinutes(form.startTime) >= timeToMinutes(form.endTime)) {
            setTimeError("종료 시간이 시작 시간보다 늦어야 합니다.")
            return
        }
        const lastTimeOption = timeOptions[timeOptions.length - 1]
        if (timeToMinutes(form.endTime) > timeToMinutes(lastTimeOption)) {
            setTimeError(`종료 시간은 ${lastTimeOption}를 넘을 수 없습니다.`)
            return
        }

        setTimeError(null)
        setIsLoading(true)

        try {
            if (editMode && form.id) {
                await updateSubject(form)
            } else {
                await createSubject(form)
            }
            await loadSubjects()
            setForm({ name: "", dayOfWeek: "MONDAY", startTime: "", endTime: "", required: false })
            setEditMode(false)
            setShowModal(false)
        } catch (error) {
            console.error("과목 저장 중 오류 발생:", error)
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    setTimeError("입력한 데이터가 올바르지 않습니다. 다시 확인해주세요.")
                } else {
                    setTimeError("저장 중 오류가 발생했습니다. 다시 시도해주세요.")
                }
            } else {
                setTimeError("저장 중 오류가 발생했습니다. 다시 시도해주세요.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (subject: Subject) => {
        setForm(subject)
        setEditMode(true)
        setShowModal(true)
    }

    const handleDelete = async (id: number) => {
        if (window.confirm("이 과목을 삭제하시겠습니까?")) {
            setIsLoading(true)
            try {
                await deleteSubject(id)
                await loadSubjects()
            } catch (error) {
                console.error("과목 삭제 중 오류 발생:", error)
                if (axios.isAxiosError(error)) {
                    if (error.response?.status === 404) {
                        alert("해당 과목을 찾을 수 없습니다.")
                    } else {
                        alert("삭제 중 오류가 발생했습니다.")
                    }
                } else {
                    alert("삭제 중 오류가 발생했습니다.")
                }
            } finally {
                setIsLoading(false)
            }
        }
    }

    const handleGenerate = async () => {
        setIsLoading(true)
        try {
            const result = await generateTimetable()
            setTimetable(result)
        } catch (error) {
            console.error("시간표 생성 중 오류 발생:", error)
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 500) {
                    alert("시간표를 생성할 수 없습니다. 서버 오류가 발생했습니다.")
                } else {
                    alert("시간표 생성 중 오류가 발생했습니다.")
                }
            } else {
                alert("시간표 생성 중 오류가 발생했습니다.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const timetableMap = useMemo(() => {
        const map = new Map<string, string[]>()
        timetable.forEach((slot) => {
            const startHour = Number.parseInt(slot.startTime.split(":")[0], 10)
            const endHour = Number.parseInt(slot.endTime.split(":")[0], 10)
            for (let hour = startHour; hour < endHour; hour++) {
                const key = `${slot.dayOfWeek}-${hour}`
                const existing = map.get(key) || []
                map.set(key, [...existing, slot.subject.name])
            }
        })
        return map
    }, [timetable])

    const resetForm = () => {
        setForm({ name: "", dayOfWeek: "MONDAY", startTime: "", endTime: "", required: false })
        setTimeError(null)
        setEditMode(false)
    }

    const closeModal = () => {
        setShowModal(false)
        resetForm()
    }

    // Supabase 로그아웃 처리
    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUserEmail(null)
        setUserId(null)
        router.push("/auth/login")
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 text-gray-900 transition-colors duration-300">
            {/* 사이드바 영역 */}
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* 메인 콘텐츠 영역 */}
            <div className="flex-1 font-sans pb-12">
                <header className="bg-white/20 backdrop-blur-md text-gray-800 py-6 px-4 flex justify-between items-center shadow-lg border-b border-white/30">
                    <div className="w-10"></div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        학사메이트
                    </h1>
                    <button
                        onClick={() => setShowProfileModal(true)}
                        className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 flex items-center justify-center transition-all shadow-lg"
                        aria-label="프로필"
                    >
                        <User className="h-5 w-5 text-white" />
                    </button>
                </header>

                {/* 메인 카드 콘텐츠 박스 */}
                <div className="max-w-4xl mx-auto my-4 sm:my-10 bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-8 shadow-2xl text-center transition-all duration-300 border border-white/30">
                    <h1 className="text-xl sm:text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        📘 수강 시간표 작성
                    </h1>

                    <button
                        onClick={() => {
                            resetForm()
                            setShowModal(true)
                        }}
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white py-3 px-6 rounded-xl transition-all mb-6 flex items-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        disabled={isLoading}
                    >
                        <span className="mr-2">+</span> 과목 추가
                    </button>

                    <div className="text-left mb-6">
                        <h2 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900">📌 등록된 과목</h2>
                        {isLoading && subjects.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                                <p className="mt-2 text-gray-500">과목을 불러오는 중...</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {subjects.length === 0 ? (
                                    <li className="text-gray-500 italic text-center py-4">
                                        등록된 과목이 없습니다. 위 버튼을 눌러 과목을 추가해주세요.
                                    </li>
                                ) : (
                                    subjects.map((subject) => (
                                        <li
                                            key={subject.id}
                                            className="p-4 bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-xl flex justify-between items-center transition-all shadow-md hover:shadow-lg border border-white/30"
                                        >
                                            <div>
                                                <span className="font-semibold text-gray-900">{subject.name}</span>
                                                <span className="ml-2 text-xs text-gray-400">
                          {subject.dayOfWeek} {subject.startTime}~{subject.endTime} {subject.required && "(필수)"}
                        </span>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(subject)}
                                                    className="text-indigo-700 hover:text-indigo-900 font-semibold hover:underline"
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(subject.id!)}
                                                    className="text-red-600 hover:text-red-800 font-semibold hover:underline"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}
                    </div>

                    <button
                        onClick={handleGenerate}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-6 rounded-xl transition-all font-bold mt-4 mb-8 disabled:opacity-50 shadow-lg hover:shadow-xl"
                        disabled={subjects.length === 0 || isLoading}
                    >
                        시간표 자동 생성
                    </button>

                    <div className="overflow-x-auto rounded-2xl border border-white/30 mt-4 shadow-lg">
                        <table className="min-w-full bg-white/70 backdrop-blur-sm border-collapse transition-colors duration-300">
                            <thead>
                            <tr>
                                <th className="p-3 bg-gradient-to-r from-indigo-100/80 to-purple-100/80 backdrop-blur-sm border-b border-white/30 w-20 text-gray-700 font-semibold">
                                    시간
                                </th>
                                {days.map((day) => (
                                    <th
                                        key={day}
                                        className="p-3 bg-gradient-to-r from-indigo-100/80 to-purple-100/80 backdrop-blur-sm border-b border-white/30 text-gray-700 font-semibold"
                                    >
                                        {day.slice(0, 3)}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {hours.map((hour) => (
                                <tr key={hour}>
                                    <td className="p-2 text-sm font-bold bg-gradient-to-r from-gray-100/80 to-gray-200/80 backdrop-blur-sm border-b border-white/30">
                                        {hour}:00
                                    </td>
                                    {days.map((day) => {
                                        const key = `${day}-${hour}`
                                        const slotSubjects = timetableMap.get(key) || []
                                        return (
                                            <td className="p-2 border-b border-white/30 text-center" key={day}>
                                                {slotSubjects.length > 0
                                                    ? slotSubjects.map((name, i) => (
                                                        <div
                                                            className="rounded-lg bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 px-2 py-1 text-xs mb-1 shadow-sm"
                                                            key={i}
                                                        >
                                                            {name}
                                                        </div>
                                                    ))
                                                    : null}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Modal
                    isOpen={showModal}
                    onRequestClose={closeModal}
                    contentLabel="과목 추가/수정"
                    className="bg-white/90 backdrop-blur-md text-gray-900 rounded-2xl max-w-md mx-auto mt-24 p-6 shadow-2xl outline-none transition-colors duration-300 border border-white/30"
                    overlayClassName="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center"
                    ariaHideApp={false}
                >
                    <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900">{editMode ? "과목 수정" : "과목 추가"}</h2>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleAddOrUpdate()
                        }}
                    >
                        <div className="mb-4">
                            <label className="block mb-1 text-sm text-gray-700">과목명</label>
                            <input
                                type="text"
                                className="w-full border border-white/30 px-3 py-2 rounded-xl bg-white/60 backdrop-blur-sm text-gray-900 focus:bg-white/80 transition-all"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="mb-4 flex gap-2">
                            <div className="w-1/3">
                                <label className="block mb-1 text-sm text-gray-700">요일</label>
                                <select
                                    className="w-full border border-white/30 px-2 py-1 rounded-xl bg-white/60 backdrop-blur-sm text-gray-900 focus:bg-white/80 transition-all"
                                    value={form.dayOfWeek}
                                    onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value as Subject["dayOfWeek"] })}
                                    required
                                >
                                    {days.map((day) => (
                                        <option key={day} value={day}>
                                            {day}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-1/3">
                                <label className="block mb-1 text-sm text-gray-700">시작 시간</label>
                                <select
                                    className="w-full border border-white/30 px-2 py-1 rounded-xl bg-white/60 backdrop-blur-sm text-gray-900 focus:bg-white/80 transition-all"
                                    value={form.startTime}
                                    onChange={(e) => handleStartTimeChange(e.target.value)}
                                    required
                                >
                                    <option value="">선택</option>
                                    {timeOptions.map((time) => (
                                        <option key={time} value={time}>
                                            {time}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-1/3">
                                <label className="block mb-1 text-sm text-gray-700">종료 시간</label>
                                <select
                                    className="w-full border border-white/30 px-2 py-1 rounded-xl bg-white/60 backdrop-blur-sm text-gray-900 focus:bg-white/80 transition-all"
                                    value={form.endTime}
                                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                    required
                                >
                                    <option value="">선택</option>
                                    {timeOptions.map((time, idx) =>
                                        idx > timeOptions.findIndex((t) => t === form.startTime) ? (
                                            <option key={time} value={time}>
                                                {time}
                                            </option>
                                        ) : null,
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4 flex items-center">
                            <input
                                id="required"
                                type="checkbox"
                                checked={form.required}
                                onChange={(e) => setForm({ ...form, required: e.target.checked })}
                                className="mr-2"
                            />
                            <label htmlFor="required" className="text-sm text-gray-700">
                                필수 과목
                            </label>
                        </div>

                        {timeError && <div className="text-red-500 mb-3 text-sm font-semibold">{timeError}</div>}

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                disabled={isLoading}
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold disabled:opacity-50 shadow-lg transition-all"
                                disabled={isLoading}
                            >
                                {editMode ? "수정" : "추가"}
                            </button>
                        </div>
                    </form>
                </Modal>
                {/* 프로필 모달 */}
                <Modal
                    isOpen={showProfileModal}
                    onRequestClose={() => setShowProfileModal(false)}
                    contentLabel="프로필"
                    className="bg-white/90 backdrop-blur-md text-gray-900 rounded-2xl max-w-lg mx-auto mt-24 p-6 shadow-2xl outline-none transition-colors duration-300 border border-white/30"
                    overlayClassName="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center"
                    ariaHideApp={false}
                >
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mb-4 shadow-lg">
                            <User className="h-12 w-12 text-indigo-700" />
                        </div>
                        <h2 className="text-xl font-bold mb-1 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {userEmail ? userEmail : "로그인 정보 없음"}
                        </h2>
                        <p className="text-gray-500 mb-4">컴퓨터공학과 • 3학년</p>

                        <div className="w-full border-t border-white/30 pt-4 mt-2">
                            <div className="grid gap-3 w-full">
                                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-sm rounded-xl border border-white/30">
                                    <span className="font-medium">UID</span>
                                    <span className="text-gray-600">{userId || "-"}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-sm rounded-xl border border-white/30">
                                    <span className="font-medium">이메일</span>
                                    <span className="text-gray-600">{userEmail || "-"}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-sm rounded-xl border border-white/30">
                                    <span className="font-medium">수강 과목 수</span>
                                    <span className="text-gray-600">{subjects.length}개</span>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                <button
                                    onClick={() => {
                                        setShowProfileModal(false)
                                        router.push("/settings")
                                    }}
                                    className="w-full py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl transition-all shadow-lg"
                                >
                                    설정
                                </button>
                                <button className="w-full py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl transition-all shadow-lg">
                                    내 정보 수정
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full py-2 px-4 bg-white/60 backdrop-blur-sm hover:bg-white/80 text-gray-800 rounded-xl transition-all border border-white/30"
                                >
                                    로그아웃
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    )
}
