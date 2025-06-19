"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, TrendingUp, Award, BookOpen } from "lucide-react"
import Modal from "react-modal"
import Sidebar from "../sidebar/sidebar"
import { fetchGrades, addGrade, updateGrade, deleteGrade, type Grade } from "@/lib/gradesApi"
import { supabase } from "@/lib/supabaseClient"

const gradeToScore = {
  "A+": 4.5,
  A: 4.0,
  "B+": 3.5,
  B: 3.0,
  "C+": 2.5,
  C: 2.0,
  "D+": 1.5,
  D: 1.0,
  F: 0.0,
}

export default function GradesPage() {
  const router = useRouter()
  const [grades, setGrades] = useState<Grade[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedSemester, setSelectedSemester] = useState("전체")
  const [sidebarOpen, setSidebarOpen] = useState(true) // 사이드바 상태 추가
  const [form, setForm] = useState<Grade>({
    semester: "2024-1",
    subject: "",
    credit: 3,
    grade: "A+",
    score: 4.5,
  })
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 로그인 인증 및 userId 추출
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth/login")
        return
      }
      setUserId(session.user.id)
      if (typeof window !== "undefined") {
        Modal.setAppElement("body")
      }
    }
    check()
  }, [router])

  useEffect(() => {
    if (!userId) return
    loadGrades(userId)
  }, [userId])

  const loadGrades = async (uid: string) => {
    setIsLoading(true)
    try {
      const list = await fetchGrades(uid)
      setGrades(list)
    } catch (e) {
      alert("성적 불러오기 오류")
    } finally {
      setIsLoading(false)
    }
  }

  const getSemesters = () => {
    const semesterMap = new Map<string, { totalScore: number; totalCredits: number }>()
    grades.forEach((grade) => {
      if (!semesterMap.has(grade.semester)) {
        semesterMap.set(grade.semester, { totalScore: 0, totalCredits: 0 })
      }
      const semester = semesterMap.get(grade.semester)!
      semester.totalScore += grade.score * grade.credit
      semester.totalCredits += grade.credit
    })
    return Array.from(semesterMap.entries())
      .map(([name, data]) => ({
        name,
        gpa: data.totalCredits > 0 ? Number((data.totalScore / data.totalCredits).toFixed(2)) : 0,
        totalCredits: data.totalCredits,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  const getOverallGPA = () => {
    const totalScore = grades.reduce((sum, grade) => sum + grade.score * grade.credit, 0)
    const totalCredits = grades.reduce((sum, grade) => sum + grade.credit, 0)
    return totalCredits > 0 ? Number((totalScore / totalCredits).toFixed(2)) : 0
  }

  const getFilteredGrades = () => {
    if (selectedSemester === "전체") return grades
    return grades.filter((grade) => grade.semester === selectedSemester)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    try {
      if (editMode && form.id) {
        await updateGrade(form, userId)
      } else {
        await addGrade(
          {
            semester: form.semester,
            subject: form.subject,
            credit: form.credit,
            grade: form.grade,
            score: form.score,
          },
          userId,
        )
      }
      await loadGrades(userId)
      resetForm()
      setShowModal(false)
    } catch (err) {
      alert("저장 오류")
    }
  }

  const handleEdit = (grade: Grade) => {
    setForm({ ...grade })
    setEditMode(true)
    setShowModal(true)
  }

  const handleDeleteLocal = async (id?: number) => {
    if (!userId || !id) return
    if (window.confirm("이 성적을 삭제하시겠습니까?")) {
      try {
        await deleteGrade(id, userId)
        await loadGrades(userId)
      } catch {
        alert("삭제 오류")
      }
    }
  }

  const resetForm = () => {
    setForm({
      semester: "2024-1",
      subject: "",
      credit: 3,
      grade: "A+",
      score: 4.5,
    })
    setEditMode(false)
  }

  const handleGradeChange = (grade: string) => {
    setForm({ ...form, grade, score: gradeToScore[grade as keyof typeof gradeToScore] })
  }

  const semesters = getSemesters()
  const overallGPA = getOverallGPA()
  const filteredGrades = getFilteredGrades()

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* 사이드바 추가 */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* 메인 콘텐츠 */}
      <div className="flex-1 font-sans pb-12">
        <header className="bg-white text-gray-800 py-6 px-4 flex justify-between items-center shadow-sm border-b border-gray-200">
          <div className="w-10"></div>
          <h1 className="text-2xl font-bold text-gray-900">성적 관리</h1>
          <div className="w-10"></div>
        </header>

        <div className="max-w-6xl mx-auto py-8 px-4">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">전체 평점</h3>
                  <p className="text-3xl font-bold text-blue-600">{overallGPA}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">총 이수학점</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {grades.reduce((sum, grade) => sum + grade.credit, 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">수강 과목</h3>
                  <p className="text-3xl font-bold text-purple-600">{grades.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 학기별 GPA */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-900">학기별 성적</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {semesters.map((semester) => (
                <div key={semester.name} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-700">{semester.name}</h3>
                  <p className="text-2xl font-bold text-blue-600">{semester.gpa}</p>
                  <p className="text-sm text-gray-500">{semester.totalCredits}학점</p>
                </div>
              ))}
            </div>
          </div>

          {/* 성적 목록 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">성적 목록</h2>
              <div className="flex gap-4">
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                >
                  <option value="전체">전체 학기</option>
                  {semesters.map((semester) => (
                    <option key={semester.name} value={semester.name}>
                      {semester.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    resetForm()
                    setShowModal(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  성적 추가
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">학기</th>
                    <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">과목명</th>
                    <th className="border border-gray-200 p-3 text-center font-semibold text-gray-900">학점</th>
                    <th className="border border-gray-200 p-3 text-center font-semibold text-gray-900">등급</th>
                    <th className="border border-gray-200 p-3 text-center font-semibold text-gray-900">평점</th>
                    <th className="border border-gray-200 p-3 text-center font-semibold text-gray-900">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrades.map((grade) => (
                    <tr key={grade.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-3">{grade.semester}</td>
                      <td className="border border-gray-200 p-3 font-medium">{grade.subject}</td>
                      <td className="border border-gray-200 p-3 text-center">{grade.credit}</td>
                      <td className="border border-gray-200 p-3 text-center">
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            grade.grade === "A+" || grade.grade === "A"
                              ? "bg-green-100 text-green-800"
                              : grade.grade === "B+" || grade.grade === "B"
                                ? "bg-blue-100 text-blue-800"
                                : grade.grade === "C+" || grade.grade === "C"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {grade.grade}
                        </span>
                      </td>
                      <td className="border border-gray-200 p-3 text-center">{grade.score}</td>
                      <td className="border border-gray-200 p-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(grade)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLocal(grade.id!)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {isLoading && (
                <div className="py-10 text-center text-lg text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-3"></div>
                  불러오는 중...
                </div>
              )}
              {!isLoading && filteredGrades.length === 0 && (
                <div className="py-10 text-center text-lg text-gray-500">등록된 성적이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 성적 추가/수정 모달 */}
      <Modal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        contentLabel="성적 추가/수정"
        className="bg-white text-gray-900 rounded-xl max-w-md mx-auto mt-24 p-6 shadow-lg outline-none border border-gray-200"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        ariaHideApp={false}
      >
        <h2 className="text-xl font-bold mb-4 text-gray-900">{editMode ? "성적 수정" : "성적 추가"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학기</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                required
              >
                <option value="2024-1">2024-1</option>
                <option value="2023-2">2023-2</option>
                <option value="2023-1">2023-1</option>
                <option value="2022-2">2022-2</option>
                <option value="2022-1">2022-1</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">과목명</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학점</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={form.credit}
                onChange={(e) => setForm({ ...form, credit: Number(e.target.value) })}
                required
              >
                {[1, 2, 3, 4, 5, 6].map((v) => (
                  <option key={v} value={v}>
                    {v}학점
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">등급</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={form.grade}
                onChange={(e) => handleGradeChange(e.target.value)}
                required
              >
                <option value="A+">A+ (4.5)</option>
                <option value="A">A (4.0)</option>
                <option value="B+">B+ (3.5)</option>
                <option value="B">B (3.0)</option>
                <option value="C+">C+ (2.5)</option>
                <option value="C">C (2.0)</option>
                <option value="D+">D+ (1.5)</option>
                <option value="D">D (1.0)</option>
                <option value="F">F (0.0)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
            >
              {editMode ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
