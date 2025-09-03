"use client"
import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, PieChart, Pie, Tooltip, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Cell } from "recharts";

/**
 * Smart Classroom Dashboard – 3 ระดับ (ผู้บริหารสูงสุด / ผู้อำนวยการ / ห้องเรียน)
 * - ใช้ Tailwind + shadcn/ui + Recharts
 * - ใช้ Mock Data จำนวนมาก (generate ในไฟล์เดียว) เพื่อเอาไปลองต่อยอดได้ทันที
 * - ครอบคลุม: เวลาเรียนรวม/เฉลี่ย รายโปรแกรม รายวิชา รายกิจกรรม และคะแนนนักเรียน (รวม/รายวิชา/รายกิจกรรม)
 */

// ---------------------------
// 1) Type Definitions & Static Definitions

interface Student {
  id: number;
  name: string;
  classroomId: number;
  schoolId: number;
}

interface UsageLog {
  id: number;
  schoolId: number;
  classroomId: number;
  subjectId: number;
  activityId: number | null;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

interface Score {
  id: number;
  studentId: number;
  activityId: number;
  score: number;
  subjectId: number;
  programId: string;
  createdAt: string;
  classroomId: number;
  schoolId: number;
}

interface StatProps {
  label: string;
  value: number | string;
  sub?: string;
}

interface Subject {
  id: number;
  name: string;
  programId: string;
}

interface Activity {
  id: number;
  subjectId: number;
  name: string;
}
// ---------------------------
const PROGRAMS = [
  { id: "P1", name: "โปรแกรมเกี่ยวกับตัวเด็ก" },
  { id: "P2", name: "โปรแกรมเกี่ยวกับบุคคลและสถานที่แวดล้อมเด็ก" },
  { id: "P3", name: "โปรแกรมธรรมชาติรอบตัว" },
  { id: "P4", name: "โปรแกรมสิ่งต่างๆ รอบตัวเด็ก" },
];

// วิชา (Subjects) จะ map เข้ากับ Program
const SUBJECTS = [
  // P1
  { id: 1, name: "ร่างกายและสุขภาพ", programId: "P1" },
  { id: 2, name: "อารมณ์และจิตใจ", programId: "P1" },
  { id: 3, name: "การช่วยเหลือตนเอง", programId: "P1" },
  // P2
  { id: 4, name: "ครอบครัว", programId: "P2" },
  { id: 5, name: "เพื่อนและโรงเรียน", programId: "P2" },
  { id: 6, name: "ชุมชนและวัฒนธรรม", programId: "P2" },
  // P3
  { id: 7, name: "สิ่งแวดล้อมรอบตัว", programId: "P3" },
  { id: 8, name: "ต้นไม้และธรรมชาติ", programId: "P3" },
  { id: 9, name: "สัตว์และสิ่งมีชีวิต", programId: "P3" },
  { id: 10, name: "ปรากฏการณ์ธรรมชาติ", programId: "P3" },
  // P4
  { id: 11, name: "ของเล่นและเครื่องมือ", programId: "P4" },
  { id: 12, name: "เทคโนโลยีและเครื่องใช้", programId: "P4" },
  { id: 13, name: "สิ่งประดิษฐ์ง่ายๆ", programId: "P4" },
];

// กิจกรรม (Activities) ผูกกับวิชา
const ACTIVITIES = [
  // subj 1
  { id: 1, subjectId: 1, name: "วาดภาพส่วนต่างๆ ของร่างกาย" },
  { id: 2, subjectId: 1, name: "เรียนรู้การล้างมือ" },
  { id: 3, subjectId: 1, name: "การออกกำลังกายเบื้องต้น" },
  // subj 2
  { id: 4, subjectId: 2, name: "เล่านิทานอารมณ์" },
  { id: 5, subjectId: 2, name: "เกมการแสดงอารมณ์" },
  // subj 3
  { id: 6, subjectId: 3, name: "การใส่รองเท้าและเสื้อผ้าเอง" },
  { id: 7, subjectId: 3, name: "จัดโต๊ะอาหารเอง" },
  // subj 4–6
  { id: 8, subjectId: 4, name: "รู้จักสมาชิกในครอบครัว" },
  { id: 9, subjectId: 5, name: "บทบาทสมมติเป็นเพื่อน" },
  { id: 10, subjectId: 6, name: "เยี่ยมชมชุมชน" },
  // subj 7–10
  { id: 11, subjectId: 8, name: "เก็บใบไม้/ดอกไม้" },
  { id: 12, subjectId: 8, name: "ดูแลต้นไม้ในห้อง" },
  { id: 13, subjectId: 9, name: "เลี้ยงปลาทองในห้องเรียน" },
  { id: 14, subjectId: 10, name: "สังเกตท้องฟ้าและฝน" },
  // subj 11–13
  { id: 15, subjectId: 11, name: "เล่นตัวต่อ LEGO" },
  { id: 16, subjectId: 12, name: "เรียนรู้แท็บเล็ตสำหรับเด็ก" },
  { id: 17, subjectId: 13, name: "ทำหุ่นกระดาษ" },
];

// ---------------------------
// 2) School & Classroom Structure
// ---------------------------
const SCHOOL_DEFS = [
  { id: 1, name: "โรงเรียนอนุบาลสาธิตบางแก้ว ๑ (วัดหนามแดง)", classrooms: [
    { id: 1, level: "อนุบาล 1", room: "1" },
    { id: 2, level: "อนุบาล 1", room: "2" },
    { id: 3, level: "อนุบาล 2", room: "1" },
    { id: 4, level: "อนุบาล 2", room: "2" },
    { id: 5, level: "อนุบาล 3", room: "1" },
    { id: 6, level: "อนุบาล 3", room: "2" },
  ]},
  { id: 2, name: "โรงเรียนอนุบาลสาธิตบางแก้ว ๒ (สมุทรสิริวัฒน์)", classrooms: [
    { id: 7, level: "อนุบาล 1", room: "1" },
    { id: 8, level: "อนุบาล 1", room: "2" },
    { id: 9, level: "อนุบาล 2", room: "1" },
    { id: 10, level: "อนุบาล 2", room: "2" },
    { id: 11, level: "อนุบาล 3", room: "1" },
    { id: 12, level: "อนุบาล 3", room: "2" },
    { id: 13, level: "อนุบาล 3", room: "3" },
    { id: 14, level: "อนุบาล 3", room: "4" },
  ]},
  { id: 3, name: "โรงเรียนอนุบาลสาธิตบางแก้ว ๓ (ไทยสมุทร)", classrooms: [
    { id: 15, level: "อนุบาล 1", room: "1" },
    { id: 16, level: "อนุบาล 2", room: "1" },
    { id: 17, level: "อนุบาล 3", room: "1" },
  ]},
  { id: 4, name: "โรงเรียนอนุบาลสาธิตบางแก้ว ๔ (เปรมฤทัย)", classrooms: [
    { id: 18, level: "อนุบาล 1", room: "1" },
    { id: 19, level: "อนุบาล 2", room: "1" },
    { id: 20, level: "อนุบาล 3", room: "1" },
  ]},
];

// ---------------------------
// 3) Mock Generators (Students, Usage Logs, Scores)
// ---------------------------
function seededRand(seed: number): () => number {
  // LCG – reproducible randomness
  let s = seed % 2147483647;
  return () => (s = (s * 48271) % 2147483647) / 2147483647;
}

const thaiNames = [
  "เด็กชายเอ", "เด็กหญิงบี", "เด็กชายซี", "เด็กหญิงดี", "เด็กชายอี", "เด็กหญิงเอฟ", "เด็กชายจี", "เด็กหญิงเอช",
  "เด็กชายไอ", "เด็กหญิงเจ", "เด็กชายเค", "เด็กหญิงแอล", "เด็กชายเอ็ม", "เด็กหญิงเอ็น", "เด็กชายโอ", "เด็กหญิงพี",
  "เด็กชายคิว", "เด็กหญิงอาร์", "เด็กชายเอส", "เด็กหญิงที", "เด็กชายยู", "เด็กหญิงวี", "เด็กชายดับเบิลยู", "เด็กหญิงเอ็กซ์",
  "เด็กชายวาย", "เด็กหญิงแซด", "เด็กชายหนึ่ง", "เด็กหญิงสอง", "เด็กชายสาม", "เด็กหญิงสี่"
];

function buildMockData(): { students: Student[]; usageLogs: UsageLog[]; scores: Score[] } {
  const rand = seededRand(20250828);
  const students: Student[] = [];
  SCHOOL_DEFS.forEach(s => {
    s.classrooms.forEach(c => {
      const count = 18 + Math.floor(rand() * 11);
      for (let i = 0; i < count; i++) {
        const name = thaiNames[(i + c.id) % thaiNames.length] + ` (${c.level} ห้อง ${c.room})`;
        students.push({ id: students.length + 1, name, classroomId: c.id, schoolId: s.id });
      }
    });
  });
  const usageLogs: UsageLog[] = [];
  SCHOOL_DEFS.forEach(s => {
    s.classrooms.forEach(c => {
      SUBJECTS.forEach(subj => {
        const sessions = 6 + Math.floor(rand() * 7);
        for (let k = 0; k < sessions; k++) {
          const duration = 25 + Math.floor(rand() * 36); // 25–60 นาที
          const day = 1 + Math.floor(rand() * 27);      // ส.ค. 2025
          const hour = 8 + Math.floor(rand() * 5);      // 08–12 น.
          const start = new Date(`2025-08-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00`);
          const end = new Date(start.getTime() + duration * 60000);
          const acts = ACTIVITIES.filter((a: Activity) => a.subjectId === subj.id);
          const act = acts[Math.floor(rand() * acts.length)] || null;
          usageLogs.push({
            id: usageLogs.length + 1,
            schoolId: s.id,
            classroomId: c.id,
            subjectId: subj.id,
            activityId: act?.id ?? null,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            durationMinutes: duration,
          });
        }
      });
    });
  });
  const scores: Score[] = [];
  students.forEach((st: Student) => {
    const attempts = 6 + Math.floor(rand() * 7);
    for (let m = 0; m < attempts; m++) {
      const act = ACTIVITIES[Math.floor(rand() * ACTIVITIES.length)];
      const score = 60 + Math.floor(rand() * 41); // 60–100
      const day = 1 + Math.floor(rand() * 27);
      const hour = 8 + (m % 3); // 8, 9, 10
      const time = new Date(`2025-08-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:30:00`);
      scores.push({
        id: scores.length + 1,
        studentId: st.id,
        activityId: act.id,
        score,
        subjectId: act.subjectId,
        programId: SUBJECTS.find((su: Subject) => su.id === act.subjectId)?.programId ?? "",
        createdAt: time.toISOString(),
        classroomId: st.classroomId,
        schoolId: st.schoolId,
      });
    }
  });
  return { students, usageLogs, scores };
}

const DATA = buildMockData();

// ---------------------------
// 4) Helpers & Aggregations
// ---------------------------
const mapSubject: Map<number, Subject> = new Map(SUBJECTS.map((s: Subject) => [s.id, s]));
const mapActivity: Map<number, Activity> = new Map(ACTIVITIES.map((a: Activity) => [a.id, a]));
const mapProgram: Map<string, { id: string; name: string }> = new Map(PROGRAMS.map((p) => [p.id, p]));

function sum(arr: number[]): number { return arr.reduce((a, b) => a + b, 0); }
function average(arr: number[]): number { return arr.length ? sum(arr) / arr.length : 0; }

function getSchoolsSummary() {
  // เวลาเรียนรวมต่อโรงเรียน (จาก usageLogs)
  return SCHOOL_DEFS.map(s => {
    const mins = sum(
      DATA.usageLogs.filter(u => u.schoolId === s.id).map(u => u.durationMinutes)
    );
    const classrooms = s.classrooms.length;
    const students = DATA.students.filter(st => st.schoolId === s.id).length;
    return {
      schoolId: s.id,
      name: s.name,
      classrooms,
      students,
      minutes: mins,
      hours: +(mins / 60).toFixed(1),
    };
  });
}

function getProgramDistribution(schoolId: number | null): { programId: string; name: string; minutes: number; hours: number }[] {
  // แจกแจงชั่วโมงต่อโปรแกรม
  const rows = PROGRAMS.map(p => ({ programId: p.id, name: p.name, minutes: 0 }));
  const push = (u: UsageLog) => {
    const subj = mapSubject.get(u.subjectId);
    const pid = subj?.programId;
    const row = rows.find(r => r.programId === pid);
    if (row) row.minutes += u.durationMinutes;
  };
  DATA.usageLogs.forEach((u: UsageLog) => {
    if (!schoolId || u.schoolId === schoolId) push(u);
  });
  return rows.map(r => ({ ...r, hours: +(r.minutes / 60).toFixed(1) }));
}

function getSubjectsSummary({ schoolId, classroomId }: { schoolId?: number; classroomId?: number }): { subjectId: number; subject: string; program?: string; minutes: number; hours: number; avgScore: number; attempts: number }[] {
  // เวลาเรียนรวม + คะแนนเฉลี่ยต่อวิชา
  return SUBJECTS.map(subj => {
    const logs = DATA.usageLogs.filter(u => (
      (!schoolId || u.schoolId === schoolId) && (!classroomId || u.classroomId === classroomId) && u.subjectId === subj.id
    ));
    const minutes = sum(logs.map(l => l.durationMinutes));

    const sc = DATA.scores.filter(s => (
      (!schoolId || s.schoolId === schoolId) && (!classroomId || s.classroomId === classroomId) && s.subjectId === subj.id
    ));

    return {
      subjectId: subj.id,
      subject: subj.name,
      program: mapProgram.get(subj.programId)?.name,
      minutes,
      hours: +(minutes / 60).toFixed(1),
      avgScore: +average(sc.map(x => x.score)).toFixed(1),
      attempts: sc.length,
    };
  }).sort((a,b) => b.minutes - a.minutes);
}

function getClassroomsSummary(schoolId: number): { classroomId: number; name: string; students: number; minutes: number; hours: number; avgScore: number }[] {
  const school = SCHOOL_DEFS.find(s => s.id === schoolId);
  if (!school) return [];
  return school.classrooms.map(c => {
    const minutes = sum(DATA.usageLogs.filter(u => u.classroomId === c.id).map(u => u.durationMinutes));
    const stus = DATA.students.filter(st => st.classroomId === c.id);
    const sc = DATA.scores.filter(s => s.classroomId === c.id);
    return {
      classroomId: c.id,
      name: `${c.level} / ห้อง ${c.room}`,
      students: stus.length,
      minutes,
      hours: +(minutes / 60).toFixed(1),
      avgScore: +average(sc.map(x => x.score)).toFixed(1),
    };
  }).sort((a,b) => b.minutes - a.minutes);
}

function getStudentsTable({ schoolId, classroomId, search }: { schoolId?: number | null; classroomId?: number | null; search?: string }): { id: number; name: string; classroomId: number; avgScore: number; attempts: number; minutes: number; hours: number }[] {
  let rows = DATA.students.filter(st => (!schoolId || st.schoolId === schoolId) && (!classroomId || st.classroomId === classroomId));
  if (search) {
    const q = search.trim();
    rows = rows.filter(r => r.name.includes(q));
  }
  return rows.map(st => {
    const sc = DATA.scores.filter(s => s.studentId === st.id);
    const minutes = sum(DATA.usageLogs.filter(u => u.classroomId === st.classroomId).map(u => u.durationMinutes));
    return {
      id: st.id,
      name: st.name,
      classroomId: st.classroomId,
      avgScore: +average(sc.map(x => x.score)).toFixed(1),
      attempts: sc.length,
      minutes,
      hours: +(minutes / 60).toFixed(1),
    };
  });
}

function getStudentDetail(studentId: number): { subjectRows: { subject: string; avgScore: number; attempts: number }[]; activityRows: { activity: string; avgScore: number; attempts: number }[] } {
  const sc = DATA.scores.filter(s => s.studentId === studentId);
  const bySubject: { [id: number]: { subject: string; scores: number[] } } = {};
  sc.forEach((s: Score) => {
    const subj = mapSubject.get(s.subjectId);
    if (!subj) return;
    if (!bySubject[subj.id]) bySubject[subj.id] = { subject: subj.name, scores: [] };
    bySubject[subj.id].scores.push(s.score);
  });
  const subjectRows = Object.values(bySubject).map((r: { subject: string; scores: number[] }) => ({
    subject: r.subject,
    avgScore: +average(r.scores).toFixed(1),
    attempts: r.scores.length,
  })).sort((a, b) => b.avgScore - a.avgScore);
  const byActivity: { [id: number]: { activity: string; scores: number[] } } = {};
  sc.forEach((s: Score) => {
    const act = mapActivity.get(s.activityId);
    if (!act) return;
    if (!byActivity[act.id]) byActivity[act.id] = { activity: act.name, scores: [] };
    byActivity[act.id].scores.push(s.score);
  });
  const activityRows = Object.values(byActivity).map((r: { activity: string; scores: number[] }) => ({
    activity: r.activity,
    avgScore: +average(r.scores).toFixed(1),
    attempts: r.scores.length,
  })).sort((a, b) => b.avgScore - a.avgScore);
  return { subjectRows, activityRows };
}

// ---------------------------
// 5) UI Components
// ---------------------------
function Stat({ label, value, sub }: StatProps) {
  return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-100 via-pink-100 to-yellow-100 shadow-lg border border-blue-200">
      <div className="text-sm font-medium text-blue-600 drop-shadow">{label}</div>
      <div className="text-3xl font-bold text-pink-500 drop-shadow-lg">{value}</div>
      {sub && <div className="text-xs text-yellow-600 mt-1 italic">{sub}</div>}
    </div>
  );
}

type DataTableColumn = {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
};

type DataTableProps = {
  columns: DataTableColumn[];
  rows: Record<string, unknown>[];
};

function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="overflow-x-auto border rounded-2xl shadow-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gradient-to-r from-blue-200 via-pink-200 to-yellow-200">
          <tr>
            {columns.map((col: DataTableColumn) => (
              <th key={col.key} className="px-3 py-2 text-left font-semibold text-blue-700">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r: Record<string, unknown>, i: number) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-blue-50/60"}>
              {columns.map((col: DataTableColumn) => (
                <td key={col.key} className="px-3 py-2 whitespace-nowrap text-pink-700 font-medium">{col.render ? col.render(r[col.key], r) : String(r[col.key] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SmartClassroomDashboard() {
  const [role, setRole] = useState("admin");
  const [schoolId, setSchoolId] = useState(1);
  const [classroomId, setClassroomId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // --- Derived options ---
  const schoolOptions = SCHOOL_DEFS.map(s => ({ value: s.id, label: s.name }));
  const classroomOptions = useMemo(() => {
    const s = SCHOOL_DEFS.find(x => x.id === schoolId) || SCHOOL_DEFS[0];
    return s.classrooms.map(c => ({ value: c.id, label: `${c.level} / ห้อง ${c.room}` }));
  }, [schoolId]);

  // --- Aggregations for UI ---
  const schoolsSummary = useMemo(() => getSchoolsSummary(), []);
  const programDistAll = useMemo(() => getProgramDistribution(null), []);
  const programDistBySchool = useMemo(() => getProgramDistribution(schoolId), [schoolId]);
  const subjectsForAdmin = useMemo(() => getSubjectsSummary({}), []);
  const subjectsForDirector = useMemo(() => getSubjectsSummary({ schoolId }), [schoolId]);
  const subjectsForClassroom = useMemo(() => getSubjectsSummary({ schoolId, classroomId: classroomId ?? undefined }), [schoolId, classroomId]);
  const classroomsSummary = useMemo(() => getClassroomsSummary(schoolId), [schoolId]);
  const studentsRows = useMemo(() => getStudentsTable({ schoolId, classroomId, search }), [schoolId, classroomId, search]);
  const selectedDetail = useMemo(() => selectedStudentId ? getStudentDetail(selectedStudentId) : { subjectRows: [], activityRows: [] }, [selectedStudentId]);

  // --- global totals ---
  const totalStudents = DATA.students.length;
  const totalMinutes = sum(DATA.usageLogs.map(u => u.durationMinutes));
  const totalHours = +(totalMinutes / 60).toFixed(1);
  const overallAvg = +average(DATA.scores.map(s => s.score)).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Smart Classroom Dashboard</h1>
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={role} onValueChange={(v: string) => { setRole(v); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="เลือกบทบาท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">ผู้บริหารสูงสุด</SelectItem>
              <SelectItem value="director">ผู้อำนวยการ</SelectItem>
              <SelectItem value="teacher">ห้องเรียน</SelectItem>
            </SelectContent>
          </Select>

          {(role !== "admin") && (
            <Select value={String(schoolId)} onValueChange={(v: string) => setSchoolId(Number(v))}>
              <SelectTrigger className="w-[320px]"><SelectValue placeholder="เลือกโรงเรียน" /></SelectTrigger>
              <SelectContent>
                {schoolOptions.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {role === "teacher" && (
            <Select value={String(classroomId)} onValueChange={(v: string) => setClassroomId(Number(v))}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="เลือกห้องเรียน" /></SelectTrigger>
              <SelectContent>
                {classroomOptions.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center gap-2">
            <Input placeholder="ค้นหาชื่อนักเรียน" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="w-[220px]" />
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="โรงเรียนทั้งหมด" value={SCHOOL_DEFS.length} />
        <Stat label="ห้องเรียนทั้งหมด" value={SCHOOL_DEFS.reduce((a,s)=>a+s.classrooms.length,0)} />
        <Stat label="จำนวนนักเรียน" value={totalStudents} />
        <Stat label="ชั่วโมงเรียนรวม" value={`${totalHours} ชม.`} sub={`คะแนนเฉลี่ยระบบ ${overallAvg}%`} />
      </div>

      {/* Admin View */}
      {role === "admin" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Removed filter card; filter will be above student list */}
          {/* ...existing code... */}
          <Card className="col-span-1 lg:col-span-2">
            <CardContent className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-3">ชั่วโมงเรียนรวมต่อโรงเรียน</h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={schoolsSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hours" name="ชั่วโมงเรียนรวม" fill="#38bdf8" stroke="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {/* ...existing code... */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-3">สัดส่วนชั่วโมงเรียนตามโปรแกรม (รวมทุกโรงเรียน)</h2>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={programDistAll} dataKey="hours" nameKey="name" label
                    cx="50%" cy="50%" outerRadius={100}
                    fill="#38bdf8"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                  >
                    {programDistAll.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={["#38bdf8", "#34d399", "#a7f3d0", "#60a5fa"][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {/* ...existing code... */}
          <Card>
            <CardContent className="p-4 md:p-6 space-y-4">
              <h2 className="text-lg font-semibold">สรุปหน่วยการเรียนรู้ (รวมทุกโรงเรียน)</h2>
              <DataTable
                columns={[
                  { key: "program", label: "โปรแกรม" },
                  { key: "subject", label: "หน่วย" },
                  { key: "hours", label: "ชั่วโมงรวม" },
                  { key: "avgScore", label: "คะแนนเฉลี่ย (%)" },
                  { key: "attempts", label: "จำนวนนัดประเมิน" },
                ]}
                rows={subjectsForAdmin.slice(0, 12)}
              />
            </CardContent>
          </Card>
          {/* ...existing code... */}
          <Card className="lg:col-span-2">
            <CardContent className="p-4 md:p-6 space-y-4">
              <h2 className="text-lg font-semibold">นักเรียน (กรองตามโรงเรียน/ห้อง)</h2>
              <div className="flex gap-4 mb-4">
                <Select value={schoolId ? String(schoolId) : ""} onValueChange={(v: string) => { setSchoolId(Number(v)); setClassroomId(null); }}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="เลือกโรงเรียน" /></SelectTrigger>
                  <SelectContent>
                    {schoolOptions.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={classroomId ? String(classroomId) : ""} onValueChange={(v: string) => setClassroomId(Number(v))}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="เลือกห้องเรียน (ถ้ามี)" /></SelectTrigger>
                  <SelectContent>
                    {classroomOptions.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DataTable
                columns={[{ key: "id", label: "#" }, { key: "name", label: "ชื่อ" }, { key: "hours", label: "ชั่วโมง (ห้อง)" }, { key: "avgScore", label: "คะแนนเฉลี่ย" }, { key: "attempts", label: "ครั้ง" }]}
                rows={studentsRows.slice(0, 100).map(r => ({
                  ...r,
                  name: (
                    <button className="underline text-blue-600 hover:text-pink-500" onClick={() => setSelectedStudentId(r.id)}>{r.name}</button>
                  )
                }))}
              />
              {selectedStudentId && (
                <div className="space-y-4 mt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-semibold">รายละเอียดคะแนนของนักเรียน ID #{selectedStudentId}</h3>
                    <button className="text-sm underline" onClick={() => setSelectedStudentId(null)}>ปิด</button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">สรุปตามหน่วยการเรียนรู้</h4>
                      <DataTable
                        columns={[{ key: "subject", label: "หน่วย" }, { key: "avgScore", label: "คะแนนเฉลี่ย" }, { key: "attempts", label: "ครั้ง" }]}
                        rows={selectedDetail.subjectRows}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">สรุปตามกิจกรรม</h4>
                      <DataTable
                        columns={[{ key: "activity", label: "กิจกรรม" }, { key: "avgScore", label: "คะแนนเฉลี่ย" }, { key: "attempts", label: "ครั้ง" }]}
                        rows={selectedDetail.activityRows}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Director View */}
      {role === "director" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Removed filter card; filter will be above student list */}
          {/* ...existing code... */}
          <Card className="lg:col-span-2">
            <CardContent className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-3">ชั่วโมงเรียนรวมตามห้อง (โรงเรียนที่เลือก)</h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={classroomsSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hours" name="ชั่วโมงรวม" fill="#34d399" stroke="#059669" />
                  <Bar dataKey="avgScore" name="คะแนนเฉลี่ย" fill="#38bdf8" stroke="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {/* ...existing code... */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-3">สัดส่วนโปรแกรม (โรงเรียนที่เลือก)</h2>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={programDistBySchool} dataKey="hours" nameKey="name" label
                    cx="50%" cy="50%" outerRadius={100}
                    fill="#34d399"
                    stroke="#059669"
                    strokeWidth={2}
                  >
                    {programDistBySchool.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={["#38bdf8", "#34d399", "#a7f3d0", "#60a5fa"][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {/* ...existing code... */}
          <Card>
            <CardContent className="p-4 md:p-6 space-y-4">
              <h2 className="text-lg font-semibold">สรุปหน่วยการเรียนรู้ (โรงเรียนที่เลือก)</h2>
              <DataTable
                columns={[
                  { key: "program", label: "โปรแกรม" },
                  { key: "subject", label: "หน่วย" },
                  { key: "hours", label: "ชั่วโมงรวม" },
                  { key: "avgScore", label: "คะแนนเฉลี่ย (%)" },
                  { key: "attempts", label: "ครั้ง" },
                ]}
                rows={subjectsForDirector}
              />
            </CardContent>
          </Card>
          {/* ...existing code... */}
          <Card className="lg:col-span-2">
            <CardContent className="p-4 md:p-6 space-y-4">
              <h2 className="text-lg font-semibold">นักเรียน (กรองตามโรงเรียน/ห้อง)</h2>
              <div className="flex gap-4 mb-4">
                <Select value={schoolId ? String(schoolId) : ""} onValueChange={(v: string) => { setSchoolId(Number(v)); setClassroomId(null); }}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="เลือกโรงเรียน" /></SelectTrigger>
                  <SelectContent>
                    {schoolOptions.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={classroomId ? String(classroomId) : ""} onValueChange={(v: string) => setClassroomId(Number(v))}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="เลือกห้องเรียน (ถ้ามี)" /></SelectTrigger>
                  <SelectContent>
                    {classroomOptions.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DataTable
                columns={[{ key: "id", label: "#" }, { key: "name", label: "ชื่อ" }, { key: "hours", label: "ชั่วโมง (ห้อง)" }, { key: "avgScore", label: "คะแนนเฉลี่ย" }, { key: "attempts", label: "ครั้ง" }]}
                rows={studentsRows.slice(0, 150).map(r => ({
                  ...r,
                  name: (
                    <button className="underline text-blue-600 hover:text-pink-500" onClick={() => setSelectedStudentId(r.id)}>{r.name}</button>
                  )
                }))}
              />
              {selectedStudentId && (
                <div className="space-y-4 mt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-semibold">รายละเอียดคะแนนของนักเรียน ID #{selectedStudentId}</h3>
                    <button className="text-sm underline" onClick={() => setSelectedStudentId(null)}>ปิด</button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">สรุปตามหน่วยการเรียนรู้</h4>
                      <DataTable
                        columns={[{ key: "subject", label: "หน่วย" }, { key: "avgScore", label: "คะแนนเฉลี่ย" }, { key: "attempts", label: "ครั้ง" }]}
                        rows={selectedDetail.subjectRows}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">สรุปตามกิจกรรม</h4>
                      <DataTable
                        columns={[{ key: "activity", label: "กิจกรรม" }, { key: "avgScore", label: "คะแนนเฉลี่ย" }, { key: "attempts", label: "ครั้ง" }]}
                        rows={selectedDetail.activityRows}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Teacher View */}
      {role === "teacher" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-4 md:p-6 space-y-4">
              <h2 className="text-lg font-semibold">นักเรียนในห้อง (คลิกเพื่อดูรายละเอียดรายหน่วย/กิจกรรม)</h2>
              <DataTable
                columns={[
                  { key: "id", label: "#" },
                  { key: "name", label: "ชื่อ" },
                  { key: "hours", label: "ชั่วโมง (ห้อง)" },
                  { key: "avgScore", label: "คะแนนเฉลี่ย" },
                  { key: "attempts", label: "ครั้ง" },
                ]}
                rows={studentsRows.filter(r => r.classroomId === classroomId).map(r => ({ ...r, name: (
                  <button className="underline" onClick={() => setSelectedStudentId(r.id)}>{r.name}</button>
                ) }))}
              />
              {selectedStudentId && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-semibold">รายละเอียดคะแนนของนักเรียน ID #{selectedStudentId}</h3>
                    <button className="text-sm underline" onClick={() => setSelectedStudentId(null)}>ปิด</button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">สรุปตามหน่วยการเรียนรู้</h4>
                      <DataTable
                        columns={[{ key: "subject", label: "หน่วย" }, { key: "avgScore", label: "คะแนนเฉลี่ย" }, { key: "attempts", label: "ครั้ง" }]}
                        rows={selectedDetail.subjectRows}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">สรุปตามกิจกรรม</h4>
                      <DataTable
                        columns={[{ key: "activity", label: "กิจกรรม" }, { key: "avgScore", label: "คะแนนเฉลี่ย" }, { key: "attempts", label: "ครั้ง" }]}
                        rows={selectedDetail.activityRows}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-3">สรุปโปรแกรม (ห้องที่เลือก)</h2>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={getProgramDistribution(schoolId)} dataKey="hours" nameKey="name" label
                    cx="50%" cy="50%" outerRadius={100}
                    fill="#38bdf8"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                  >
                    {getProgramDistribution(schoolId).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={["#38bdf8", "#34d399", "#a7f3d0", "#60a5fa"][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6 space-y-4">
              <h2 className="text-lg font-semibold">สรุปหน่วยการเรียนรู้ (ห้องที่เลือก)</h2>
              <DataTable
                columns={[
                  { key: "program", label: "โปรแกรม" },
                  { key: "subject", label: "หน่วย" },
                  { key: "hours", label: "ชั่วโมงรวม" },
                  { key: "avgScore", label: "คะแนนเฉลี่ย (%)" },
                  { key: "attempts", label: "ครั้ง" },
                ]}
                rows={subjectsForClassroom}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
