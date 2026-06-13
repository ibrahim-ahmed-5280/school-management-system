import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Toast from '../../components/ui/Toast';
import {
  createTimetableSlot,
  getAcademicYearsForTimetable,
  getBranchClassesForTimetable,
  getBranchTeachersForTimetable,
  getCurriculumForClassYear,
  getTimetableSlots,
  setTimetableSlotStatus,
  updateTimetableSlot,
} from '../../services/api/branchTimetable.api';
import { getSections } from '../../services/api/branch.api';
import { DAY_ORDER, DAY_LABELS } from '../../utils/dates';

const defaultForm = {
  schoolYearId: '',
  classId: '',
  sectionId: '',
  subjectId: '',
  teacherUserId: '',
  dayOfWeek: 'MON',
  startTime: '',
  endTime: '',
  room: '',
};

const extractId = (value) => (typeof value === 'object' ? value?._id : value);
const extractName = (value, fallback = '') => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value.name || value.fullName || fallback;
};

const normalizeSlot = (slot) => ({
  ...slot,
  id: slot._id || slot.id,
  classId: extractId(slot.classId),
  className: extractName(slot.classId),
  sectionId: extractId(slot.sectionId),
  sectionName: extractName(slot.sectionId),
  subjectId: extractId(slot.subjectId),
  subjectName: extractName(slot.subjectId),
  teacherUserId: extractId(slot.teacherUserId),
  teacherName: extractName(slot.teacherUserId, 'Teacher'),
  schoolYearId: extractId(slot.schoolYearId || slot.academicYearId),
});

const TimetableBuilder = () => {
  const { classId: classIdFromRoute } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [inlineError, setInlineError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [yearsData, classesData, teachersData] = await Promise.all([
          getAcademicYearsForTimetable(),
          getBranchClassesForTimetable(),
          getBranchTeachersForTimetable(),
        ]);

        const yearRows = yearsData || [];
        const classRows = classesData || [];
        setYears(yearRows);
        setClasses(classRows);
        setTeachers(teachersData || []);
        if (yearRows.length) setSelectedYear((current) => current || yearRows[0]._id);
        if (classIdFromRoute) setSelectedClass((current) => current || classIdFromRoute);
      } catch (error) {
        setToast({
          message: error?.response?.data?.message || 'Failed to load timetable setup data.',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [classIdFromRoute]);

  useEffect(() => {
    if (!selectedYear || !selectedClass) {
      setSlots([]);
      setSubjects([]);
      return;
    }

    const loadData = async () => {
      setSlotsLoading(true);
      try {
        const [slotsData, curriculumData] = await Promise.all([
          getTimetableSlots({
            schoolYearId: selectedYear,
            classId: selectedClass,
            ...(selectedSection ? { sectionId: selectedSection } : {}),
          }),
          getCurriculumForClassYear({ schoolYearId: selectedYear, classId: selectedClass }),
        ]);
        setSlots((slotsData || []).map(normalizeSlot));

        const subjectMap = new Map();
        (curriculumData || []).forEach((item) => {
          const subjectRef = item.subject || item.subjectId;
          const subjectId = extractId(subjectRef || item.subjectId);
          const subjectName = extractName(subjectRef, item.subjectName || 'Subject');
          if (subjectId) subjectMap.set(subjectId, { value: subjectId, label: subjectName });
        });
        setSubjects(Array.from(subjectMap.values()));
      } catch (error) {
        setToast({
          message: error?.response?.data?.message || 'Failed to load timetable slots.',
          type: 'error',
        });
      } finally {
        setSlotsLoading(false);
      }
    };

    loadData();
  }, [selectedYear, selectedClass, selectedSection]);

  const loadSectionsForClass = async (classId) => {
    if (!classId) {
      setSections([]);
      return;
    }
    setSectionsLoading(true);
    try {
      const payload = await getSections(classId);
      setSections(Array.isArray(payload) ? payload : payload?.data || []);
    } catch (error) {
      setSections([]);
      setToast({
        message: error?.response?.data?.message || 'Failed to load sections for selected class.',
        type: 'error',
      });
    } finally {
      setSectionsLoading(false);
    }
  };

  useEffect(() => {
    loadSectionsForClass(selectedClass);
  }, [selectedClass]);

  const teacherOptions = useMemo(
    () =>
      teachers.map((teacher) => ({
        value: teacher._id,
        label: teacher.name || teacher.fullName || teacher.email || 'Teacher',
      })),
    [teachers]
  );

  const classOptions = useMemo(
    () => classes.map((cls) => ({ value: cls._id, label: cls.name || cls.className || 'Class' })),
    [classes]
  );

  const sectionOptions = useMemo(
    () => sections.map((section) => ({ value: section._id, label: section.name || 'Section' })),
    [sections]
  );

  const yearOptions = useMemo(
    () => years.map((year) => ({ value: year._id, label: year.name || year.title || 'Academic Year' })),
    [years]
  );

  const openCreate = () => {
    setEditingSlot(null);
    setInlineError('');
    setForm({
      ...defaultForm,
      schoolYearId: selectedYear,
      classId: selectedClass,
      sectionId: selectedSection,
      dayOfWeek: 'MON',
    });
    loadSectionsForClass(selectedClass);
    setIsModalOpen(true);
  };

  const openEdit = (slot) => {
    setEditingSlot(slot);
    setInlineError('');
    setForm({
      schoolYearId: slot.schoolYearId || selectedYear,
      classId: slot.classId || selectedClass,
      sectionId: slot.sectionId || '',
      subjectId: slot.subjectId || '',
      teacherUserId: slot.teacherUserId || '',
      dayOfWeek: slot.dayOfWeek || 'MON',
      startTime: slot.startTime || '',
      endTime: slot.endTime || '',
      room: slot.room || '',
    });
    loadSectionsForClass(slot.classId || selectedClass);
    setIsModalOpen(true);
  };

  const sortByTime = (a, b) => a.startTime.localeCompare(b.startTime);

  const slotsByDay = useMemo(() => {
    const map = {
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
      SAT: [],
    };
    slots.forEach((slot) => {
      if (map[slot.dayOfWeek]) map[slot.dayOfWeek].push(slot);
    });
    Object.keys(map).forEach((day) => map[day].sort(sortByTime));
    return map;
  }, [slots]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setInlineError('');
    try {
      if (editingSlot) {
        await updateTimetableSlot(editingSlot.id, form);
        setToast({ message: 'Timetable slot updated.', type: 'success' });
      } else {
        await createTimetableSlot(form);
        setToast({ message: 'Timetable slot created.', type: 'success' });
      }
      setIsModalOpen(false);
      const latest = await getTimetableSlots({
        schoolYearId: selectedYear,
        classId: selectedClass,
        ...(selectedSection ? { sectionId: selectedSection } : {}),
      });
      setSlots((latest || []).map(normalizeSlot));
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to save timetable slot.';
      let formatted = message;
      if (/overlap/i.test(message)) {
        formatted = 'Timetable overlap detected';
      } else if (/duplicate/i.test(message) || /already exists/i.test(message)) {
        formatted = 'Duplicate slot exists';
      }
      setInlineError(formatted);
      setToast({ message: formatted, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSlotStatus = async (slot) => {
    try {
      await setTimetableSlotStatus(slot.id, !slot.isActive);
      const latest = await getTimetableSlots({
        schoolYearId: selectedYear,
        classId: selectedClass,
        ...(selectedSection ? { sectionId: selectedSection } : {}),
      });
      setSlots((latest || []).map(normalizeSlot));
      setToast({ message: 'Slot status updated.', type: 'success' });
    } catch (error) {
      setToast({
        message: error?.response?.data?.message || 'Failed to update slot status.',
        type: 'error',
      });
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Timetable Builder</h1>
            <p className="text-sm text-slate-500">Create and manage weekly class schedules.</p>
          </div>
          <Button onClick={openCreate} disabled={!selectedYear || !selectedClass}>
            + Add Slot
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Select
            label="School Year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            options={yearOptions}
          />
          <Select
            label="Class"
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSelectedSection('');
            }}
            options={classOptions}
          />
          <Select
            label="Section"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            options={sectionOptions}
            disabled={!selectedClass || sectionsLoading}
            placeholder={sectionsLoading ? 'Loading sections...' : 'All Sections'}
          />
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-3 text-xs text-slate-500">
            Pick school year, class and section to filter timetable correctly.
          </div>
        </div>
      </div>

      {loading || slotsLoading ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-6">
          {DAY_ORDER.map((day) => (
            <div key={day} className="rounded-xl border border-slate-200 bg-white p-3">
              <h3 className="mb-3 border-b border-slate-100 pb-2 text-sm font-bold text-slate-700">
                {DAY_LABELS[day]}
              </h3>
              <div className="space-y-3">
                {slotsByDay[day]?.length ? (
                  slotsByDay[day].map((slot) => (
                    <article key={slot.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <Badge variant={slot.isActive ? 'success' : 'warning'}>
                          {slot.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-xs font-semibold text-slate-500">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{slot.subjectName || 'Subject'}</p>
                      <p className="text-xs text-slate-600">{slot.teacherName || 'Teacher'}</p>
                      <p className="text-xs text-slate-500">
                        Section: {slot.sectionName || 'All Sections'}
                      </p>
                      {slot.room && <p className="text-xs text-slate-500">Room {slot.room}</p>}
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" className="px-2 py-1 text-xs" onClick={() => openEdit(slot)}>
                          Edit
                        </Button>
                        <Button
                          variant={slot.isActive ? 'danger' : 'secondary'}
                          className="px-2 py-1 text-xs"
                          onClick={() => toggleSlotStatus(slot)}
                        >
                          {slot.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">No slots</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSlot ? 'Edit Slot' : 'Add Slot'}>
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Select
              label="School Year"
              value={form.schoolYearId}
              onChange={(e) => setForm((prev) => ({ ...prev, schoolYearId: e.target.value }))}
              options={yearOptions}
              required
            />
            <Select
              label="Class"
              value={form.classId}
              onChange={(e) => {
                const nextClassId = e.target.value;
                setForm((prev) => ({ ...prev, classId: nextClassId, sectionId: '' }));
                loadSectionsForClass(nextClassId);
              }}
              options={classOptions}
              required
            />
            <Select
              label="Section (Optional)"
              value={form.sectionId}
              onChange={(e) => setForm((prev) => ({ ...prev, sectionId: e.target.value }))}
              options={sectionOptions}
              disabled={!form.classId || sectionsLoading}
              placeholder={sectionsLoading ? 'Loading sections...' : 'All Sections'}
            />
            <Select
              label="Subject"
              value={form.subjectId}
              onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))}
              options={subjects}
              required
            />
            <Select
              label="Teacher"
              value={form.teacherUserId}
              onChange={(e) => setForm((prev) => ({ ...prev, teacherUserId: e.target.value }))}
              options={teacherOptions}
              required
            />
            <Select
              label="Day"
              value={form.dayOfWeek}
              onChange={(e) => setForm((prev) => ({ ...prev, dayOfWeek: e.target.value }))}
              options={DAY_ORDER.map((day) => ({ value: day, label: DAY_LABELS[day] }))}
              required
            />
            <Input
              label="Room"
              value={form.room}
              onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))}
              placeholder="Optional"
            />
            <Input
              label="Start Time"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
              required
            />
            <Input
              label="End Time"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
              required
            />
          </div>

          {inlineError && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{inlineError}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingSlot ? 'Update Slot' : 'Create Slot'}
            </Button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </section>
  );
};

export default TimetableBuilder;
