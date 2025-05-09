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
