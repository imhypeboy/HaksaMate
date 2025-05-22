'use client';

import { useEffect, useState, useMemo } from 'react';
import Modal from 'react-modal';
import { fetchSubjects, createSubject, generateTimetable, deleteSubject, updateSubject } from '@/lib/api';
import { Subject, TimetableSlot } from '@/types/subject';
import { Sun, Moon } from 'lucide-react';
import axios from 'axios';
import Sidebar from './sidebar/sidebar';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';

export default function Page() {
    const router = useRouter();
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
    const [darkMode, setDarkMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const timeOptions = Array.from({ length: 21 }, (_, i) => {
        const hour = Math.floor(i / 2) + 8;
        const minute = i % 2 === 0 ? '00' : '30';
        return `${hour.toString().padStart(2, '0')}:${minute}`;
    });

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const hours = Array.from({ length: 12 }, (_, i) => i + 9);

    useEffect(() => {
        // 인증 상태 확인
        if (!isAuthenticated()) {
            router.push('/auth/login');
            return;
        }

        loadSubjects();
        if (typeof window !== 'undefined') {
            Modal.setAppElement('body');
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                setDarkMode(true);
                document.documentElement.classList.add('dark');
            }
        }
    }, [router]);

    const toggleTheme = () => {
        setDarkMode(!darkMode);
        if (!darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const loadSubjects = async () => {
        try {
            setIsLoading(true);
            const data = await fetchSubjects();
            setSubjects(data);
        } catch (error) {
            console.error('과목 로딩 중 오류 발생:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    alert('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
                } else if (error.response?.status === 500) {
                    alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                } else {
                    alert('과목을 불러오는 중 오류가 발생했습니다.');
                }
            }
        } finally {
            setIsLoading(false);
        }
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
        const lastTimeOption = timeOptions[timeOptions.length - 1];
        if (timeToMinutes(form.endTime) > timeToMinutes(lastTimeOption)) {
            setTimeError(`종료 시간은 ${lastTimeOption}를 넘을 수 없습니다.`);
            return;
        }

        setTimeError(null);
        setIsLoading(true);

        try {
            if (editMode && form.id) {
                await updateSubject(form);
            } else {
                await createSubject(form);
            }
            await loadSubjects();
            setForm({ name: '', dayOfWeek: 'MONDAY', startTime: '', endTime: '', required: false });
            setEditMode(false);
            setShowModal(false);
        } catch (error) {
            console.error('과목 저장 중 오류 발생:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    setTimeError('입력한 데이터가 올바르지 않습니다. 다시 확인해주세요.');
                } else {
                    setTimeError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
                }
            } else {
                setTimeError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (subject: Subject) => {
        setForm(subject);
        setEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('이 과목을 삭제하시겠습니까?')) {
            setIsLoading(true);
            try {
                await deleteSubject(id);
                await loadSubjects();
            } catch (error) {
                console.error('과목 삭제 중 오류 발생:', error);
                if (axios.isAxiosError(error)) {
                    if (error.response?.status === 404) {
                        alert('해당 과목을 찾을 수 없습니다.');
                    } else {
                        alert('삭제 중 오류가 발생했습니다.');
                    }
                } else {
                    alert('삭제 중 오류가 발생했습니다.');
                }
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const result = await generateTimetable();
            setTimetable(result);
        } catch (error) {
            console.error('시간표 생성 중 오류 발생:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 500) {
                    alert('시간표를 생성할 수 없습니다. 서버 오류가 발생했습니다.');
                } else {
                    alert('시간표 생성 중 오류가 발생했습니다.');
                }
            } else {
                alert('시간표 생성 중 오류가 발생했습니다.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const timetableMap = useMemo(() => {
        const map = new Map<string, string[]>();
        timetable.forEach(slot => {
            const startHour = parseInt(slot.startTime.split(':')[0], 10);
            const endHour = parseInt(slot.endTime.split(':')[0], 10);
            for (let hour = startHour; hour < endHour; hour++) {
                const key = `${slot.dayOfWeek}-${hour}`;
                const existing = map.get(key) || [];
                map.set(key, [...existing, slot.subject.name]);
            }
        });
        return map;
    }, [timetable]);

    const resetForm = () => {
        setForm({ name: '', dayOfWeek: 'MONDAY', startTime: '', endTime: '', required: false });
        setTimeError(null);
        setEditMode(false);
    };

    const closeModal = () => {
        setShowModal(false);
        resetForm();
    };

    return (
        <div className={`flex min-h-screen transition-colors duration-300 ${
            darkMode
                ? 'bg-slate-900 text-slate-200'
                : 'bg-white text-gray-900'
        }`}>
            {/* 사이드바 영역 */}
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* 메인 콘텐츠 영역 */}
            <div className="flex-1 font-sans pb-12">
                <header className={`${
                    darkMode
                        ? 'bg-slate-800 text-white'
                        : 'bg-blue-700 text-white'
                } py-4 px-4 flex justify-between items-center shadow-md transition-colors duration-300`}>
                    <h1 className="text-2xl font-bold">학사메이트</h1>
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-full ${
                            darkMode
                                ? 'hover:bg-slate-700'
                                : 'hover:bg-blue-600'
                        } transition-colors`}
                        aria-label={darkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </header>

                {/* 메인 카드 콘텐츠 박스 */}
                <div className={`max-w-4xl mx-auto my-4 sm:my-10 ${
                    darkMode
                        ? 'bg-slate-800'
                        : 'bg-white'
                } rounded-xl p-4 sm:p-8 shadow-lg text-center transition-colors duration-300`}>
                    <h1 className={`text-xl sm:text-2xl font-bold mb-6 ${
                        darkMode ? 'text-slate-200' : 'text-gray-900'
                    }`}>📘 수강 시간표 작성</h1>

                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className={`${
                            darkMode
                                ? 'bg-blue-600 hover:bg-blue-500'
                                : 'bg-blue-700 hover:bg-blue-800'
                        } text-white py-2 px-4 rounded-md transition-colors mb-6 flex items-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={isLoading}
                    >
                        <span className="mr-1">+</span> 과목 추가
                    </button>

                    <div className="text-left mb-6">
                        <h2 className={`text-lg sm:text-xl font-semibold mb-3 ${
                            darkMode ? 'text-slate-200' : 'text-gray-900'
                        }`}>📌 등록된 과목</h2>
                        {isLoading && subjects.length === 0 ? (
                            <div className="text-center py-8">
                                <div className={`inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${
                                    darkMode ? 'border-blue-400' : 'border-blue-500'
                                }`}></div>
                                <p className={`mt-2 ${
                                    darkMode ? 'text-slate-400' : 'text-gray-500'
                                }`}>과목을 불러오는 중...</p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {subjects.length === 0 ? (
                                    <li className={`${
                                        darkMode ? 'text-slate-400' : 'text-gray-500'
                                    } italic text-center py-4`}>
                                        등록된 과목이 없습니다. 위 버튼을 눌러 과목을 추가해주세요.
                                    </li>
                                ) : (
                                    subjects.map(subject => (
                                        <li
                                            key={subject.id}
                                            className={`p-3 ${
                                                darkMode
                                                    ? 'border-slate-700 bg-slate-700 hover:bg-slate-600'
                                                    : 'border bg-gray-50 hover:bg-gray-100'
                                            } rounded-md flex justify-between items-center transition-colors`}
                                        >
                                            <div>
                                                <span className={`font-semibold ${
                                                    darkMode ? 'text-slate-200' : 'text-gray-900'
                                                }`}>{subject.name}</span>
                                                <span className={`ml-2 text-xs ${
                                                    darkMode ? 'text-slate-400' : 'text-gray-400'
                                                }`}>
                                                    {subject.dayOfWeek} {subject.startTime}~{subject.endTime}{' '}
                                                    {subject.required && '(필수)'}
                                                </span>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(subject)}
                                                    className={`${
                                                        darkMode ? 'text-blue-400' : 'text-blue-700'
                                                    } hover:underline font-semibold`}
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(subject.id!)}
                                                    className={`${
                                                        darkMode ? 'text-red-400' : 'text-red-600'
                                                    } hover:underline font-semibold`}
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}
                    </div>

                    <button
                        onClick={handleGenerate}
                        className={`${
                            darkMode
                                ? 'bg-indigo-600 hover:bg-indigo-500'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                        } text-white py-2 px-4 rounded-md transition-colors font-bold mt-4 mb-8 disabled:opacity-50`}
                        disabled={subjects.length === 0 || isLoading}
                    >
                        시간표 자동 생성
                    </button>

                    <div className={`overflow-x-auto rounded-lg ${
                        darkMode ? 'border-slate-700' : 'border'
                    } mt-4`}>
                        <table className={`min-w-full ${
                            darkMode ? 'bg-slate-800' : 'bg-white'
                        } border-collapse transition-colors duration-300`}>
                            <thead>
                            <tr>
                                <th className={`p-2 ${
                                    darkMode ? 'bg-slate-700 border-slate-600' : 'bg-blue-50 border-b'
                                } w-20`}>시간</th>
                                {days.map(day => (
                                    <th
                                        key={day}
                                        className={`p-2 ${
                                            darkMode ? 'bg-slate-700 border-slate-600' : 'bg-blue-50 border-b'
                                        }`}
                                    >
                                        {day.slice(0, 3)}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {hours.map(hour => (
                                <tr key={hour}>
                                    <td className={`p-2 text-sm font-bold ${
                                        darkMode
                                            ? 'bg-slate-700 border-slate-600'
                                            : 'bg-gray-100 border-b'
                                    }`}>
                                        {hour}:00
                                    </td>
                                    {days.map(day => {
                                        const key = `${day}-${hour}`;
                                        const slotSubjects = timetableMap.get(key) || [];
                                        return (
                                            <td
                                                className={`p-2 ${
                                                    darkMode ? 'border-slate-600' : 'border-b'
                                                } text-center`}
                                                key={day}
                                            >
                                                {slotSubjects.length > 0
                                                    ? slotSubjects.map((name, i) => (
                                                        <div
                                                            className={`rounded ${
                                                                darkMode
                                                                    ? 'bg-blue-800 text-blue-100'
                                                                    : 'bg-blue-100 text-blue-800'
                                                            } px-2 py-1 text-xs mb-1`}
                                                            key={i}
                                                        >
                                                            {name}
                                                        </div>
                                                    ))
                                                    : null}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Modal
                    isOpen={showModal}
                    onRequestClose={closeModal}
                    contentLabel="과목 추가/수정"
                    className={`${
                        darkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-gray-900'
                    } rounded-xl max-w-md mx-auto mt-24 p-6 shadow-lg outline-none transition-colors duration-300`}
                    overlayClassName="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center"
                    ariaHideApp={false}
                >
                    <h2 className={`text-lg sm:text-xl font-bold mb-4 ${
                        darkMode ? 'text-slate-200' : 'text-gray-900'
                    }`}>
                        {editMode ? '과목 수정' : '과목 추가'}
                    </h2>
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            handleAddOrUpdate();
                        }}
                    >
                        <div className="mb-4">
                            <label className={`block mb-1 text-sm ${
                                darkMode ? 'text-slate-300' : 'text-gray-700'
                            }`}>과목명</label>
                            <input
                                type="text"
                                className={`w-full border px-3 py-2 rounded-md ${
                                    darkMode
                                        ? 'bg-slate-700 border-slate-600 text-slate-200'
                                        : 'bg-gray-50 text-gray-900'
                                }`}
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="mb-4 flex gap-2">
                            <div className="w-1/3">
                                <label className={`block mb-1 text-sm ${
                                    darkMode ? 'text-slate-300' : 'text-gray-700'
                                }`}>요일</label>
                                <select
                                    className={`w-full border px-2 py-1 rounded-md ${
                                        darkMode
                                            ? 'bg-slate-700 border-slate-600 text-slate-200'
                                            : 'bg-gray-50 text-gray-900'
                                    }`}
                                    value={form.dayOfWeek}
                                    onChange={e =>
                                        setForm({ ...form, dayOfWeek: e.target.value as Subject['dayOfWeek'] })
                                    }
                                    required
                                >
                                    {days.map(day => (
                                        <option key={day} value={day}>
                                            {day}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-1/3">
                                <label className={`block mb-1 text-sm ${
                                    darkMode ? 'text-slate-300' : 'text-gray-700'
                                }`}>시작 시간</label>
                                <select
                                    className={`w-full border px-2 py-1 rounded-md ${
                                        darkMode
                                            ? 'bg-slate-700 border-slate-600 text-slate-200'
                                            : 'bg-gray-50 text-gray-900'
                                    }`}
                                    value={form.startTime}
                                    onChange={e => handleStartTimeChange(e.target.value)}
                                    required
                                >
                                    <option value="">선택</option>
                                    {timeOptions.map(time => (
                                        <option key={time} value={time}>
                                            {time}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-1/3">
                                <label className={`block mb-1 text-sm ${
                                    darkMode ? 'text-slate-300' : 'text-gray-700'
                                }`}>종료 시간</label>
                                <select
                                    className={`w-full border px-2 py-1 rounded-md ${
                                        darkMode
                                            ? 'bg-slate-700 border-slate-600 text-slate-200'
                                            : 'bg-gray-50 text-gray-900'
                                    }`}
                                    value={form.endTime}
                                    onChange={e => setForm({ ...form, endTime: e.target.value })}
                                    required
                                >
                                    <option value="">선택</option>
                                    {timeOptions.map((time, idx) =>
                                        idx > timeOptions.findIndex(t => t === form.startTime) ? (
                                            <option key={time} value={time}>
                                                {time}
                                            </option>
                                        ) : null
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4 flex items-center">
                            <input
                                id="required"
                                type="checkbox"
                                checked={form.required}
                                onChange={e => setForm({ ...form, required: e.target.checked })}
                                className="mr-2"
                            />
                            <label htmlFor="required" className={`text-sm ${
                                darkMode ? 'text-slate-300' : 'text-gray-700'
                            }`}>
                                필수 과목
                            </label>
                        </div>

                        {timeError && (
                            <div className="text-red-500 mb-3 text-sm font-semibold">{timeError}</div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeModal}
                                className={`px-4 py-2 rounded ${
                                    darkMode
                                        ? 'bg-slate-700 text-slate-300'
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                                disabled={isLoading}
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                className={`px-4 py-2 rounded ${
                                    darkMode
                                        ? 'bg-blue-600 hover:bg-blue-500'
                                        : 'bg-blue-700 hover:bg-blue-800'
                                } text-white font-semibold disabled:opacity-50`}
                                disabled={isLoading}
                            >
                                {editMode ? '수정' : '추가'}
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
}