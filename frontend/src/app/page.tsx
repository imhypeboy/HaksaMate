"use client"

import { useEffect, useState, useMemo } from "react"
import Modal from "react-modal"
import { fetchSubjects, createSubject, generateTimetable, deleteSubject, updateSubject } from "@/lib/api"
import type { Subject, TimetableSlot } from "@/types/subject"
import Sidebar from "./sidebar/sidebar"
import { useRouter } from "next/navigation"
import axios from "axios"
import { isAuthenticated } from "@/lib/auth"
import { User } from "lucide-react"

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

    const timeOptions = Array.from({ length: 21 }, (_, i) => {
        const hour = Math.floor(i / 2) + 8
        const minute = i % 2 === 0 ? "00" : "30"
        return `${hour.toString().padStart(2, "0")}:${minute}`
    })

    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
    const hours = Array.from({ length: 12 }, (_, i) => i + 9)

    useEffect(() => {
        // 인증 상태 확인
        if (!isAuthenticated()) {
            router.push("/auth/login")
            return
        }
        loadSubjects()
        if (typeof window !== "undefined") {
            Modal.setAppElement("body")
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

    return (
        <div className="flex min-h-screen bg-white text-gray-900 transition-colors duration-300">
            {/* 사이드바 영역 */}
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* 메인 콘텐츠 영역 */}
            <div className="flex-1 font-sans pb-12">
                <header className="bg-blue-700 text-white py-6 px-4 flex justify-between items-center shadow-md">
                    <div className="w-10"></div> {/* Empty div for balance */}
                    <h1 className="text-2xl font-bold">학사메이트</h1>
                    <button
                        onClick={() => setShowProfileModal(true)}
                        className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-800 flex items-center justify-center transition-colors"
                        aria-label="프로필"
                    >
                        <User className="h-5 w-5" />
                    </button>
                </header>

                {/* 메인 카드 콘텐츠 박스 */}
                <div className="max-w-4xl mx-auto my-4 sm:my-10 bg-white rounded-xl p-4 sm:p-8 shadow-lg text-center transition-colors duration-300">
                    <h1 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900">📘 수강 시간표 작성</h1>

                    <button
                        onClick={() => {
                            resetForm()
                            setShowModal(true)
                        }}
                        className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded-md transition-colors mb-6 flex items-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        <span className="mr-1">+</span> 과목 추가
                    </button>

                    <div className="text-left mb-6">
                        <h2 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900">📌 등록된 과목</h2>
                        {isLoading && subjects.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
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
                                            className="p-3 border bg-gray-50 hover:bg-gray-100 rounded-md flex justify-between items-center transition-colors"
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
                                                    className="text-blue-700 hover:underline font-semibold"
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(subject.id!)}
                                                    className="text-red-600 hover:underline font-semibold"
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
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors font-bold mt-4 mb-8 disabled:opacity-50"
                        disabled={subjects.length === 0 || isLoading}
                    >
                        시간표 자동 생성
                    </button>

                    <div className="overflow-x-auto rounded-lg border mt-4">
                        <table className="min-w-full bg-white border-collapse transition-colors duration-300">
                            <thead>
                            <tr>
                                <th className="p-2 bg-blue-50 border-b w-20">시간</th>
                                {days.map((day) => (
                                    <th key={day} className="p-2 bg-blue-50 border-b">
                                        {day.slice(0, 3)}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {hours.map((hour) => (
                                <tr key={hour}>
                                    <td className="p-2 text-sm font-bold bg-gray-100 border-b">{hour}:00</td>
                                    {days.map((day) => {
                                        const key = `${day}-${hour}`
                                        const slotSubjects = timetableMap.get(key) || []
                                        return (
                                            <td className="p-2 border-b text-center" key={day}>
                                                {slotSubjects.length > 0
                                                    ? slotSubjects.map((name, i) => (
                                                        <div className="rounded bg-blue-100 text-blue-800 px-2 py-1 text-xs mb-1" key={i}>
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
                    className="bg-white text-gray-900 rounded-xl max-w-md mx-auto mt-24 p-6 shadow-lg outline-none transition-colors duration-300"
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
                                className="w-full border px-3 py-2 rounded-md bg-gray-50 text-gray-900"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="mb-4 flex gap-2">
                            <div className="w-1/3">
                                <label className="block mb-1 text-sm text-gray-700">요일</label>
                                <select
                                    className="w-full border px-2 py-1 rounded-md bg-gray-50 text-gray-900"
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
                                    className="w-full border px-2 py-1 rounded-md bg-gray-50 text-gray-900"
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
                                    className="w-full border px-2 py-1 rounded-md bg-gray-50 text-gray-900"
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
                                className="px-4 py-2 rounded bg-gray-100 text-gray-600"
                                disabled={isLoading}
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded bg-blue-700 hover:bg-blue-800 text-white font-semibold disabled:opacity-50"
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
                    className="bg-white text-gray-900 rounded-xl max-w-lg mx-auto mt-24 p-6 shadow-lg outline-none transition-colors duration-300"
                    overlayClassName="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center"
                    ariaHideApp={false}
                >
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                            <User className="h-12 w-12 text-blue-700" />
                        </div>
                        <h2 className="text-xl font-bold mb-1">홍길동</h2>
                        <p className="text-gray-500 mb-4">컴퓨터공학과 • 3학년</p>

                        <div className="w-full border-t pt-4 mt-2">
                            <div className="grid gap-3 w-full">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium">학번</span>
                                    <span className="text-gray-600">2021123456</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium">이메일</span>
                                    <span className="text-gray-600">student@university.ac.kr</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
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
                                    className="w-full py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors"
                                >
                                    설정
                                </button>
                                <button className="w-full py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors">
                                    내 정보 수정
                                </button>
                                <button className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors">
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
