import axios from 'axios';
import { Subject } from '@/types/subject';

const API_BASE = 'http://localhost:8080/api/subjects';

export const fetchSubjects = async (): Promise<Subject[]> => {
    const res = await axios.get(API_BASE);
    return res.data;
};

export const createSubject = async (subject: Subject): Promise<Subject> => {
    const res = await axios.post(API_BASE, subject);
    return res.data;
};

export const deleteSubject = async (id: number) => {
    await axios.delete(`${API_BASE}/${id}`);
};

export const updateSubject = async (subject: Subject) => {
    await axios.put(`${API_BASE}/${subject.id}`, subject);
};


// ⬇️ 추가: 시간표 생성 API
export const generateTimetable = async () => {
    const res = await axios.post('http://localhost:8080/api/timetable/generate');
    return res.data;
};
