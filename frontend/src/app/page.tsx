'use client';

import { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { fetchSubjects, createSubject, generateTimetable, deleteSubject, updateSubject } from '@/lib/api';
import { Subject, TimetableSlot } from '@/types/subject';

export default function Page() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [form, setForm] = useState<Subject>({
        name: '',
        dayOfWeek: 'MONDAY',
        startTime: '',
        endTime: '',
        required: false,
    });
    const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
    const [timeError, setTimeError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const timeOptions = Array.from({ length: 21 }, (_, i) => {
        const hour = Math.floor(i / 2) + 8;
        const minute = i % 2 === 0 ? '00' : '30';
        return `${hour.toString().padStart(2, '0')}:${minute}`;
    });

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const hours = Array.from({ length: 12 }, (_, i) => i + 9);

    useEffect(() => {
        loadSubjects();
        if (typeof window !== 'undefined') {
            Modal.setAppElement('body');
        }
    }, []);

    const loadSubjects = async () => {
        const data = await fetchSubjects();
        setSubjects(data);
    };

    const timeToMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const handleStartTimeChange = (startTime: string) => {
        const startIndex = timeOptions.findIndex(t => t === startTime);
        const defaultEnd = timeOptions[startIndex + 2] || '';
        setForm(prev => ({ ...prev, startTime, endTime: defaultEnd }));
    };

    const handleAddOrUpdate = async () => {
        if (!form.name || !form.startTime || !form.endTime) {
            setTimeError('모든 입력을 채워주세요.');
            return;
        }
        if (timeToMinutes(form.startTime) >= timeToMinutes(form.endTime)) {
            setTimeError('종료 시간이 시작 시간보다 늦어야 합니다.');
            return;
        }
        setTimeError(null);
        if (editMode && form.id) {
            await updateSubject(form);
        } else {
            await createSubject(form);
        }
        await loadSubjects();
        setForm({ name: '', dayOfWeek: 'MONDAY', startTime: '', endTime: '', required: false });
        setEditMode(false);
        setShowModal(false);
    };

    const handleEdit = (subject: Subject) => {
        setForm(subject);
        setEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('이 과목을 삭제하시겠습니까?')) {
            await deleteSubject(id);
            await loadSubjects();
        }
    };

    const handleGenerate = async () => {
        const result = await generateTimetable();
        setTimetable(result);
    };

    // 시간대별 과목을 시간표에 매핑
    const timetableMap = new Map<string, string[]>();
    timetable.forEach(slot => {
        const startHour = parseInt(slot.startTime.split(':')[0], 10);
        const endHour = parseInt(slot.endTime.split(':')[0], 10);
        for (let hour = startHour; hour < endHour; hour++) {
            const key = `${slot.dayOfWeek}-${hour}`;
            const existing = timetableMap.get(key) || [];
            timetableMap.set(key, [...existing, slot.subject.name]);
        }
    });

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(to right, #f0f4ff, #d9e4ff)', fontFamily: 'Arial, sans-serif', paddingBottom: 50 }}>
            <header style={{ backgroundColor: '#375a7f', color: 'white', padding: '16px 0', textAlign: 'center', fontSize: 28, fontWeight: 'bold', boxShadow: '0px 2px 8px rgba(0,0,0,0.2)' }}>
                학사메이트
            </header>

            <div style={{ maxWidth: 1000, margin: '40px auto', backgroundColor: 'white', borderRadius: 12, padding: 30, boxShadow: '0px 4px 16px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                <h1 style={{ fontSize: 24, marginBottom: 24 }}>📘 수강 시간표 작성</h1>

                <button onClick={() => setShowModal(true)} style={{ backgroundColor: '#375a7f', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 20 }}>
                    + 과목 추가
                </button>

                <div style={{ textAlign: 'left', marginBottom: 20 }}>
                    <h2>📌 등록된 과목</h2>
                    <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
                        {subjects.map(subject => (
                            <li key={subject.id} style={{ marginBottom: 6 }}>
                                <strong>{subject.dayOfWeek}</strong> | {subject.startTime} - {subject.endTime} | {subject.name}
                                <span style={{ color: subject.required ? '#d32f2f' : '#666', marginLeft: 6 }}>({subject.required ? '필수' : '선택'})</span>
                                <button onClick={() => handleEdit(subject)} style={{ marginLeft: 10 }}>✏</button>
                                <button onClick={() => handleDelete(subject.id!)} style={{ marginLeft: 6 }}>🗑</button>
                            </li>
                        ))}
                    </ul>
                </div>

                <button onClick={handleGenerate} style={{ backgroundColor: '#0077cc', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 10 }}>
                    🎲 랜덤 시간표 생성
                </button>

                {timetable.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                        <h2>📅 시간표 (요일/시간대 표 형식)</h2>
                        <table style={{ borderCollapse: 'collapse', width: '100%', textAlign: 'center', marginTop: 10 }}>
                            <thead>
                            <tr>
                                <th style={thStyle}>시간</th>
                                {days.map(day => (
                                    <th key={day} style={thStyle}>{day}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {hours.map(hour => (
                                <tr key={hour}>
                                    <td style={tdStyle}>{`${hour}:00`}</td>
                                    {days.map(day => {
                                        const key = `${day}-${hour}`;
                                        const subjectNames = timetableMap.get(key) || [];
                                        const isConflict = subjectNames.length > 1;
                                        return (
                                            <td key={key} style={{
                                                ...tdStyle,
                                                backgroundColor: isConflict ? '#ffcccc' : undefined,
                                                color: isConflict ? '#b00020' : undefined,
                                                fontWeight: isConflict ? 'bold' : undefined
                                            }}>
                                                {subjectNames.join(', ')}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={showModal}
                onRequestClose={() => {
                    setShowModal(false);
                    setEditMode(false);
                }}
                contentLabel="과목 추가 모달"
                style={{ overlay: { backgroundColor: 'rgba(0,0,0,0.4)' }, content: { maxWidth: 400, margin: 'auto', borderRadius: 10, padding: 20 } }}
            >
                <h2 style={{ textAlign: 'center', marginBottom: 16 }}>{editMode ? '✏ 과목 수정' : '📝 과목 추가'}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input placeholder="과목명" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <select value={form.dayOfWeek} onChange={e => setForm({ ...form, dayOfWeek: e.target.value })}>
                        {days.map(day => (
                            <option key={day} value={day}>{day}</option>
                        ))}
                    </select>
                    <select value={form.startTime} onChange={e => handleStartTimeChange(e.target.value)}>
                        <option value="">시작 시간</option>
                        {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                        ))}
                    </select>
                    <select value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })}>
                        <option value="">종료 시간</option>
                        {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                        ))}
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                        <input type="checkbox" checked={form.required} onChange={e => setForm({ ...form, required: e.target.checked })} style={{ marginRight: 6 }} />
                        필수 과목
                    </label>
                </div>
                {timeError && <p style={{ color: 'red', marginTop: 10 }}>{timeError}</p>}
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                    <button onClick={handleAddOrUpdate} style={{ backgroundColor: '#0077cc', color: 'white', padding: '6px 12px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                        {editMode ? '수정' : '등록'}
                    </button>
                    <button onClick={() => { setShowModal(false); setEditMode(false); }} style={{ backgroundColor: '#ccc', padding: '6px 12px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                        취소
                    </button>
                </div>
            </Modal>
        </div>
    );
}

const thStyle = {
    border: '1px solid #ccc',
    padding: 8,
    backgroundColor: '#e2e2f2'
};

const tdStyle = {
    border: '1px solid #ccc',
    padding: 8,
    height: '48px'
};