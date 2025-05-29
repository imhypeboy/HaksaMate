"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Clock, CheckCircle } from "lucide-react"
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
        },
        {
            id: 2,
            subject: "알고리즘",
            type: "기말고사",
            date: "2024-06-20",
            time: "14:00",
            location: "공학관 301호",
            status: "예정",
        },
        {
            id: 3,
            subject: "데이터베이스",
            type: "퀴즈",
            date: "2024-05-25",
            time: "09:00",
            location: "온라인",
            status: "예정",
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
    })

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/auth/login")
        }
        if (typeof window !== "undefined") {
            Modal.setAppElement("body")
        }
    }, [router])

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
        if (window.confirm("정말로 이 시험을 삭제하시겠습니까?\n관련된 체크리스트도 함께 삭제됩니다.")) {
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
        if (window.confirm("이 항목을 삭제하시겠습니까?")) {
            setChecklist(checklist.filter((item) => item.id !== id))
        }
    }

    const getChecklistForExam = (examId: number) => {
        return checklist.filter((item) => item.examId === examId)
    }

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
                    시험 일정 관리
                </h1>
            </header>

            <div className="max-w-6xl mx-auto py-8 px-4">
                {/* 시험 목록 */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">시험 목록</h2>
                        <button
                            onClick={() => {
                                resetForm()
                                setShowModal(true)
                            }}
                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl flex items-center shadow-lg hover:shadow-xl transition-all"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            시험 추가
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {exams.map((exam) => (
                            <div
                                key={exam.id}
                                className="bg-white/80 backdrop-blur-md border-2 border-gray-200 rounded-2xl p-4 hover:shadow-xl transition-all shadow-lg"
                                style={{
                                    boxShadow:
                                        "0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06), 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                }}
                            >
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

                                <div className="flex justify-between items-center gap-2">
                                    <button
                                        onClick={() => openChecklistModal(exam)}
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors flex-1"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        체크리스트 ({getChecklistForExam(exam.id!).filter((item) => item.completed).length}/
                                        {getChecklistForExam(exam.id!).length})
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(exam)}
                                            className="bg-gray-50 hover:bg-gray-100 text-blue-600 p-2 rounded-lg transition-colors"
                                            title="수정"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(exam.id!)}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors"
                                            title="삭제"
                                        >
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
                className="bg-white/90 backdrop-blur-md text-gray-900 rounded-2xl max-w-md mx-auto mt-24 p-6 shadow-2xl outline-none border border-white/30"
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
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-blue-700 hover:bg-blue-800 text-white transition-colors"
                        >
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
                className="bg-white/90 backdrop-blur-md text-gray-900 rounded-2xl max-w-lg mx-auto mt-24 p-6 shadow-2xl outline-none border border-white/30"
                overlayClassName="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center"
                ariaHideApp={false}
            >
                <h2 className="text-xl font-bold mb-4">{selectedExam?.subject} - 준비 체크리스트</h2>

                <div className="mb-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={newChecklistItem}
                            onChange={(e) => setNewChecklistItem(e.target.value)}
                            placeholder="새 할일 추가"
                            onKeyPress={(e) => e.key === "Enter" && addChecklistItem()}
                        />
                        <button
                            onClick={addChecklistItem}
                            className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-md transition-colors font-medium"
                        >
                            추가
                        </button>
                    </div>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                    {getChecklistForExam(selectedExam?.id || 0).map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => toggleChecklistItem(item.id)}
                                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className={`flex-1 ${item.completed ? "line-through text-gray-500" : ""}`}>{item.task}</span>
                            <button
                                onClick={() => deleteChecklistItem(item.id)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors"
                                title="삭제"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {getChecklistForExam(selectedExam?.id || 0).length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            아직 체크리스트가 없습니다.
                            <br />
                            위에서 새로운 할일을 추가해보세요.
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={() => setShowChecklistModal(false)}
                        className="px-6 py-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-medium"
                    >
                        닫기
                    </button>
                </div>
            </Modal>
        </div>
    )
}
