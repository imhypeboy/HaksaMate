export interface Subject {
    id?: number;
    name: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    required: boolean;
}

export interface TimetableSlot {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    subject: Subject;
}
