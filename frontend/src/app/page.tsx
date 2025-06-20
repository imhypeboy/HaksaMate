"use client"

import { useEffect, useState, useMemo } from "react"
import Modal from "react-modal"
import Sidebar from "./sidebar/sidebar"
import { useRouter } from "next/navigation"
import { UserIcon } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

type Subject = {
  id?: number
  name: string
  dayofweek: string
  starttime: string
  endtime: string
  required: boolean
  user_id?: string
}
type TimetableSlot = {
  dayofweek: string
  starttime: string
  endtime: string
  subject: Subject
}

export default function Page() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [form, setForm] = useState<Omit<Subject, "id" | "user_id">>({
    name: "",
    dayofweek: "MONDAY",
    starttime: "",
    endtime: "",
    required: false,
  })
  const [editId, setEditId] = useState<number | null>(null)
  const [timetable, setTimetable] = useState<TimetableSlot[]>([])
  const [timeError, setTimeError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const timeOptions = Array.from({ length: 21 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8
    const minute = i % 2 === 0 ? "00" : "30"
    return `${hour.toString().padStart(2, "0")}:${minute}`
  })
  const days = [
    { label: "MON", value: "MONDAY" },
    { label: "TUE", value: "TUESDAY" },
    { label: "WED", value: "WEDNESDAY" },
    { label: "THU", value: "THURSDAY" },
    { label: "FRI", value: "FRIDAY" },
    { label: "SAT", value: "SATURDAY" },
    { label: "SUN", value: "SUNDAY" },
  ]
  const hours = Array.from({ length: 12 }, (_, i) => i + 9)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth/login")
        return
      }
      setUserEmail(session.user.email || null)
      setUserId(session.user.id)
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (!userId) return
    loadSubjects(userId)
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
      listener?.subscription?.unsubscribe?.()
    }
  }, [router, userId])

  const loadSubjects = async (uid: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("subjects").select("*").eq("user_id", uid).order("starttime")
      if (error) throw error
      setSubjects(data || [])
    } catch {
      alert("과목을 불러오는 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    return h * 60 + m
  }

  const handleStartTimeChange = (starttime: string) => {
    const startIndex = timeOptions.findIndex((t) => t === starttime)
    const defaultEnd = timeOptions[startIndex + 2] || ""
    setForm((prev) => ({ ...prev, starttime, endtime: defaultEnd }))
  }

  const handleAddOrUpdate = async () => {
    if (!form.name || !form.starttime || !form.endtime) {
      setTimeError("모든 입력을 채워주세요.")
      return
    }
    if (timeToMinutes(form.starttime) >= timeToMinutes(form.endtime)) {
      setTimeError("종료 시간이 시작 시간보다 늦어야 합니다.")
      return
    }
    const lastTimeOption = timeOptions[timeOptions.length - 1]
    if (timeToMinutes(form.endtime) > timeToMinutes(lastTimeOption)) {
      setTimeError(`종료 시간은 ${lastTimeOption}를 넘을 수 없습니다.`)
      return
    }

    setTimeError(null)
    setIsLoading(true)

    try {
      if (!userId) throw new Error("로그인이 필요합니다.")
      if (editId) {
        await supabase
          .from("subjects")
          .update({ ...form })
          .eq("id", editId)
          .eq("user_id", userId)
      } else {
        await supabase.from("subjects").insert([{ ...form, user_id: userId }])
      }
      await loadSubjects(userId)
      setForm({ name: "", dayofweek: "MONDAY", starttime: "", endtime: "", required: false })
      setEditId(null)
      setShowModal(false)
    } catch {
      setTimeError("저장 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (subject: Subject) => {
    setForm({
      name: subject.name,
      dayofweek: subject.dayofweek,
      starttime: subject.starttime,
      endtime: subject.endtime,
      required: subject.required,
    })
    setEditId(subject.id || null)
    setShowModal(true)
  }

  const handleDelete = async (id?: number) => {
    if (!userId || !id) return
    if (window.confirm("이 과목을 삭제하시겠습니까?")) {
      setIsLoading(true)
      try {
        await supabase.from("subjects").delete().eq("id", id).eq("user_id", userId)
        await loadSubjects(userId)
      } catch {
        alert("삭제 중 오류가 발생했습니다.")
      } finally {
        setIsLoading(false)
      }
    }
  }

  // 랜덤 시간표 생성(겹치는 시간 자동 제외)
  const handleGenerate = async () => {
    if (subjects.length === 0) {
      setTimetable([])
      return
    }

    // 우선순위: required=true 먼저, 나머지는 랜덤
    const required = subjects.filter((s) => s.required)
    const optional = subjects.filter((s) => !s.required)
    const optionalShuffled = optional.sort(() => Math.random() - 0.5)

    const selected: Subject[] = [...required]
    const occupied: { [key: string]: [number, number][] } = {}
    // 각 요일별로 이미 들어간 시간대를 관리

    for (const subj of selected) {
      const d = subj.dayofweek
      if (!occupied[d]) occupied[d] = []
      occupied[d].push([timeToMinutes(subj.starttime), timeToMinutes(subj.endtime)])
    }

    for (const subj of optionalShuffled) {
      const d = subj.dayofweek
      const s = timeToMinutes(subj.starttime)
      const e = timeToMinutes(subj.endtime)
      if (!occupied[d]) occupied[d] = []
      // 겹침 체크
      const overlap = occupied[d].some(([os, oe]) => Math.max(os, s) < Math.min(oe, e))
      if (!overlap) {
        selected.push(subj)
        occupied[d].push([s, e])
      }
    }

    // timetable 변환
    const timetable: TimetableSlot[] = selected.map((subject) => ({
      dayofweek: subject.dayofweek,
      starttime: subject.starttime,
      endtime: subject.endtime,
      subject,
    }))
    setTimetable(timetable)
  }

  // 시간표 표시용 맵
  const timetableMap = useMemo(() => {
    const map = new Map<string, string[]>()
    timetable.forEach((slot) => {
      const startHour = Number.parseInt(slot.starttime.split(":")[0], 10)
      const endHour = Number.parseInt(slot.endtime.split(":")[0], 10)
      for (let hour = startHour; hour < endHour; hour++) {
        const key = `${slot.dayofweek}-${hour}`
        const existing = map.get(key) || []
        map.set(key, [...existing, slot.subject.name])
      }
    })
    return map
  }, [timetable])

  const resetForm = () => {
    setForm({ name: "", dayofweek: "MONDAY", starttime: "", endtime: "", required: false })
    setTimeError(null)
    setEditId(null)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUserEmail(null)
    setUserId(null)
    router.push("/auth/login")
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 font-sans pb-12">
        <header className="backdrop-blur-md bg-white/60 border-b border-white/30 shadow-lg flex justify-between items-center px-4 sm:px-8 py-5 rounded-b-3xl transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-blue-700 drop-shadow">HaksaMate</span>
          </div>
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-lg flex items-center justify-center hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="프로필"
          >
            <UserIcon className="h-6 w-6 text-white" />
          </button>
        </header>

        <div className="max-w-4xl mx-auto my-4 sm:my-10 bg-white rounded-xl p-4 sm:p-8 shadow-sm text-center border border-gray-200">
          <h1 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900">📌 등록된 과목</h1>

          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors mb-6 flex items-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            disabled={isLoading}
          >
            <span className="mr-2">+</span> 과목 추가
          </button>

          <div className="text-left mb-6">
            {isLoading && subjects.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500">과목을 불러오는 중...</p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mx-auto mt-8">
                {/* 과목 카드 그리드 */}
                <div className="flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map(subject => (
                      <div className="bg-white/40 backdrop-blur-md rounded-xl shadow-md p-4 flex flex-col gap-1 min-w-0">
                        <div className="font-bold text-gray-900 truncate">{subject.name}</div>
                        <div className="text-xs text-gray-700 truncate">
                          {subject.dayofweek} {subject.starttime}~{subject.endtime}
                          {subject.required && <span className="text-pink-500 font-bold ml-1">필수</span>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(subject)}
                            className="p-2 rounded-full bg-blue-100/60 hover:bg-blue-200/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                            aria-label="수정"
                          >
                            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13z" /></svg>
                          </button>
                          <button
                            onClick={() => handleDelete(subject.id)}
                            className="p-2 rounded-full bg-red-100/60 hover:bg-red-200/80 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                            aria-label="삭제"
                          >
                            <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* 시간표 */}
                <div className="flex-1 min-w-0">
                  <div className="overflow-x-auto rounded-2xl border border-white/30 mt-4 shadow-2xl bg-white/40 backdrop-blur-md transition-all">
                    <table className="min-w-full bg-transparent border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="p-3 bg-white/60 border-b border-white/30 w-20 text-gray-700 font-semibold">시간</th>
                          {days.map((day) => (
                            <th
                              key={day.value}
                              className="p-3 bg-white/60 border-b border-white/30 text-gray-700 font-semibold"
                            >
                              {day.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {hours.map((hour) => (
                          <tr key={hour}>
                            <td className="p-2 font-bold bg-white/50 border-b border-white/20">{hour}:00</td>
                            {days.map((day) => {
                              const key = `${day.value}-${hour}`
                              const slotSubjects = timetableMap.get(key) || []
                              return (
                                <td className="p-2 border-b border-white/20 text-center transition-all" key={day.value}>
                                  {slotSubjects.length > 0
                                    ? slotSubjects.map((name, i) => (
                                        <div
                                          className="rounded-md bg-gradient-to-tr from-blue-200 to-cyan-100 text-blue-900 px-2 py-1 text-xs mb-1 border border-blue-100 shadow-sm animate-fadeIn"
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
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            className="bg-gradient-to-tr from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500 text-white py-3 px-6 rounded-xl font-bold shadow-lg transition-all mt-4 mb-8 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-400"
            aria-label="시간표 자동 생성"
            disabled={subjects.length === 0 || isLoading}
          >
            시간표 자동 생성
          </button>
        </div>

        <Modal
          isOpen={showModal}
          onRequestClose={closeModal}
          contentLabel="과목 추가/수정"
          className="backdrop-blur-2xl bg-white/60 rounded-3xl max-w-md w-full mx-auto mt-24 p-8 shadow-2xl border border-white/30 animate-fadeIn"
          overlayClassName="fixed inset-0 bg-gradient-to-br from-blue-100/60 to-pink-100/60 z-50 flex items-center justify-center"
          ariaHideApp={false}
        >
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900">{editId ? "과목 수정" : "과목 추가"}</h2>
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
                className="w-full border border-gray-300 px-3 py-2 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="mb-4 flex gap-2">
              <div className="w-1/3">
                <label className="block mb-1 text-sm text-gray-700">요일</label>
                <select
                  className="w-full border border-gray-300 px-2 py-1 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  value={form.dayofweek}
                  onChange={(e) => setForm({ ...form, dayofweek: e.target.value })}
                  required
                >
                  {days.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-1/3">
                <label className="block mb-1 text-sm text-gray-700">시작 시간</label>
                <select
                  className="w-full border border-gray-300 px-2 py-1 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  value={form.starttime}
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
                  className="w-full border border-gray-300 px-2 py-1 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  value={form.endtime}
                  onChange={(e) => setForm({ ...form, endtime: e.target.value })}
                  required
                >
                  <option value="">선택</option>
                  {timeOptions.map((time, idx) =>
                    idx > timeOptions.findIndex((t) => t === form.starttime) ? (
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
                className="mr-2 text-blue-600 focus:ring-blue-500"
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
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50 shadow-sm transition-colors"
                disabled={isLoading}
              >
                {editId ? "수정" : "추가"}
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showProfileModal}
          onRequestClose={() => setShowProfileModal(false)}
          contentLabel="프로필"
          className="backdrop-blur-2xl bg-white/60 rounded-3xl max-w-lg w-full mx-auto mt-24 p-8 shadow-2xl border border-white/30 animate-fadeIn"
          overlayClassName="fixed inset-0 bg-gradient-to-br from-blue-100/60 to-pink-100/60 z-50 flex items-center justify-center"
          ariaHideApp={false}
        >
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4 shadow-sm">
              <UserIcon className="h-12 w-12 text-gray-600" />
            </div>
            <h2 className="text-xl font-bold mb-1 text-gray-900">{userEmail ? userEmail : "로그인 정보 없음"}</h2>
            <p className="text-gray-500 mb-4">컴퓨터공학과 • 3학년</p>

            <div className="w-full border-t border-gray-200 pt-4 mt-2">
              <div className="grid gap-3 w-full">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="font-medium">UID</span>
                  <span className="text-gray-600">{userId || "-"}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="font-medium">이메일</span>
                  <span className="text-gray-600">{userEmail || "-"}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
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
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  설정
                </button>
                <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
                  내 정보 수정
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors border border-gray-200"
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
