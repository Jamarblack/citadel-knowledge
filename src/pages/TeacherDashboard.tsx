import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, LayoutDashboard, Upload, Save, User, 
  BookOpen, Calendar, CheckCircle, Search, X, Menu, Camera
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SEO from "@/components/SEO";
import Logo from "/school-logo.png"; // Ensure this image exists in your public folder

// --- CONSTANTS ---
const PSYCHOMOTOR_KEYS = ["Handwriting", "Sports", "Fluency", "Drawing", "Handling Tools"];
const AFFECTIVE_KEYS = ["Punctuality", "Neatness", "Politeness", "Honesty", "Leadership", "Attentiveness"];

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("my_class");
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Data
  const [myClassStudents, setMyClassStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  // Upload States
  const [uploadClass, setUploadClass] = useState("");
  const [uploadSubject, setUploadSubject] = useState("");
  const [uploadStudents, setUploadStudents] = useState<any[]>([]);
  const [scoreEntries, setScoreEntries] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Report Modal
  const [reportData, setReportData] = useState<any>({ attendance: { open: 110, present: 0, absent: 0 }, psychomotor: {}, affective: {}, remark: "" });
  const [studentGrades, setStudentGrades] = useState<any[]>([]);

  useEffect(() => {
    const id = localStorage.getItem('staffId');
    if (!id) navigate('/');
    fetchProfile(id!);
    fetchSubjects();
  }, []);

  const fetchProfile = async (id: string) => {
    const { data } = await supabase.from('staff').select('*').eq('id', id).single();
    if (data) {
      setTeacherProfile(data);
      if (data.assigned_class) fetchMyClass(data.assigned_class);
    }
  };

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').order('name');
    if (data) setSubjects(data);
  };

  const fetchMyClass = async (className: string) => {
    const { data } = await supabase.from('students').select('*').eq('current_class', className).order('full_name');
    if (data) setMyClassStudents(data);
  };

  // --- PROFILE UPLOAD ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length || !teacherProfile) return;
    setUploading(true);
    try {
        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `staff_${teacherProfile.id}_${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('passports').upload(filePath, file);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('passports').getPublicUrl(filePath);
        
        const { error: updateError } = await supabase.from('staff').update({ passport_url: publicUrl }).eq('id', teacherProfile.id);
        if (updateError) throw updateError;
        
        setTeacherProfile({ ...teacherProfile, passport_url: publicUrl });
        toast.success("Profile Photo Updated");
    } catch (e: any) {
        toast.error("Upload failed: " + e.message);
    } finally {
        setUploading(false);
    }
  };

  // --- REPORT CARD LOGIC ---
  const openStudentReport = async (student: any) => {
    setSelectedStudent(student);
    const { data: grades } = await supabase.from('results').select('subject, total_score, grade').eq('student_id', student.id).eq('term', '1st Term').eq('session', '2025/2026');
    setStudentGrades(grades || []);

    const { data: existingReport } = await supabase.from('term_reports').select('*').eq('student_id', student.id).eq('term', '1st Term').maybeSingle();
    
    if (existingReport) {
      setReportData({
        attendance: { open: existingReport.days_school_open || 110, present: existingReport.days_present || 0, absent: existingReport.days_absent || 0 },
        psychomotor: existingReport.psychomotor_skills || {},
        affective: existingReport.affective_skills || {},
        remark: existingReport.class_teacher_remark || ""
      });
    } else {
      setReportData({ attendance: { open: 110, present: 0, absent: 0 }, psychomotor: {}, affective: {}, remark: "" });
    }
  };

  const saveReportDetails = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
        const payload = {
            student_id: selectedStudent.id, session: '2025/2026', term: '1st Term', class_level: teacherProfile.assigned_class,
            days_school_open: reportData.attendance.open, days_present: reportData.attendance.present, days_absent: reportData.attendance.absent,
            psychomotor_skills: reportData.psychomotor, affective_skills: reportData.affective, class_teacher_remark: reportData.remark
        };
        const { error } = await supabase.from('term_reports').upsert(payload, { onConflict: 'student_id, session, term' });
        if (error) throw error;
        toast.success("Saved!"); setSelectedStudent(null);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  // --- RESULT UPLOAD LOGIC ---
  const handleClassSelect = async (className: string) => {
    setUploadClass(className); setLoading(true);
    const { data } = await supabase.from('students').select('*').eq('current_class', className).order('full_name');
    if (data) {
        setUploadStudents(data);
        setScoreEntries(data.map(s => ({ student_id: s.id, student_name: s.full_name, admission_number: s.admission_number, ca1: '', ca2: '', exam: '', position: '-', remarks: '' })));
    }
    setLoading(false);
  };

  const handleScoreChange = (index: number, field: string, value: string) => {
    const newEntries = [...scoreEntries]; newEntries[index][field] = value;
    const withTotals = newEntries.map(e => ({ ...e, total: (Number(e.ca1)||0) + (Number(e.ca2)||0) + (Number(e.exam)||0) }));
    const sorted = [...withTotals].sort((a,b) => b.total - a.total);
    setScoreEntries(withTotals.map(e => {
        const rank = sorted.findIndex(s => s.total === e.total) + 1;
        const s = ["th","st","nd","rd"], v = rank%100;
        
        // Calculate Grade
        let grade = 'F';
        if (e.total >= 70) grade = 'A';
        else if (e.total >= 60) grade = 'B';
        else if (e.total >= 50) grade = 'C';
        else if (e.total >= 40) grade = 'D';
        else grade = 'E';

        return { ...e, grade, position: e.total > 0 ? rank+(s[(v-20)%10]||s[v]||s[0]) : '-' };
    }));
  };

  const submitScores = async () => {
    if (!uploadSubject || !uploadClass) return toast.error("Select Class & Subject");
    if (scoreEntries.length === 0) return toast.error("No students found in this class.");

    setLoading(true);
    try {
        const formatted = scoreEntries.map(e => {
            const total = (Number(e.ca1)||0)+(Number(e.ca2)||0)+(Number(e.exam)||0);
            return {
                student_id: e.student_id, student_name: e.student_name, admission_number: e.admission_number,
                subject: uploadSubject, class_level: uploadClass, term: '1st Term', session: '2025/2026',
                teacher_id: teacherProfile.id, teacher_name: teacherProfile.full_name,
                ca1_score: Number(e.ca1) || 0, ca2_score: Number(e.ca2) || 0, exam_score: Number(e.exam) || 0,
                grade: e.grade, // Use pre-calculated grade
                position: e.position, remarks: e.remarks, status: 'pending'
            };
        });
        const { error } = await supabase.from('results').insert(formatted);
        if (error) throw error;
        toast.success("Results Uploaded Successfully!"); 
        setUploadClass(""); setUploadStudents([]); setScoreEntries([]);
    } catch(e:any) { toast.error("Upload Failed: " + e.message); } finally { setLoading(false); }
  };

  const filteredSubjects = subjects.filter(sub => sub.section === 'General' || sub.section === (teacherProfile?.section || 'Secondary'));

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
       <div className="p-8 text-center bg-amber-50/50 border-b border-amber-100">
           <div className="w-24 h-24 mx-auto rounded-full bg-amber-900 border-4 border-amber-100 relative group overflow-hidden">
               {teacherProfile?.passport_url ? <img src={teacherProfile.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-3xl font-bold text-white">{teacherProfile?.full_name?.[0]}</span>}
               <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                   <Camera className="text-white" size={24} />
                   <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
               </label>
           </div>
           <h3 className="font-bold text-amber-950 mt-3 truncate px-2">{teacherProfile?.full_name}</h3>
           <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">{teacherProfile?.section} Teacher</span>
       </div>
       <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => {setActiveTab('my_class'); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'my_class' ? 'bg-amber-900 text-white shadow-lg' : 'text-gray-500 hover:bg-amber-50'}`}><BookOpen size={20} /> My Class</button>
          <button onClick={() => {setActiveTab('upload'); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'upload' ? 'bg-amber-900 text-white shadow-lg' : 'text-gray-500 hover:bg-amber-50'}`}><Upload size={20} /> Upload Results</button>
       </nav>
       <div className="p-4 border-t"><button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl flex items-center justify-center gap-2"><LogOut size={18} /> Sign Out</button></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f5f2] font-sans flex flex-col md:flex-row">
      <SEO title="Teacher Portal" description="Staff Area" noindex={true} />
      
      <header className="md:hidden p-4 bg-white border-b border-amber-100 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-amber-900 text-white flex items-center justify-center font-bold">
             {Logo ? <img src={Logo} alt="Logo" className="w-full h-full object-cover rounded-full" /> : (teacherProfile?.full_name?.[0] || 'T')}
           </div>
           <span className="font-bold text-amber-950">Staff Portal</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-amber-900 bg-amber-50 rounded-lg"><Menu size={24} /></button>
      </header>

      <aside className="hidden md:flex w-72 bg-white border-r border-amber-900/10 flex-col sticky top-0 h-screen z-30 shrink-0"><SidebarContent /></aside>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}><SheetContent side="left" className="p-0 w-72 bg-white border-none"><SidebarContent /></SheetContent></Sheet>

      <main className="flex-1 h-[calc(100vh-65px)] md:h-screen overflow-y-auto">
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
           
           {activeTab === 'my_class' && (
             <div className="animate-in fade-in space-y-6">
                <div className="flex justify-between items-center">
                    <div><h1 className="text-2xl font-bold text-amber-950">Manage Class: {teacherProfile?.assigned_class || 'No Class Assigned'}</h1><p className="text-gray-500 text-sm">Click on a student to enter Attendance, Remarks, and Skills.</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myClassStudents.map(student => (
                        <div key={student.id} onClick={() => openStudentReport(student)} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center gap-4 group">
                            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-800 font-bold text-xl group-hover:bg-amber-900 group-hover:text-white transition-colors">{student.full_name[0]}</div>
                            <div><h3 className="font-bold text-gray-800">{student.full_name}</h3><p className="text-xs text-gray-400 font-mono">{student.admission_number}</p></div>
                            <div className="ml-auto text-amber-300 group-hover:text-amber-600"><CheckCircle size={20} /></div>
                        </div>
                    ))}
                </div>
             </div>
           )}

           {activeTab === 'upload' && (
             <div className="animate-in fade-in space-y-6">
                <h1 className="text-2xl font-bold text-amber-950">Upload Result Broadsheet</h1>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100 flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full">
                        <label className="text-xs font-bold text-gray-400 uppercase">Class</label>
                        <select onChange={(e) => handleClassSelect(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl font-bold">
                            <option value="">-- Select Class --</option>
                            {[
                              "JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3", 
                              "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", 
                              "KG 1", "KG 2", "Nursery 1", "Nursery 2"
                            ].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="w-full">
                        <label className="text-xs font-bold text-gray-400 uppercase">Subject</label>
                        <select onChange={(e) => setUploadSubject(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl font-bold">
                            <option value="">-- Select Subject --</option>
                            {filteredSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                {uploadStudents.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-amber-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-amber-950 text-white"><tr><th className="p-4">Student</th><th className="p-4 w-20 text-center">1st CA</th><th className="p-4 w-20 text-center">2nd CA</th><th className="p-4 w-20 text-center">Exam</th><th className="p-4 w-20 text-center">Total</th><th className="p-4 w-20 text-center">Grade</th></tr></thead>
                                <tbody>{scoreEntries.map((entry, i) => (<tr key={entry.student_id} className="border-b"><td className="p-4 font-bold">{entry.student_name}</td><td className="p-2"><input type="number" className="w-full p-2 bg-gray-50 border rounded text-center" value={entry.ca1} onChange={e => handleScoreChange(i, 'ca1', e.target.value)}/></td><td className="p-2"><input type="number" className="w-full p-2 bg-gray-50 border rounded text-center" value={entry.ca2} onChange={e => handleScoreChange(i, 'ca2', e.target.value)}/></td><td className="p-2"><input type="number" className="w-full p-2 bg-gray-50 border rounded text-center font-bold text-blue-900" value={entry.exam} onChange={e => handleScoreChange(i, 'exam', e.target.value)}/></td><td className="p-4 text-center font-bold">{(Number(entry.ca1)||0)+(Number(entry.ca2)||0)+(Number(entry.exam)||0)}</td><td className="p-4 text-center font-bold">{entry.grade || '-'}</td></tr>))}</tbody>
                            </table>
                        </div>
                        <div className="p-4 flex justify-end"><button onClick={submitScores} disabled={loading} className="px-8 py-3 bg-amber-900 text-white font-bold rounded-xl shadow hover:bg-amber-800">{loading ? 'Saving...' : 'Submit Results'}</button></div>
                    </div>
                )}
             </div>
           )}
        </div>
      </main>

      {/* MODAL (Same as before) */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-10 animate-in zoom-in-95">
                <div className="bg-amber-50 p-6 flex justify-between items-center border-b border-amber-100">
                    <div><h2 className="text-xl font-bold text-amber-950">Report Card: {selectedStudent.full_name}</h2></div>
                    <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-white rounded-full"><X size={24}/></button>
                </div>
                <div className="p-6 space-y-6 h-[70vh] overflow-y-auto">
                    <div className="bg-gray-50 p-4 rounded-xl border"><h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Academic Snapshot</h3><div className="grid grid-cols-2 gap-2">{studentGrades.map((g, i) => (<div key={i} className="flex justify-between text-sm p-2 bg-white rounded border"><span>{g.subject}</span><span className="font-bold">{g.total_score} ({g.grade})</span></div>))}</div></div>
                    <div><h3 className="text-purple-700 font-bold mb-3">Attendance</h3><div className="grid grid-cols-3 gap-4"><div><label className="text-xs font-bold">Opened</label><input type="number" className="w-full p-2 border rounded-lg" value={reportData.attendance.open} onChange={e => setReportData({...reportData, attendance: {...reportData.attendance, open: e.target.value}})}/></div><div><label className="text-xs font-bold">Present</label><input type="number" className="w-full p-2 border rounded-lg" value={reportData.attendance.present} onChange={e => setReportData({...reportData, attendance: {...reportData.attendance, present: e.target.value}})}/></div><div><label className="text-xs font-bold">Absent</label><input type="number" className="w-full p-2 border rounded-lg" value={reportData.attendance.absent} onChange={e => setReportData({...reportData, attendance: {...reportData.attendance, absent: e.target.value}})}/></div></div></div>
                    <div><h3 className="text-purple-700 font-bold mb-3">Psychomotor (1-5)</h3><div className="grid grid-cols-2 gap-4">{PSYCHOMOTOR_KEYS.map(k => (<div key={k}><label className="text-xs font-bold text-gray-500 uppercase">{k}</label><select className="w-full p-2 border rounded-lg" value={reportData.psychomotor[k]||""} onChange={e => setReportData({...reportData, psychomotor:{...reportData.psychomotor,[k]:e.target.value}})}><option value="">-</option>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n}</option>)}</select></div>))}</div></div>
                    <div><h3 className="text-purple-700 font-bold mb-3">Affective (1-5)</h3><div className="grid grid-cols-2 gap-4">{AFFECTIVE_KEYS.map(k => (<div key={k}><label className="text-xs font-bold text-gray-500 uppercase">{k}</label><select className="w-full p-2 border rounded-lg" value={reportData.affective[k]||""} onChange={e => setReportData({...reportData, affective:{...reportData.affective,[k]:e.target.value}})}><option value="">-</option>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n}</option>)}</select></div>))}</div></div>
                    <div><h3 className="text-purple-700 font-bold mb-3">Teacher's Remark</h3><textarea className="w-full p-3 border rounded-xl" rows={3} value={reportData.remark} onChange={e => setReportData({...reportData, remark: e.target.value})}></textarea></div>
                </div>
                <div className="p-4 border-t bg-gray-50"><button onClick={saveReportDetails} disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg">{loading ? 'Saving...' : 'Save Report Details'}</button></div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;