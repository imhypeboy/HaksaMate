import { supabase } from './supabaseClient'

export interface Exam {
    id?: number
    user_id?: string
    subject: string
    type: "중간고사" | "기말고사" | "퀴즈" | "과제"
    date: string
    time: string
    location: string
    status: "예정" | "진행중" | "완료"
}

export interface ChecklistItem {
    id?: number
    user_id?: string
    exam_id: number
    task: string
    completed: boolean
}

// 시험 전체 조회
export async function fetchExams(userId: string): Promise<Exam[]> {
    const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', userId)
        .order('date')
    if (error) throw error
    return data as Exam[]
}

// 시험 추가
export async function addExam(exam: Omit<Exam, "id" | "user_id">, userId: string) {
    const { data, error } = await supabase
        .from('exams')
        .insert([{ ...exam, user_id: userId }])
        .select()
        .single()
    if (error) throw error
    return data as Exam
}

// 시험 수정
export async function updateExam(exam: Exam, userId: string) {
    if (!exam.id) throw new Error("No exam id")
    const { id, ...rest } = exam
    const { error } = await supabase
        .from('exams')
        .update({ ...rest })
        .eq('id', id)
        .eq('user_id', userId)
    if (error) throw error
}

// 시험 삭제 (체크리스트도 자동 cascade 삭제됨)
export async function deleteExam(id: number, userId: string) {
    const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
    if (error) throw error
}

// 체크리스트 조회
export async function fetchChecklist(userId: string, examId: number): Promise<ChecklistItem[]> {
    const { data, error } = await supabase
        .from('exam_checklists')
        .select('*')
        .eq('user_id', userId)
        .eq('exam_id', examId)
        .order('id')
    if (error) throw error
    return data as ChecklistItem[]
}

// 체크리스트 추가
export async function addChecklistItem(task: string, examId: number, userId: string) {
    const { data, error } = await supabase
        .from('exam_checklists')
        .insert([{ user_id: userId, exam_id: examId, task, completed: false }])
        .select()
        .single()
    if (error) throw error
    return data as ChecklistItem
}

// 체크리스트 완료여부 토글
export async function toggleChecklistItem(id: number, completed: boolean, userId: string) {
    const { error } = await supabase
        .from('exam_checklists')
        .update({ completed })
        .eq('id', id)
        .eq('user_id', userId)
    if (error) throw error
}

// 체크리스트 삭제
export async function deleteChecklistItem(id: number, userId: string) {
    const { error } = await supabase
        .from('exam_checklists')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
    if (error) throw error
}
