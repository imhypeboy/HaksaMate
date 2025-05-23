"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Edit, Trash2, TrendingUp, Award, BookOpen } from "lucide-react"
import { isAuthenticated } from "@/lib/auth"
import Modal from "react-modal"

interface Grade {
    id?: number
    semester: string
    subject: string
    credit: number
    grade: string
    score: number
}

interface Semester {
    name: string
    gpa: number
    totalCredits: number
}

export default function GradesPage() {
    const router = useRouter()
    const [grades, setGrades] = useState<Grade[]>([
        { id: 1, semester: "2023-1", subject: "자료구조", credit: 3, grade: "A+", score: 4.5 },
        { id: 2, semester: "2023-1", subject: "알고리즘", credit: 3, grade: "A", score: 4.0 },
        { id: 3, semester: "2023-1", subject: "데이터베이스", credit: 3, grade: "B+", score: 3.5 },
        { id: 4, semester: "2023-2", subject: "운영체제", credit: 3, grade: "A+", score: 4.5 },
        { id: 5, semester: "2023-2", subject: "네트워크", credit: 3, grade: "A", score: 4.0 },
        { id: 6, semester: "2024-1", subject: "소프트웨어공학", credit: 3, grade: "A+", score: 4.5 },
    ])

    const [showModal, setShowModal] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [selectedSemester, setSelectedSemester] = useState("전체")
    const [form, setForm] = useState<Grade>({
        semester: "2024-1",
        subject: "",
        credit: 3,
        grade: "A+",
        score: 4.5,
    })

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

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/auth/login")
        }
        if (typeof window !== "undefined") {
            Modal.setAppElement("body")
        }
    }, [router])

    const getSemesters = (): Semester[] => {
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

    const getOverallGPA = (): number => {
        const totalScore = grades.reduce((sum, grade) => sum + grade.score * grade.credit, 0)
        const totalCredits = grades.reduce((sum, grade) => sum + grade.credit, 0)
        return totalCredits > 0 ? Number((totalScore / totalCredits).toFixed(2)) : 0
    }

    const getFilteredGrades = () => {
        if (selectedSemester === "전체") return grades
        return grades.filter((grade) => grade.semester === selectedSemester)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (editMode && form.id) {
            setGrades(grades.map((grade) => (grade.id === form.id ? form : grade)))
        } else {
            const newGrade = { ...form, id: Date.now() }
            setGrades([...grades, newGrade])
        }
        resetForm()
        setShowModal(false)
    }

    const handleEdit = (grade: Grade) => {
        setForm(grade)
        setEditMode(true)
        setShowModal(true)
    }

    const handleDelete = (id: number) => {
        if (window.confirm("이 성적을 삭제하시겠습니까?")) {
            setGrades(grades.filter((grade) => grade.id !== id))
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
                    성적 관리
                </h1>
            </header>

            <div className="max-w-6xl mx-auto py-8 px-4">
                {/* 통계 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-indigo-500/80 to-purple-500/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-xl border border-white/30">
                        <div className="flex items-center">
                            <Award className="h-8 w-8 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold">전체 평점</h3>
                                <p className="text-3xl font-bold">{overallGPA}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-indigo-500/80 to-purple-500/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-xl border border-white/30">
                        <div className="flex items-center">
                            <BookOpen className="h-8 w-8 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold">총 이수학점</h3>
                                <p className="text-3xl font-bold">{grades.reduce((sum, grade) => sum + grade.credit, 0)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-indigo-500/80 to-purple-500/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-xl border border-white/30">
                        <div className="flex items-center">
                            <TrendingUp className="h-8 w-8 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold">수강 과목</h3>
                                <p className="text-3xl font-bold">{grades.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 학기별 GPA */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        학기별 성적
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {semesters.map((semester) => (
                            <div
                                key={semester.name}
                                className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 backdrop-blur-sm p-4 rounded-xl border border-white/30 shadow-md"
                            >
                                <h3 className="font-semibold text-gray-700">{semester.name}</h3>
                                <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    {semester.gpa}
                                </p>
                                <p className="text-sm text-gray-500">{semester.totalCredits}학점</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 성적 목록 */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">성적 목록</h2>
                        <div className="flex gap-4">
                            <select
                                className="border rounded-md px-3 py-2"
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
                                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl flex items-center shadow-lg hover:shadow-xl transition-all"
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
                                <th className="border p-3 text-left">학기</th>
                                <th className="border p-3 text-left">과목명</th>
                                <th className="border p-3 text-center">학점</th>
                                <th className="border p-3 text-center">등급</th>
                                <th className="border p-3 text-center">평점</th>
                                <th className="border p-3 text-center">관리</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredGrades.map((grade) => (
                                <tr key={grade.id} className="hover:bg-gray-50">
                                    <td className="border p-3">{grade.semester}</td>
                                    <td className="border p-3 font-medium">{grade.subject}</td>
                                    <td className="border p-3 text-center">{grade.credit}</td>
                                    <td className="border p-3 text-center">
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
                                    <td className="border p-3 text-center">{grade.score}</td>
                                    <td className="border p-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handleEdit(grade)} className="text-blue-600 hover:text-blue-800">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(grade.id!)} className="text-red-600 hover:text-red-800">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 성적 추가/수정 모달 */}
            <Modal
                isOpen={showModal}
                onRequestClose={() => setShowModal(false)}
                contentLabel="성적 추가/수정"
                className="bg-white text-gray-900 rounded-xl max-w-md mx-auto mt-24 p-6 shadow-lg outline-none"
                overlayClassName="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center"
                ariaHideApp={false}
            >
                <h2 className="text-xl font-bold mb-4">{editMode ? "성적 수정" : "성적 추가"}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">학기</label>
                            <select
                                className="w-full border rounded-md px-3 py-2"
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
                                className="w-full border rounded-md px-3 py-2"
                                value={form.subject}
                                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">학점</label>
                            <select
                                className="w-full border rounded-md px-3 py-2"
                                value={form.credit}
                                onChange={(e) => setForm({ ...form, credit: Number(e.target.value) })}
                                required
                            >
                                <option value={1}>1학점</option>
                                <option value={2}>2학점</option>
                                <option value={3}>3학점</option>
                                <option value={4}>4학점</option>
                                <option value={5}>5학점</option>
                                <option value={6}>6학점</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">등급</label>
                            <select
                                className="w-full border rounded-md px-3 py-2"
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
                            className="px-4 py-2 rounded bg-gray-100 text-gray-600"
                        >
                            취소
                        </button>
                        <button type="submit" className="px-4 py-2 rounded bg-blue-700 hover:bg-blue-800 text-white">
                            {editMode ? "수정" : "추가"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
