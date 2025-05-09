'use client';

import { useEffect, useState } from 'react';
import { fetchSubjects, createSubject } from '@/lib/api';
import { Subject } from '@/types/subject';

export default function Page() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState<Subject>({
    name: '',
    dayOfWeek: 'MONDAY',
    startTime: '',
    endTime: '',
    priority: 1,
  });

  const loadSubjects = async () => {
    const data = await fetchSubjects();
    setSubjects(data);
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleAdd = async () => {
    await createSubject(form);
    await loadSubjects();
    setForm({ ...form, name: '', startTime: '', endTime: '', priority: 1 });
  };

  return (
      <div style={{ padding: 20 }}>
        <h1>수강 시간표 작성</h1>
        <input
            placeholder="과목명"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <select
            value={form.dayOfWeek}
            onChange={e => setForm({ ...form, dayOfWeek: e.target.value })}
        >
          {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map(day => (
              <option key={day} value={day}>
                {day}
              </option>
          ))}
        </select>
        <input
            type="time"
            value={form.startTime}
            onChange={e => setForm({ ...form, startTime: e.target.value })}
        />
        <input
            type="time"
            value={form.endTime}
            onChange={e => setForm({ ...form, endTime: e.target.value })}
        />
        <input
            type="number"
            value={form.priority}
            onChange={e => setForm({ ...form, priority: +e.target.value })}
        />
        <button onClick={handleAdd}>+ 추가</button>

        <h2>시간표</h2>
        <ul>
          {subjects
              .sort((a, b) => a.priority - b.priority)
              .map(subject => (
                  <li key={subject.id}>
                    {subject.dayOfWeek} | {subject.startTime} - {subject.endTime} | {subject.name} (우선순위: {subject.priority})
                  </li>
              ))}
        </ul>
      </div>
  );
}

// push