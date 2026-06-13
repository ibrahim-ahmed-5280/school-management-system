import React, { useEffect, useMemo, useState } from 'react';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import Toast from '../../components/ui/Toast';
import { getAcademicYearsForTimetable } from '../../services/api/branchTimetable.api';
import { getStudentTimetableToday, getStudentTimetableWeek } from '../../services/api/studentTimetable.api';
import { DAY_LABELS, DAY_ORDER } from '../../utils/dates';
import { useAuth } from '../../context/AuthContext';

const normalizeSlot = (slot) => ({
  ...slot,
  id: slot._id || slot.id,
  dayOfWeek: slot.dayOfWeek || slot.day || '',
  className: slot.classId?.name || slot.className || slot.class || 'Class',
  sectionId: slot.sectionId?._id || slot.sectionId,
  sectionName: slot.sectionId?.name || slot.sectionName || '',
  subjectName: slot.subjectId?.name || slot.subjectName || slot.subject || 'Subject',
  teacherName: slot.teacherUserId?.name || slot.teacherName || 'Teacher',
  startTime: slot.startTime || '--:--',
  endTime: slot.endTime || '--:--',
  room: slot.room || '',
});

const normalizeWeekResponse = (payload) => {
  if (Array.isArray(payload)) return payload.map(normalizeSlot);
  if (payload && typeof payload === 'object') {
    return Object.entries(payload).flatMap(([day, slots]) =>
      (Array.isArray(slots) ? slots : []).map((slot) => normalizeSlot({ ...slot, dayOfWeek: day }))
    );
  }
  return [];
};

const StudentSchedule = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('today');
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(user?.schoolYearId || user?.academicYearId || '');
  const [todaySlots, setTodaySlots] = useState([]);
  const [weekSlots, setWeekSlots] = useState([]);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    const loadAcademicYears = async () => {
      try {
        const data = await getAcademicYearsForTimetable();
        setAcademicYears(data || []);
        if (!selectedYear && data?.length) setSelectedYear(data[0]._id);
      } catch {
        setAcademicYears([]);
      }
    };
    loadAcademicYears();
  }, [selectedYear]);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const [today, week] = await Promise.all([
          getStudentTimetableToday(selectedYear),
          getStudentTimetableWeek(selectedYear),
        ]);
        setTodaySlots((today || []).map(normalizeSlot));
        setWeekSlots(normalizeWeekResponse(week));
      } catch (error) {
        setToast({
          message: error?.response?.data?.message || 'Failed to load your schedule.',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [selectedYear]);

  const yearOptions = academicYears.map((year) => ({ value: year._id, label: year.name || 'Academic Year' }));
  const weekGrouped = useMemo(() => {
    const map = { MON: [], TUE: [], WED: [], THU: [], FRI: [], SAT: [] };
    weekSlots.forEach((slot) => {
      if (map[slot.dayOfWeek]) map[slot.dayOfWeek].push(slot);
    });
    return map;
  }, [weekSlots]);

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Schedule</h1>
            <p className="text-sm text-slate-500">Your class timetable by day and week.</p>
          </div>
          <div className="w-full max-w-xs">
            <Select
              label="School Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              options={yearOptions}
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            <button
              className={`rounded-md px-4 py-2 text-sm font-semibold ${activeTab === 'today' ? 'bg-white text-[var(--primary)] shadow' : 'text-slate-600'}`}
              onClick={() => setActiveTab('today')}
            >
              Today
            </button>
            <button
              className={`rounded-md px-4 py-2 text-sm font-semibold ${activeTab === 'week' ? 'bg-white text-[var(--primary)] shadow' : 'text-slate-600'}`}
              onClick={() => setActiveTab('week')}
            >
              Week
            </button>
          </div>
          <Badge variant="primary">Today you have {todaySlots.length} subjects</Badge>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : activeTab === 'today' ? (
        <div className="space-y-3">
          {todaySlots.length ? (
            todaySlots.map((slot) => (
              <article key={slot.id || `${slot.startTime}-${slot.subjectName}`} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {slot.startTime} - {slot.endTime}
                  </p>
                  {slot.room ? <Badge>{slot.room}</Badge> : null}
                </div>
                <p className="mt-1 text-base font-bold text-slate-800">{slot.subjectName}</p>
                <p className="text-sm text-slate-600">Teacher {slot.teacherName}</p>
                <p className="text-xs text-slate-500">
                  {slot.className}{slot.sectionName ? ` • Section ${slot.sectionName}` : ''}
                </p>
              </article>
            ))
          ) : (
            <p className="rounded-xl bg-white p-6 text-sm text-slate-500">No timetable slots for today.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {DAY_ORDER.map((day) => (
            <div key={day} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
              <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-slate-700">{DAY_LABELS[day]}</h3>
              {weekGrouped[day]?.length ? (
                weekGrouped[day]
                  .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                  .map((slot) => (
                    <article key={slot.id || `${day}-${slot.startTime}`} className="rounded-lg border border-slate-100 p-3">
                      <p className="text-xs font-semibold text-slate-500">
                        {slot.startTime} - {slot.endTime}
                      </p>
                      <p className="text-sm font-semibold text-slate-800">{slot.subjectName}</p>
                      <p className="text-xs text-slate-600">{slot.teacherName}</p>
                      <p className="text-xs text-slate-500">
                        {slot.className}{slot.sectionName ? ` • Section ${slot.sectionName}` : ''}
                      </p>
                      {slot.room ? <p className="text-xs text-slate-500">Room {slot.room}</p> : null}
                    </article>
                  ))
              ) : (
                <p className="rounded-md bg-slate-50 p-4 text-xs text-slate-400">No classes</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </section>
  );
};

export default StudentSchedule;
