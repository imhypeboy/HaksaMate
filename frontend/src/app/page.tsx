"use client"
import { useEffect, useState, useMemo } from "react"
import Modal from "react-modal"
import Sidebar from "./sidebar/sidebar"
import { useRouter } from "next/navigation"
import { UserIcon, Plus, Edit2, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"

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

// 애니메이션 variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12
    }
  }
}

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50"
    >
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 font-sans pb-12">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="backdrop-blur-md bg-white/80 border-b border-white/30 shadow-lg flex justify-between items-center px-4 sm:px-8 py-5 rounded-b-3xl"
        >
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HaksaMate
            </span>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            onClick={() => setShowProfileModal(true)}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-lg flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="프로필"
          >
            <UserIcon className="h-6 w-6 text-white" />
          </motion.button>
        </motion.header>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-7xl mx-auto my-4 sm:my-10 bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-8 shadow-lg border border-white/50"
        >
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-xl sm:text-2xl font-bold mb-6 text-gray-900 text-center"
          >
            📌 등록된 과목
          </motion.h1>

          <div className="flex flex-col xl:flex-row gap-8">
            {/* 과목 리스트 */}
            <div className="xl:w-2/5">
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex justify-between items-center mb-6"
              >
                <h2 className="text-lg font-bold text-gray-900">과목 관리</h2>
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    resetForm()
                    setShowModal(true)
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 px-4 rounded-lg transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  과목 추가
                </motion.button>
              </motion.div>
              {isLoading && subjects.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-8 h-8 border-t-2 border-b-2 border-blue-600 rounded-full"
                  />
                  <p className="mt-3 text-gray-500">과목을 불러오는 중...</p>
                </motion.div>
              ) : subjects.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="text-center py-12"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl mb-4"
                  >
                    📚
                  </motion.div>
                  <p className="text-gray-500 mb-4">등록된 과목이 없습니다</p>
                  <p className="text-sm text-gray-400">과목을 추가해서 시간표를 만들어보세요</p>
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <AnimatePresence>
                    {subjects.map((subject, index) => (
                      <motion.div
                        key={subject.id}
                        variants={cardVariants}
                        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                        whileHover={{ 
                          y: -4, 
                          scale: 1.02,
                          transition: { type: "spring", stiffness: 400, damping: 10 }
                        }}
                        className="group bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/50 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate text-base">{subject.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                                {subject.dayofweek}
                              </span>
                              {subject.required && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full font-medium"
                                >
                                  필수
                                </motion.span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{subject.starttime}</span>
                            <span>~</span>
                            <span className="font-medium">{subject.endtime}</span>
                          </div>
                        </div>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.8 }}
                          className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEdit(subject)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm font-medium"
                          >
                            <Edit2 className="h-3 w-3" />
                            수정
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(subject.id)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm font-medium"
                          >
                            <Trash2 className="h-3 w-3" />
                            삭제
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>

            {/* 시간표 */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="xl:w-3/5"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/50">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">📅 주간 시간표</h2>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerate}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-2 px-4 rounded-lg font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={subjects.length === 0 || isLoading}
                  >
                    ✨ 자동 생성
                  </motion.button>
                </div>
                
                <div className="overflow-x-auto rounded-lg">
                  <table className="min-w-full bg-transparent border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="p-3 bg-gray-50/80 border-b border-gray-200 w-20 text-gray-700 font-semibold">시간</th>
                        {days.map((day) => (
                          <th
                            key={day.value}
                            className="p-3 bg-gray-50/80 border-b border-gray-200 text-gray-700 font-semibold"
                          >
                            {day.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hours.map((hour) => (
                        <tr key={hour}>
                          <td className="p-2 font-bold bg-gray-50/50 border-b border-gray-100">{hour}:00</td>
                          {days.map((day) => {
                            const key = `${day.value}-${hour}`
                            const slotSubjects = timetableMap.get(key) || []
                            return (
                              <td className="p-2 border-b border-gray-100 text-center" key={day.value}>
                                <AnimatePresence>
                                  {slotSubjects.map((name, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      whileHover={{ scale: 1.05 }}
                                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                      className="rounded-md bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 text-xs mb-1 shadow-sm cursor-pointer"
                                    >
                                      {name}
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {timetable.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-4xl mb-2"
                    >
                      📋
                    </motion.div>
                    <p className="text-gray-500 text-sm">시간표가 비어있습니다</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* 과목 추가/수정 모달 */}
        <AnimatePresence>
          {showModal && (
            <Modal
              isOpen={showModal}
              onRequestClose={closeModal}
              contentLabel="과목 추가/수정"
              className="bg-white rounded-2xl max-w-md w-full mx-4 p-6 shadow-2xl border border-gray-100"
              overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              ariaHideApp={false}
            >
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{editId ? "과목 수정" : "과목 추가"}</h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeModal}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    ✕
                  </motion.button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleAddOrUpdate()
                  }}
                  className="space-y-4"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">과목명</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="예: 데이터구조"
                      required
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-3 gap-3"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">요일</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">시작</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">종료</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center"
                  >
                    <input
                      id="required"
                      type="checkbox"
                      checked={form.required}
                      onChange={(e) => setForm({ ...form, required: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="required" className="ml-2 text-sm text-gray-700">
                      필수 과목으로 설정
                    </label>
                  </motion.div>

                  <AnimatePresence>
                    {timeError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <p className="text-red-700 text-sm">{timeError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-3 pt-4"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={isLoading}
                    >
                      취소
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {isLoading ? "저장 중..." : editId ? "수정" : "추가"}
                    </motion.button>
                  </motion.div>
                </form>
              </motion.div>
            </Modal>
          )}
        </AnimatePresence>

        {/* 프로필 모달 */}
        <AnimatePresence>
          {showProfileModal && (
            <Modal
              isOpen={showProfileModal}
              onRequestClose={() => setShowProfileModal(false)}
              contentLabel="프로필"
              className="bg-white rounded-2xl max-w-md w-full mx-4 p-6 shadow-2xl border border-gray-100"
              overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              ariaHideApp={false}
            >
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4"
                >
                  <UserIcon className="h-10 w-10 text-white" />
                </motion.div>
                <h2 className="text-xl font-bold mb-1 text-gray-900">{userEmail || "사용자"}</h2>
                <p className="text-gray-500 mb-6">컴퓨터공학과 • 3학년</p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3 text-left"
                >
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">등록된 과목</div>
                    <div className="font-semibold">{subjects.length}개</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">이메일</div>
                    <div className="font-semibold text-sm">{userEmail || "-"}</div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 space-y-2"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowProfileModal(false)
                      router.push("/settings")
                    }}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    설정
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                  >
                    로그아웃
                  </motion.button>
                </motion.div>
              </motion.div>
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
