"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import Modal from "react-modal"
import Sidebar from "./sidebar/sidebar"
import { SubjectCard } from "./components/subject-card"
import { SubjectCardSkeleton, TimetableSkeletonRow } from "./components/loading-skeleton"
import { ToastContainer, showToast } from "./components/toast"
import { useRouter } from "next/navigation"
import { UserIcon, Plus, Sparkles, BookOpen, Calendar, Clock, GraduationCap } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useSubjects, type Subject } from "@/hooks/useSubjects"
import { motion, AnimatePresence } from "framer-motion"

type TimetableSlot = {
  dayofweek: string
  starttime: string
  endtime: string
  subject: Subject
}

const SUBJECT_COLORS = [
  "bg-gradient-to-br from-violet-500/90 to-purple-600/90 backdrop-blur-sm",
  "bg-gradient-to-br from-blue-500/90 to-cyan-600/90 backdrop-blur-sm",
  "bg-gradient-to-br from-emerald-500/90 to-teal-600/90 backdrop-blur-sm",
  "bg-gradient-to-br from-rose-500/90 to-pink-600/90 backdrop-blur-sm",
  "bg-gradient-to-br from-amber-500/90 to-orange-600/90 backdrop-blur-sm",
  "bg-gradient-to-br from-indigo-500/90 to-blue-600/90 backdrop-blur-sm",
  "bg-gradient-to-br from-green-500/90 to-emerald-600/90 backdrop-blur-sm",
  "bg-gradient-to-br from-red-500/90 to-rose-600/90 backdrop-blur-sm",
  "bg-gradient-to-br from-purple-500/90 to-violet-600/90 backdrop-blur-sm",
  "bg-gradient-to-br from-cyan-500/90 to-blue-600/90 backdrop-blur-sm",
]

// 애니메이션 variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 50,
    transition: {
      duration: 0.2,
    },
  },
}

export default function Page() {
  const router = useRouter()
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const { subjects, isLoading, addSubject, updateSubject, deleteSubject } = useSubjects(userId)

  const timeOptions = useMemo(
    () =>
      Array.from({ length: 21 }, (_, i) => {
        const hour = Math.floor(i / 2) + 8
        const minute = i % 2 === 0 ? "00" : "30"
        return `${hour.toString().padStart(2, "0")}:${minute}`
      }),
    [],
  )

  const days = useMemo(
    () => [
      { label: "MON", value: "MONDAY", ko: "월" },
      { label: "TUE", value: "TUESDAY", ko: "화" },
      { label: "WED", value: "WEDNESDAY", ko: "수" },
      { label: "THU", value: "THURSDAY", ko: "목" },
      { label: "FRI", value: "FRIDAY", ko: "금" },
      { label: "SAT", value: "SATURDAY", ko: "토" },
      { label: "SUN", value: "SUNDAY", ko: "일" },
    ],
    [],
  )

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 9), [])

  // 과목별 색상 매핑 (개선된 해시 함수)
  const getSubjectColor = useCallback((subjectName: string) => {
    let hash = 0
    for (let i = 0; i < subjectName.length; i++) {
      const char = subjectName.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 32bit 정수로 변환
    }
    return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length]
  }, [])

  // 인증 체크
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
  }, [router])

  // Note: Error handling is now done within individual functions

  const timeToMinutes = useCallback((time: string) => {
    const [h, m] = time.split(":").map(Number)
    return h * 60 + m
  }, [])

  const handleStartTimeChange = useCallback(
    (starttime: string) => {
      const startIndex = timeOptions.findIndex((t) => t === starttime)
      const defaultEnd = timeOptions[startIndex + 2] || ""
      setForm((prev) => ({ ...prev, starttime, endtime: defaultEnd }))
    },
    [timeOptions],
  )

  const validateForm = useCallback(() => {
    if (!form.name || !form.starttime || !form.endtime) {
      setTimeError("모든 입력을 채워주세요.")
      return false
    }
    if (timeToMinutes(form.starttime) >= timeToMinutes(form.endtime)) {
      setTimeError("종료 시간이 시작 시간보다 늦어야 합니다.")
      return false
    }
    const lastTimeOption = timeOptions[timeOptions.length - 1]
    if (timeToMinutes(form.endtime) > timeToMinutes(lastTimeOption)) {
      setTimeError(`종료 시간은 ${lastTimeOption}를 넘을 수 없습니다.`)
      return false
    }
    return true
  }, [form, timeToMinutes, timeOptions])

  const handleAddOrUpdate = async () => {
    if (!validateForm()) return

    setTimeError(null)

    try {
      if (editId) {
        await updateSubject(editId, form)
        showToast({
          type: "success",
          title: "과목 수정 완료",
          message: `${form.name} 과목이 수정되었습니다.`,
        })
      } else {
        await addSubject(form)
        showToast({
          type: "success",
          title: "과목 추가 완료",
          message: `${form.name} 과목이 추가되었습니다.`,
        })
      }

      setForm({ name: "", dayofweek: "MONDAY", starttime: "", endtime: "", required: false })
      setEditId(null)
      setShowModal(false)
    } catch (err) {
      showToast({
        type: "error",
        title: "저장 실패",
        message: "저장 중 오류가 발생했습니다. 다시 시도해주세요.",
      })
    }
  }

  const handleEdit = useCallback((subject: Subject) => {
    setForm({
      name: subject.name,
      dayofweek: subject.dayofweek,
      starttime: subject.starttime,
      endtime: subject.endtime,
      required: subject.required,
    })
    setEditId(subject.id || null)
    setShowModal(true)
  }, [])

  const handleDelete = useCallback(
    async (id?: number) => {
      if (!id) return
      try {
        const subject = subjects.find((s) => s.id === id)
        await deleteSubject(id)
        showToast({
          type: "success",
          title: "과목 삭제 완료",
          message: `${subject?.name || "과목"}이 삭제되었습니다.`,
        })
      } catch (err) {
        showToast({
          type: "error",
          title: "삭제 실패",
          message: "삭제 중 오류가 발생했습니다.",
        })
      }
    },
    [subjects, deleteSubject],
  )

  const handleGenerate = async () => {
    if (subjects.length === 0) {
      showToast({
        type: "warning",
        title: "과목이 없습니다",
        message: "시간표를 생성하려면 먼저 과목을 추가해주세요.",
      })
      return
    }

    setIsGenerating(true)

    try {
      // 시뮬레이션을 위한 딜레이
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const required = subjects.filter((s) => s.required)
      const optional = subjects.filter((s) => !s.required)
      const optionalShuffled = optional.sort(() => Math.random() - 0.5)

      const selected: Subject[] = [...required]
      const occupied: { [key: string]: [number, number][] } = {}

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
        const overlap = occupied[d].some(([os, oe]) => Math.max(os, s) < Math.min(oe, e))
        if (!overlap) {
          selected.push(subj)
          occupied[d].push([s, e])
        }
      }

      const newTimetable: TimetableSlot[] = selected.map((subject) => ({
        dayofweek: subject.dayofweek,
        starttime: subject.starttime,
        endtime: subject.endtime,
        subject,
      }))

      setTimetable(newTimetable)

      showToast({
        type: "success",
        title: "시간표 생성 완료",
        message: `${newTimetable.length}개 과목으로 시간표가 생성되었습니다.`,
      })
    } catch (err) {
      showToast({
        type: "error",
        title: "생성 실패",
        message: "시간표 생성 중 오류가 발생했습니다.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const timetableMap = useMemo(() => {
    const map = new Map<string, Subject[]>()
    timetable.forEach((slot) => {
      const startHour = Number.parseInt(slot.starttime.split(":")[0], 10)
      const endHour = Number.parseInt(slot.endtime.split(":")[0], 10)
      for (let hour = startHour; hour < endHour; hour++) {
        const key = `${slot.dayofweek}-${hour}`
        const existing = map.get(key) || []
        map.set(key, [...existing, slot.subject])
      }
    })
    return map
  }, [timetable])

  const resetForm = useCallback(() => {
    setForm({ name: "", dayofweek: "MONDAY", starttime: "", endtime: "", required: false })
    setTimeError(null)
    setEditId(null)
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(false)
    resetForm()
  }, [resetForm])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUserEmail(null)
    setUserId(null)
    router.push("/auth/login")
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden"
      >
        {/* 🎨 고급 글래스모피즘 배경 장식 요소들 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-violet-400/10 to-pink-600/10 rounded-full blur-3xl"
          />
        </div>

        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="flex-1 font-sans lg:ml-0 relative z-10">
          {/* 🎭 Header with Enhanced Animations */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="sticky top-0 z-40 backdrop-blur-xl bg-white/30 border-b border-white/20 shadow-lg"
          >
            <div className="flex justify-between items-center px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex items-center gap-2 sm:gap-4"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
                  >
                    <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </motion.div>
                  <div>
                    <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                      HaksaMate
                    </span>
                    <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>스마트 시간표 관리</span>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                onClick={() => setShowProfileModal(true)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl flex items-center justify-center hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-400/50"
                aria-label="프로필"
              >
                <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </motion.button>
            </div>
          </motion.header>

          {/* 🌈 Main Content with Modern Design */}
          <div className="flex flex-col-reverse xl:flex-row gap-4 sm:gap-6 lg:gap-8 p-3 sm:p-6 lg:p-8 max-w-[95rem] mx-auto">
            {/* 과목 관리 섹션 */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="xl:w-[45%] space-y-4 sm:space-y-6"
            >
                              <div className="backdrop-blur-xl bg-white/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/30 hover:bg-white/50 transition-all duration-500">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <motion.h2
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3 flex-wrap"
                  >
                    <motion.div
                      whileHover={{ rotate: 180, scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                      className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                    >
                      <BookOpen className="h-4 w-4 text-white" />
                    </motion.div>
                    <span className="whitespace-nowrap">등록된 과목</span>
                    <span className="text-base sm:text-lg font-normal text-gray-500 bg-gray-100/80 px-3 py-1 rounded-full">
                      {subjects.length}개
                    </span>
                  </motion.h2>
                  <motion.button
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.7, type: "spring", stiffness: 200, damping: 15 }}
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      resetForm()
                      setShowModal(true)
                    }}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300/50 backdrop-blur-sm border border-white/20 flex items-center justify-center"
                    disabled={isLoading}
                    aria-label="과목 추가"
                  >
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                  </motion.button>
                </div>

                {isLoading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6"
                  >
                    {Array.from({ length: 4 }).map((_, i) => (
                      <SubjectCardSkeleton key={i} />
                    ))}
                  </motion.div>
                ) : subjects.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="text-center py-16"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                      className="text-8xl mb-6"
                    >
                      📚
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">아직 등록된 과목이 없어요</h3>
                    <p className="text-gray-500 mb-6">과목을 추가해서 나만의 시간표를 만들어보세요</p>
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-medium shadow-lg cursor-pointer"
                      onClick={() => {
                        resetForm()
                        setShowModal(true)
                      }}
                    >
                      <Plus className="h-4 w-4" />첫 번째 과목 추가하기
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-4 sm:gap-6"
                  >
                    <AnimatePresence>
                      {subjects.map((subject) => (
                        <SubjectCard
                          key={subject.id}
                          subject={subject}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          dayLabel={days.find((d) => d.value === subject.dayofweek)?.ko || ""}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}


              </div>
            </motion.div>

            {/* 시간표 섹션 */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="xl:w-[55%]"
            >
              <div className="backdrop-blur-xl bg-white/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/30 hover:bg-white/50 transition-all duration-500">
                <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-4">
                  <motion.h2
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3"
                  >
                    <motion.div
                      whileHover={{ rotate: 180, scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                      className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"
                    >
                      <Calendar className="h-4 w-4 text-white" />
                    </motion.div>
                    <span className="whitespace-nowrap">주간 시간표</span>
                  </motion.h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-sm text-gray-500 bg-gray-100/80 px-4 py-2 rounded-full font-medium whitespace-nowrap">
                      {timetable.length}개 과목 배치됨
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGenerate}
                      disabled={subjects.length === 0 || isGenerating}
                      className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 px-4 sm:py-3 sm:px-6 rounded-xl font-bold shadow-lg transition-all disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base backdrop-blur-sm whitespace-nowrap"
                    >
                      {isGenerating ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span className="hidden sm:inline">생성 중...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span className="hidden sm:inline">✨ AI 시간표 자동 생성</span>
                          <span className="sm:hidden">✨ 자동 생성</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl">
                  <div className="min-w-[350px] sm:min-w-[600px] lg:min-w-[700px]">
                    <table className="w-full border-collapse rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm bg-white/30">
                      <thead>
                        <tr>
                          <th className="w-16 sm:w-20 p-2 sm:p-4 text-center text-xs sm:text-sm font-bold text-gray-700 bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mx-auto mb-1" />
                            <span className="hidden sm:block">시간</span>
                          </th>
                          {days.map((day) => (
                            <th
                              key={day.value}
                              className="p-2 sm:p-4 text-center text-xs sm:text-sm font-bold text-gray-700 bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <span className="hidden lg:block font-bold">{day.label}</span>
                                <span className="lg:hidden font-bold text-xs sm:text-sm">{day.ko}</span>
                                <span className="hidden sm:block text-xs text-gray-500 font-normal">{day.ko}요일</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {isGenerating
                          ? Array.from({ length: 8 }).map((_, i) => <TimetableSkeletonRow key={i} />)
                          : hours.map((hour, hourIndex) => (
                              <motion.tr
                                key={hour}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: hourIndex * 0.05 + 0.9, duration: 0.4 }}
                                className="hover:bg-white/20 transition-all duration-300"
                              >
                                <td className="p-1 sm:p-3 text-center text-xs sm:text-sm font-bold text-gray-600 bg-gradient-to-r from-gray-50/50 to-gray-100/50 backdrop-blur-sm">
                                  <div className="flex flex-col items-center">
                                    <span className="text-sm sm:text-lg">{hour}</span>
                                    <span className="text-[10px] sm:text-xs text-gray-400">:00</span>
                                  </div>
                                </td>
                                {days.map((day) => {
                                  const key = `${day.value}-${hour}`
                                  const slotSubjects = timetableMap.get(key) || []
                                  return (
                                    <td key={day.value} className="p-1 sm:p-2 border-l border-white/30 relative min-h-[60px] sm:min-h-[80px]">
                                      <AnimatePresence>
                                        {slotSubjects.map((subject, i) => (
                                          <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.8, y: -10 }}
                                            whileHover={{
                                              scale: 1.05,
                                              y: -2,
                                              transition: { type: "spring", stiffness: 400, damping: 10 },
                                            }}
                                            transition={{
                                              type: "spring",
                                              stiffness: 500,
                                              damping: 30,
                                              delay: i * 0.1,
                                            }}
                                            className={`${getSubjectColor(subject.name)} text-white text-[10px] sm:text-xs font-bold px-1 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl shadow-lg mb-1 last:mb-0 cursor-pointer border border-white/20`}
                                            title={`${subject.name} (${subject.starttime}~${subject.endtime})`}
                                          >
                                            <div className="truncate text-center leading-tight">{subject.name}</div>
                                            <div className="text-[8px] sm:text-[10px] text-white/80 text-center mt-0.5 sm:mt-1 leading-tight">
                                              {subject.starttime}~{subject.endtime}
                                            </div>
                                          </motion.div>
                                        ))}
                                      </AnimatePresence>
                                    </td>
                                  )
                                })}
                              </motion.tr>
                            ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {timetable.length === 0 && !isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.6 }}
                    className="text-center py-16"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, -5, 5, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                      className="text-6xl mb-4"
                    >
                      📋
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">시간표가 비어있어요</h3>
                    <p className="text-gray-500">과목을 추가하고 자동 생성을 눌러보세요</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* 🎭 Mobile FAB - only show on mobile when no other add buttons are visible */}
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 1.2, type: "spring", stiffness: 200, damping: 15 }}
            whileHover={{
              scale: 1.1,
              rotate: 90,
              boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)",
            }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-2xl shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300/50 z-50 backdrop-blur-sm border border-white/20 xl:hidden"
            disabled={isLoading}
            aria-label="과목 추가"
          >
            <Plus className="h-6 w-6 sm:h-8 sm:w-8 mx-auto" />
          </motion.button>

          {/* 🎨 Enhanced Modal with Glassmorphism */}
          <AnimatePresence>
            {showModal && (
              <Modal
                isOpen={showModal}
                onRequestClose={closeModal}
                contentLabel="과목 추가/수정"
                className="backdrop-blur-xl bg-white/90 rounded-3xl max-w-lg w-full mx-4 p-8 shadow-2xl border border-white/50"
                overlayClassName="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                ariaHideApp={false}
              >
                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <motion.div
                        whileHover={{ rotate: 180, scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                        className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                      >
                        <Plus className="h-4 w-4 text-white" />
                      </motion.div>
                      {editId ? "과목 수정" : "과목 추가"}
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={closeModal}
                      className="w-10 h-10 rounded-xl bg-gray-100/80 hover:bg-gray-200/80 flex items-center justify-center transition-all duration-200"
                      aria-label="닫기"
                    >
                      ✕
                    </motion.button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleAddOrUpdate()
                    }}
                    className="space-y-6"
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        과목명 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full border-2 border-gray-200/50 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all backdrop-blur-sm bg-white/80"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="예: 데이터구조와 알고리즘"
                        required
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="grid grid-cols-3 gap-4"
                    >
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          요일 <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="w-full border-2 border-gray-200/50 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all backdrop-blur-sm bg-white/80"
                          value={form.dayofweek}
                          onChange={(e) => setForm({ ...form, dayofweek: e.target.value })}
                          required
                        >
                          {days.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.ko}요일
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          시작 <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="w-full border-2 border-gray-200/50 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all backdrop-blur-sm bg-white/80"
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
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          종료 <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="w-full border-2 border-gray-200/50 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all backdrop-blur-sm bg-white/80"
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
                      className="flex items-center gap-3 p-4 bg-gray-50/80 rounded-2xl backdrop-blur-sm"
                    >
                      <input
                        id="required"
                        type="checkbox"
                        checked={form.required}
                        onChange={(e) => setForm({ ...form, required: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:ring-2"
                      />
                      <label htmlFor="required" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span className="text-red-500">⭐</span>
                        필수 과목으로 설정 (시간표 생성 시 우선 배치)
                      </label>
                    </motion.div>

                    <AnimatePresence>
                      {timeError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          className="p-4 bg-red-50/80 border-2 border-red-200/50 rounded-2xl backdrop-blur-sm"
                        >
                          <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                            <span>⚠️</span>
                            {timeError}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex gap-4 pt-6"
                    >
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={closeModal}
                        className="flex-1 py-3 px-6 border-2 border-gray-300/50 rounded-2xl text-gray-700 hover:bg-gray-50/80 transition-all font-medium backdrop-blur-sm"
                        disabled={isLoading}
                      >
                        취소
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg backdrop-blur-sm"
                        disabled={isLoading}
                      >
                        {isLoading ? "저장 중..." : editId ? "✏️ 수정" : "➕ 추가"}
                      </motion.button>
                    </motion.div>
                  </form>
                </motion.div>
              </Modal>
            )}
          </AnimatePresence>

          {/* 🎨 Enhanced Profile Modal */}
          <AnimatePresence>
            {showProfileModal && (
              <Modal
                isOpen={showProfileModal}
                onRequestClose={() => setShowProfileModal(false)}
                contentLabel="프로필"
                className="backdrop-blur-xl bg-white/90 rounded-3xl max-w-md w-full mx-4 p-8 shadow-2xl border border-white/50"
                overlayClassName="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-2xl"
                  >
                    <UserIcon className="h-12 w-12 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-900">{userEmail || "사용자"}</h2>
                  <p className="text-gray-500 mb-8 flex items-center justify-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    컴퓨터공학과 • 3학년
                  </p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4 text-left mb-8"
                  >
                    <div className="p-4 bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-2xl backdrop-blur-sm border border-white/30">
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        등록된 과목
                      </div>
                      <div className="font-bold text-xl text-gray-900">{subjects.length}개</div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-2xl backdrop-blur-sm border border-white/30">
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        생성된 시간표
                      </div>
                      <div className="font-bold text-xl text-gray-900">{timetable.length}개 과목</div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-gray-50/80 to-slate-50/80 rounded-2xl backdrop-blur-sm border border-white/30">
                      <div className="text-sm text-gray-600">이메일</div>
                      <div className="font-semibold text-sm text-gray-900 truncate">{userEmail || "-"}</div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-3"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowProfileModal(false)
                        router.push("/settings")
                      }}
                      className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl transition-all font-bold shadow-lg"
                    >
                      ⚙️ 설정
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleLogout}
                      className="w-full py-3 px-6 bg-gray-100/80 hover:bg-gray-200/80 text-gray-800 rounded-2xl transition-all font-medium backdrop-blur-sm"
                    >
                      🚪 로그아웃
                    </motion.button>
                  </motion.div>
                </motion.div>
              </Modal>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <ToastContainer />
    </>
  )
}
