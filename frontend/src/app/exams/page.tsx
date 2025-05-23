"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { isAuthenticated } from "@/lib/auth"
import Modal from "react-modal"

interface Exam {
    id?: number
    subject: string
    type: "중간고사" | "기말고사" | "퀴즈" | "과제"
    date: string
    time: string
    location: string
    status: "예정" | "진행중" | "완료"
    studyPlan: string
    result?: string
    score?: number
}

interface ChecklistItem {
    id: number
    examId: number
    task: string
    completed: boolean
}

export default function ExamsPage() {
    const router = useRouter()
    const [exams, setExams] = useState<Exam[]>([
        {
            id: 1,
            subject: "자료구조",
            type: "중간고사",
            date: "2024-04-15",
            time: "10:00",
            location: "공학관 201호",
            status: "완료",
            studyPlan: "교재 1-5장 복습, 실습 문제 풀이",
            result: "A+",
            score: 95,
        },
        {
            id: 2,
            subject: "알고리즘",
            type: "기말고사",
            date: "2024-06-20",
            time: "14:00",
            location: "공학관 301호",
            status: "예정",
            studyPlan: "정렬 알고리즘, 그래프 알고리즘 집중 학습",
        },
        {
            id: 3,
            subject: "데이터베이스",
            type: "퀴즈",
            date: "2024-05-25",
            time: "09:00",
            location: "온라인",
            status: "예정",
            studyPlan: "SQL 쿼리 연습",
        },
    ])

    const [checklist, setChecklist] = useState<ChecklistItem[]>([
        { id: 1, examId: 2, task: "교재 6-10장 읽기", completed: false },
        { id: 2, examId: 2, task: "과제 문제 복습", completed: true },
        { id: 3, examId: 2, task: "모의고사 풀기", completed: false },
        { id: 4, examId: 3, task: "SQL 기본 문법 정리", completed: false },
        { id: 5, examId: 3, task: "실습 예제 풀이", completed: true },
    ])

    const [showModal, setShowModal] = useState(false)
    const [showChecklistModal, setShowChecklistModal] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
    const [newChecklistItem, setNewChecklistItem] = useState("")
    const [form, setForm] = useState<Exam>({
        subject: "",
        type: "중간고사",
        date: "",
        time: "",
        location: "",
        status: "예정",
        studyPlan: "",
    })

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/auth/login")
        }
        if (typeof window !== "undefined") {
            Modal.setAppElement("body")
        }
    }, [router])

    const getUpcomingExams = () => {
        const today = new Date()
        return exams
            .filter((exam) => exam.status === "예정" && new Date(exam.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 3)
    }

    const getExamsByStatus = (status: string) => {
        if (status === "전체") return exams
        return exams.filter((exam) => exam.status === status)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (editMode && form.id) {
            setExams(exams.map((exam) => (exam.id === form.id ? form : exam)))
        } else {
            const newExam = { ...form, id: Date.now() }
            setExams([...exams, newExam])
        }
        resetForm()
        setShowModal(false)
    }

    const handleEdit = (exam: Exam) => {
        setForm(exam)
        setEditMode(true)
        setShowModal(true)
    }

    const handleDelete = (id: number) => {
        if (window.confirm("이 시험 일정을 삭제하시겠습니까?")) {
            setExams(exams.filter((exam) => exam.id !== id))
            setChecklist(checklist.filter((item) => item.examId !== id))
        }
    }

    const resetForm = () => {
        setForm({
            subject: "",
            type: "중간고사",
            date: "",
            time: "",
            location: "",
            status: "예정",
            studyPlan: "",
        })
        setEditMode(false)
    }

    const openChecklistModal = (exam: Exam) => {
        setSelectedExam(exam)
        setShowChecklistModal(true)
    }

    const addChecklistItem = () => {
        if (newChecklistItem.trim() && selectedExam) {
            const newItem: ChecklistItem = {
                id: Date.now(),
                examId: selectedExam.id!,
                task: newChecklistItem.trim(),
                completed: false,
            }
            setChecklist([...checklist, newItem])
            setNewChecklistItem("")
        }
    }

    const toggleChecklistItem = (id: number) => {
        setChecklist(checklist.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)))
    }

    const deleteChecklistItem = (id: number) => {
        setChecklist(checklist.filter((item) => item.id !== id))
    }

    const getChecklistForExam = (examId: number) => {
        return checklist.filter((item) => item.examId === examId)
    }

    const upcomingExams = getUpcomingExams()

    return (
        <div className="min-h-screen bg-white text-gray-900">
            <header className="bg-blue-700 text-white py-4 px-6 flex items-center shadow-md">
                <button
                    onClick={() => router.push("/")}
                    className="mr-4 hover:bg-blue-600 p-2 rounded-full transition-colors"
                    aria-label="뒤로 가기"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-xl font-bold">시험 일정 관리</h1>
            </header>

            <div className="max-w-6xl mx-auto py-8 px-4">
                {/* 다가오는 시험 */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-lg shadow-lg mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        <AlertCircle className="h-6 w-6 mr-2" />
                        다가오는 시험
                    </h2>
                    {upcomingExams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {upcomingExams.map((exam) => (
                                <div key={exam.id} className="bg-white bg-opacity-20 p-4 rounded-lg">
                                    <h3 className="font-semibold">{exam.subject}</h3>
                                    <p className="text-sm opacity-90">{exam.type}</p>
                                    <p className="text-sm opacity-90">
                                        {new Date(exam.date).toLocaleDateString()} {exam.time}
                                    </p>
                                    <p className="text-sm opacity-90">{exam.location}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-white opacity-90">예정된 시험이 없습니다.</p>
                    )}
                </div>

                {/* 시험 목록 */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">시험 목록</h2>
                        <button
                            onClick={() => {
                                resetForm()
                                setShowModal(true)
                            }}
                            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md flex items-center"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            시험 추가
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {exams.map((exam) => (
                            <div key={exam.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-semibold">{exam.subject}</h3>
                                        <span
                                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                exam.type === "중간고사" || exam.type === "기말고사"
                                                    ? "bg-red-100 text-red-800"
                                                    : exam.type === "퀴즈"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-blue-100 text-blue-800"
                                            }`}
                                        >
                      {exam.type}
                    </span>
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                            exam.status === "완료"
                                                ? "bg-green-100 text-green-800"
                                                : exam.status === "진행중"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-gray-100 text-gray-800"
                                        }`}
                                    >
                    {exam.status}
                  </span>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        {new Date(exam.date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-2" />
                                        {exam.time} | {exam.location}
                                    </div>
                                </div>

                                {exam.studyPlan && (
                                    <div className="mb-4">
                                        <p className="text-sm font-medium text-gray-700 mb-1">학습 계획:</p>
                                        <p className="text-sm text-gray-600">{exam.studyPlan}</p>
                                    </div>
                                )}

                                {exam.result && (
                                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                                        <p className="text-sm font-medium text-green-800">
                                            결과: {exam.result} ({exam.score}점)
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-between items-center">
                                    <button
                                        onClick={() => openChecklistModal(exam)}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        체크리스트 ({getChecklistForExam(exam.id!).filter((item) => item.completed).length}/
                                        {getChecklistForExam(exam.id!).length})
                                    </button>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(exam)} className="text-blue-600 hover:text-blue-800">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(exam.id!)} className="text-red-600 hover:text-red-800">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 시험 추가/수정 모달 */}
            <Modal
                isOpen={showModal}
                onRequestClose={() => setShowModal(false)}
                contentLabel="시험 추가/수정"
                className="bg-white text-gray-900 rounded-xl max-w-md mx-auto mt-24 p-6 shadow-lg outline-none"
                overlayClassName="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center"
                ariaHideApp={false}
            >
                <h2 className="text-xl font-bold mb-4">{editMode ? "시험 수정" : "시험 추가"}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">시험 유형</label>
                            <select
                                className="w-full border rounded-md px-3 py-2"
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value as Exam["type"] })}
                                required
                            >
                                <option value="중간고사">중간고사</option>
                                <option value="기말고사">기말고사</option>
                                <option value="퀴즈">퀴즈</option>
                                <option value="과제">과제</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
                                <input
                                    type="date"
                                    className="w-full border rounded-md px-3 py-2"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">시간</label>
                                <input
                                    type="time"
                                    className="w-full border rounded-md px-3 py-2"
                                    value={form.time}
                                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">장소</label>
                            <input
                                type="text"
                                className="w-full border rounded-md px-3 py-2"
                                value={form.location}
                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                            <select
                                className="w-full border rounded-md px-3 py-2"
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value as Exam["status"] })}
                                required
                            >
                                <option value="예정">예정</option>
                                <option value="진행중">진행중</option>
                                <option value="완료">완료</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">학습 계획</label>
                            <textarea
                                className="w-full border rounded-md px-3 py-2"
                                rows={3}
                                value={form.studyPlan}
                                onChange={(e) => setForm({ ...form, studyPlan: e.target.value })}
                                placeholder="시험 준비 계획을 입력하세요"
                            />
                        </div>
                        {form.status === "완료" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">결과</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-md px-3 py-2"
                                        value={form.result || ""}
                                        onChange={(e) => setForm({ ...form, result: e.target.value })}
                                        placeholder="예: A+, B, C 등"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">점수</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded-md px-3 py-2"
                                        value={form.score || ""}
                                        onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
                                        placeholder="점수 입력"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            </>
                        )}
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

            {/* 체크리스트 모달 */}
            <Modal
                isOpen={showChecklistModal}
                onRequestClose={() => setShowChecklistModal(false)}
                contentLabel="시험 준비 체크리스트"
                className="bg-white text-gray-900 rounded-xl max-w-lg mx-auto mt-24 p-6 shadow-lg outline-none"
                overlayClassName="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center"
                ariaHideApp={false}
            >
                <h2 className="text-xl font-bold mb-4">{selectedExam?.subject} - 준비 체크리스트</h2>

                <div className="mb-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 border rounded-md px-3 py-2"
                            value={newChecklistItem}
                            onChange={(e) => setNewChecklistItem(e.target.value)}
                            placeholder="새 할일 추가"
                            onKeyPress={(e) => e.key === "Enter" && addChecklistItem()}
                        />
                        <button
                            onClick={addChecklistItem}
                            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md"
                        >
                            추가
                        </button>
                    </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {getChecklistForExam(selectedExam?.id || 0).map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 border rounded">
                            <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => toggleChecklistItem(item.id)}
                                className="h-4 w-4"
                            />
                            <span className={`flex-1 ${item.completed ? "line-through text-gray-500" : ""}`}>{item.task}</span>
                            <button onClick={() => deleteChecklistItem(item.id)} className="text-red-600 hover:text-red-800">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end mt-6">
                    <button onClick={() => setShowChecklistModal(false)} className="px-4 py-2 rounded bg-gray-100 text-gray-600">
                        닫기
                    </button>
                </div>
            </Modal>
        </div>
    )
}
