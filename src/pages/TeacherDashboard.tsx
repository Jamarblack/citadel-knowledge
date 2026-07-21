import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Upload, BookOpen, CheckCircle, X, Menu, Camera, Send, FileEdit, RefreshCcw, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SEO from "@/components/SEO";
import Logo from "/school-logo.png"; 

const PSYCHOMOTOR_KEYS = ["Handwriting", "Sports", "Fluency", "Drawing", "Handling Tools"];
const AFFECTIVE_KEYS = ["Punctuality", "Neatness", "Politeness", "Honesty", "Leadership", "Attentiveness"];

const CLASS_ARMS: Record<string, string[]> = { "KG 1": ["Gold", "Diamond", "Silver"], "KG 2": ["Candy", "Chocolate", "Strawberry"], "KG 3": ["Rose", "Vanilla", "Sweet"], "Pry 1": ["Greatness", "Glorious", "Progress"], "Pry 2": ["Mars", "Jupiter", "Mercury"], "Pry 3": ["Pluto", "Neptune", "Uranus"], "Pry 4": ["South America", "North America", "Africa", "Europe"], "Pry 5": ["Asia", "Antarctica"], "Creche": [], "JSS 1": [], "JSS 2": [], "JSS 3": [], "SS 1": [], "SS 2": [], "SS 3": [] };

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("my_class");
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({ session: '2025/2026', term: '1st Term' });
  const [myClassStudents, setMyClassStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [uploadBaseClass, setUploadBaseClass] = useState("");
  const [uploadArm, setUploadArm] = useState("");
  const [uploadSubject, setUploadSubject] = useState("");
  const [scoreEntries, setScoreEntries] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>({ attendance: { open: 110, present: 0, absent: 0 }, psychomotor: {}, affective: {}, remark: "" });
  const [studentGrades, setStudentGrades] = useState<any[]>([]);
  
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const isSecondary = uploadBaseClass.includes("JSS") || uploadBaseClass.includes("SS");
  const is3rdTermSecondary = isSecondary && globalSettings.term === "3rd Term";

  useEffect(() => { const id = localStorage.getItem('staffId'); if (!id) navigate('/'); fetchProfile(id!); fetchSubjects(); fetchSettings(); }, []);
  const fetchSettings = async () => { const { data } = await supabase.from('school_settings').select('*').single(); if (data) setGlobalSettings({ session: data.current_session, term: data.current_term }); };
  const fetchProfile = async (id: string) => { const { data } = await supabase.from('staff').select('*').eq('id', id).single(); if (data) { setTeacherProfile(data); if (data.assigned_class) fetchMyClass(data.assigned_class); } };
  const fetchSubjects = async () => { const { data } = await supabase.from('subjects').select('*').order('name'); if (data) setSubjects(data); };
  const fetchMyClass = async (className: string) => { const { data } = await supabase.from('students').select('*').eq('current_class', className).order('full_name'); if (data) setMyClassStudents(data.filter(s => s.full_name && s.full_name.trim() !== "")); };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => { 
      if (!event.target.files?.length || !teacherProfile) return; 
      setUploading(true); 
      try { 
          const file = event.target.files[0]; 
          const filePath = `staff_${teacherProfile.id}_${Math.random()}.${file.name.split('.').pop()}`; 
          await supabase.storage.from('passports').upload(filePath, file); 
          const { data: { publicUrl } } = supabase.storage.from('passports').getPublicUrl(filePath); 
          await supabase.from('staff').update({ passport_url: publicUrl }).eq('id', teacherProfile.id); 
          setTeacherProfile({ ...teacherProfile, passport_url: publicUrl }); 
          toast.success("Profile Photo Updated"); 
      } catch (e: any) { 
          toast.error("Upload failed"); 
      } finally { 
          setUploading(false); 
      } 
  };

  const calculateGradeAndRemarks = (totalScore: number, studentClass: string) => {
    const isSec = studentClass.includes("JSS") || studentClass.includes("SS");
    if (isSec) {
      if (totalScore >= 80) return { grade: 'A', remark: 'Excellent' };
      if (totalScore >= 70) return { grade: 'B', remark: 'Very Good' };
      if (totalScore >= 60) return { grade: 'C', remark: 'Good' };
      if (totalScore >= 50) return { grade: 'D', remark: 'Average' };
      if (totalScore >= 45) return { grade: 'E', remark: 'Pass' };
      return { grade: 'F', remark: 'Fail' };
    } else {
      if (totalScore >= 80) return { grade: 'A', remark: 'Excellent' };
      if (totalScore >= 70) return { grade: 'B', remark: 'V.Good' };
      if (totalScore >= 60) return { grade: 'C', remark: 'Good' };
      if (totalScore >= 50) return { grade: 'D', remark: 'Average' };
      if (totalScore >= 40) return { grade: 'E', remark: 'Fair' };
      return { grade: 'F', remark: 'Fail' };
    }
  };

  // NOTE: `t1_total` / `t2_total` are NOT database columns. For a 3rd Term secondary
  // subject, we compute the whole-year average by fetching the student's already-saved
  // 1st Term and 2nd Term `total_score` from the `results` table itself, on the fly.
  const loadClassAndSubject = async (fullClassName: string, selectedSubject: string) => {
    if (!fullClassName || !selectedSubject) return;
    setLoading(true);
    try {
      const isSecClass = fullClassName.includes("JSS") || fullClassName.includes("SS");
      const is3rdTerm = isSecClass && globalSettings.term === "3rd Term";

      const { data: students } = await supabase.from('students').select('*').eq('current_class', fullClassName).order('full_name');
      if (!students) return;

      const { data: existingResults } = await supabase.from('results').select('*').eq('class_level', fullClassName).eq('subject', selectedSubject).eq('term', globalSettings.term).eq('session', globalSettings.session);

      let firstTermResults: any[] = [];
      let secondTermResults: any[] = [];
      if (is3rdTerm) {
        const { data: t1data } = await supabase.from('results').select('student_id, total_score').eq('class_level', fullClassName).eq('subject', selectedSubject).eq('term', '1st Term').eq('session', globalSettings.session);
        const { data: t2data } = await supabase.from('results').select('student_id, total_score').eq('class_level', fullClassName).eq('subject', selectedSubject).eq('term', '2nd Term').eq('session', globalSettings.session);
        firstTermResults = t1data || [];
        secondTermResults = t2data || [];
      }

      const validStudents = students.filter(s => s.full_name && s.full_name.trim() !== "");

      const mergedEntries = validStudents.map(student => {
        const existing = existingResults?.find(r => r.student_id === student.id);
        const cq = existing?.class_quiz !== null && existing?.class_quiz !== undefined ? existing.class_quiz : '';
        const hq = existing?.home_quiz !== null && existing?.home_quiz !== undefined ? existing.home_quiz : '';
        const ca1 = existing?.ca1_score !== null && existing?.ca1_score !== undefined ? existing.ca1_score : '';
        const ca2 = existing?.ca2_score !== null && existing?.ca2_score !== undefined ? existing.ca2_score : '';
        const exam = existing?.exam_score !== null && existing?.exam_score !== undefined ? existing.exam_score : '';

        const t1Total = is3rdTerm ? (firstTermResults.find(r => r.student_id === student.id)?.total_score ?? 0) : 0;
        const t2Total = is3rdTerm ? (secondTermResults.find(r => r.student_id === student.id)?.total_score ?? 0) : 0;

        const term3Total = (Number(ca1)||0) + (Number(ca2)||0) + (Number(exam)||0);
        const overallTotal = is3rdTerm
            ? (Number(t1Total)||0) + (Number(t2Total)||0) + term3Total
            : (Number(cq)||0) + (Number(hq)||0) + term3Total;

        const gradingScore = is3rdTerm ? Math.round((overallTotal / 3) * 10) / 10 : overallTotal;

        const hasEntry = ca1 !== '' || ca2 !== '' || exam !== '' || cq !== '' || hq !== '';

        return {
          student_id: student.id, student_name: student.full_name, admission_number: student.admission_number,
          class_quiz: cq, home_quiz: hq, ca1: ca1, ca2: ca2, exam: exam, t1_total: t1Total, t2_total: t2Total, 
          term3_total: term3Total,
          total: gradingScore,
          grade: hasEntry ? calculateGradeAndRemarks(gradingScore, fullClassName).grade : '',
          status: existing?.status || 'new', position: existing?.position || '-'
        };
      });
      setScoreEntries(mergedEntries);
    } catch (e: any) { toast.error("Error loading class list."); } finally { setLoading(false); }
  };

  const handleScoreChange = (index: number, field: string, value: string) => {
    const newEntries = [...scoreEntries]; 
    newEntries[index][field] = value;
    
    const currentFullClass = uploadArm ? `${uploadBaseClass} ${uploadArm}` : uploadBaseClass;
    const isSecClass = currentFullClass.includes("JSS") || currentFullClass.includes("SS");
    const is3rdTerm = isSecClass && globalSettings.term === "3rd Term";

    const withTotals = newEntries.map(e => {
        const term3 = (Number(e.ca1)||0) + (Number(e.ca2)||0) + (Number(e.exam)||0);
        const overall = is3rdTerm ? (Number(e.t1_total)||0) + (Number(e.t2_total)||0) + term3 : (Number(e.class_quiz)||0) + (Number(e.home_quiz)||0) + term3;
        const gradingScore = is3rdTerm ? Math.round((overall / 3) * 10) / 10 : overall;
        return { ...e, term3_total: term3, total: gradingScore };
    });

    const sorted = [...withTotals].sort((a,b) => b.total - a.total);

    setScoreEntries(withTotals.map(e => {
        const rank = sorted.findIndex(s => s.total === e.total) + 1;
        const s = ["th","st","nd","rd"], v = rank%100;
        const { grade } = calculateGradeAndRemarks(e.total, currentFullClass);
        const hasEntry = e.ca1 !== '' || e.ca2 !== '' || e.exam !== '' || e.class_quiz !== '' || e.home_quiz !== '';
        return { ...e, grade: hasEntry ? grade : '', position: hasEntry ? rank+(s[(v-20)%10]||s[v]||s[0]) : '-' };
    }));
  };

  const handleClearSheet = () => { setIsClearModalOpen(true); };

  const confirmClearSheet = () => {
      const clearedEntries = scoreEntries.map(e => ({
          ...e, class_quiz: '', home_quiz: '', ca1: '', ca2: '', exam: '', term3_total: 0, total: 0, grade: '', position: '-', status: 'new'
          // t1_total / t2_total are historical (read-only) and are intentionally left untouched
      }));
      setScoreEntries(clearedEntries);
      toast.info("Sheet cleared.");
      setIsClearModalOpen(false); 
  };

  const processUpload = async (targetStatus: 'draft' | 'pending') => {
    const fullClassName = uploadArm ? `${uploadBaseClass} ${uploadArm}` : uploadBaseClass;
    const isSecClass = fullClassName.includes("JSS") || fullClassName.includes("SS");
    const is3rdTerm = isSecClass && globalSettings.term === "3rd Term";

    if (!uploadSubject || !fullClassName) return toast.error("Select Class & Subject");
    const validEntries = scoreEntries.filter(e => e.ca1 !== '' || e.ca2 !== '' || e.exam !== '' || e.class_quiz !== '' || e.home_quiz !== '');
    if (validEntries.length === 0) return toast.error("No scores entered yet!");

    setLoading(true);
    try {
        const formatted = validEntries.map(e => {
            const term3 = (Number(e.ca1)||0) + (Number(e.ca2)||0) + (Number(e.exam)||0);
            const overall = is3rdTerm ? (Number(e.t1_total)||0) + (Number(e.t2_total)||0) + term3 : (Number(e.class_quiz)||0) + (Number(e.home_quiz)||0) + term3;
            const gradingScore = is3rdTerm ? Math.round((overall / 3) * 10) / 10 : overall;
            const { grade, remark } = calculateGradeAndRemarks(gradingScore, fullClassName);

            // IMPORTANT: only columns that exist on `results` are sent to Supabase.
            // t1_total / t2_total are NOT real columns — they're derived on read from
            // that student's saved 1st/2nd Term rows, so they must never be inserted.
            return {
                student_id: e.student_id, student_name: e.student_name, admission_number: e.admission_number, subject: uploadSubject, class_level: fullClassName, 
                term: globalSettings.term, session: globalSettings.session, teacher_id: teacherProfile.id, teacher_name: teacherProfile.full_name,
                class_quiz: Number(e.class_quiz) || 0, home_quiz: Number(e.home_quiz) || 0, ca1_score: Number(e.ca1) || 0, ca2_score: Number(e.ca2) || 0, exam_score: Number(e.exam) || 0,
                total_score: gradingScore,
                grade: grade || 'F', position: e.position || '-', remarks: remark || 'Fail', status: targetStatus 
            };
        });
        
        const studentIds = formatted.map(f => f.student_id);
        await supabase.from('results').delete().eq('subject', uploadSubject).eq('term', globalSettings.term).eq('session', globalSettings.session).in('student_id', studentIds);

        const { error } = await supabase.from('results').insert(formatted);
        if (error) throw error;
        
        if (targetStatus === 'draft') { toast.success("Draft Saved!"); loadClassAndSubject(fullClassName, uploadSubject); } 
        else { toast.success("Results Submitted to Admin!"); setUploadBaseClass(""); setUploadArm(""); setUploadSubject(""); setScoreEntries([]); }
    } catch(e:any) { toast.error("Upload Failed: " + e.message); } finally { setLoading(false); }
  };

  const openStudentReport = async (student: any) => { 
      setSelectedStudent(student); 
      // total_score / grade are already fully computed and stored at upload time,
      // so we just read them back — no need to touch non-existent columns like t1_total.
      const { data: rawGrades } = await supabase.from('results').select('subject, total_score, grade').eq('student_id', student.id).eq('term', globalSettings.term).eq('session', globalSettings.session); 
      setStudentGrades(rawGrades || []);

      const { data: existingReports } = await supabase.from('term_reports')
        .select('*').eq('student_id', student.id).eq('term', globalSettings.term).eq('session', globalSettings.session).limit(1); 
      
      const existingReport = existingReports?.[0];

      if (existingReport) { setReportData({ attendance: { open: existingReport.days_school_open || 110, present: existingReport.days_present || 0, absent: existingReport.days_absent || 0 }, psychomotor: existingReport.psychomotor_skills || {}, affective: existingReport.affective_skills || {}, remark: existingReport.class_teacher_remark || "" }); } 
      else { setReportData({ attendance: { open: 110, present: 0, absent: 0 }, psychomotor: {}, affective: {}, remark: "" }); } 
  };
  
  const saveReportDetails = async () => { 
      if (!selectedStudent) return; 
      setLoading(true); 
      try { 
          const payload = { student_id: selectedStudent.id, session: globalSettings.session, term: globalSettings.term, class_level: teacherProfile.assigned_class, days_school_open: reportData.attendance.open, days_present: reportData.attendance.present, days_absent: reportData.attendance.absent, psychomotor_skills: reportData.psychomotor, affective_skills: reportData.affective, class_teacher_remark: reportData.remark }; 
          
          const { data: check } = await supabase.from('term_reports').select('id').eq('student_id', selectedStudent.id).eq('term', globalSettings.term).eq('session', globalSettings.session).limit(1);

          if (check && check.length > 0) {
              const { error } = await supabase.from('term_reports').update(payload).eq('id', check[0].id);
              if (error) throw error;
          } else {
              const { error } = await supabase.from('term_reports').insert([payload]);
              if (error) throw error;
          }

          toast.success("Report Saved Successfully!"); 
          setSelectedStudent(null); 
      } catch (e: any) { 
          toast.error("Error Saving: " + e.message); 
      } finally { 
          setLoading(false); 
      } 
  };
  
  const filteredSubjects = subjects.filter(sub => sub.section === 'General' || sub.section === (teacherProfile?.section || 'Secondary'));

  const SidebarContent = () => ( 
    <div className="h-full flex flex-col bg-white"> 
        <div className="p-8 text-center bg-gray-50 border-b border-gray-100"> 
            <div className="w-24 h-24 mx-auto rounded-full bg-indigo-900 border-4 border-indigo-50 relative group overflow-hidden shadow-sm"> 
                {teacherProfile?.passport_url ? <img src={teacherProfile.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-3xl font-bold text-white">{teacherProfile?.full_name?.[0] || 'T'}</span>} 
                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Camera className="text-white" size={24} /><input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} /></label> 
            </div> 
            <h3 className="font-bold text-gray-900 mt-4 truncate px-2">{teacherProfile?.full_name || 'Staff Member'}</h3> 
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full mt-2 inline-block">{teacherProfile?.section} Teacher</span> 
        </div> 
        <nav className="flex-1 p-4 space-y-2"> 
            <button onClick={() => {setActiveTab('my_class'); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${activeTab === 'my_class' ? 'bg-indigo-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><BookOpen size={20} /> My Class</button> 
            <button onClick={() => {setActiveTab('upload'); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${activeTab === 'upload' ? 'bg-indigo-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><Upload size={20} /> Upload Results</button> 
        </nav> 
        <div className="p-4 border-t border-gray-100">
            <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full py-3.5 text-red-600 font-bold hover:bg-red-50 rounded-xl flex items-center justify-center gap-2 transition-colors"><LogOut size={18} /> Sign Out</button>
        </div> 
    </div> 
  );

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans flex flex-col md:flex-row">
      <SEO title="Teacher Portal" description="Staff Area" noindex={true} />
      
      <header className="md:hidden p-4 bg-white border-b border-gray-200 flex justify-between items-center sticky top-0 z-20 shadow-sm"> 
          <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-900 text-white flex items-center justify-center font-bold shadow-sm">{Logo ? <img src={Logo} alt="Logo" className="w-full h-full object-cover rounded-full" /> : (teacherProfile?.full_name?.[0] || 'T')}</div>
              <span className="font-bold text-gray-900 tracking-tight">Staff Portal</span>
          </div> 
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><Menu size={24} /></button> 
      </header>

      <aside className="hidden md:flex w-72 bg-white border-r border-gray-200 flex-col sticky top-0 h-screen z-30 shrink-0 shadow-sm"><SidebarContent /></aside>
      
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}><SheetContent side="left" className="p-0 w-72 bg-white border-none shadow-2xl"><SidebarContent /></SheetContent></Sheet>

      <main className="flex-1 h-[calc(100vh-73px)] md:h-screen overflow-y-auto">
        <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto">
           {activeTab === 'my_class' && ( 
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6"> 
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"> 
                       <div>
                           <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Class: {teacherProfile?.assigned_class || 'Unassigned'}</h1>
                           <p className="text-gray-500 text-sm mt-1">Select a student below to update their termly reports.</p>
                       </div> 
                   </div> 
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"> 
                       {myClassStudents.map(student => ( 
                           <div key={student.id} onClick={() => openStudentReport(student)} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 cursor-pointer transition-all flex items-center gap-4 group"> 
                               <div className="w-14 h-14 shrink-0 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">{student?.full_name?.[0] || '?'}</div> 
                               <div className="overflow-hidden">
                                   <h3 className="font-bold text-gray-900 truncate">{student?.full_name || 'Unknown Student'}</h3>
                                   <p className="text-xs text-gray-500 font-mono mt-0.5">{student?.admission_number || 'No ID'}</p>
                               </div> 
                               <div className="ml-auto text-gray-300 group-hover:text-green-500 transition-colors"><CheckCircle size={22} /></div> 
                           </div> 
                       ))} 
                       {myClassStudents.length === 0 && ( 
                           <div className="col-span-full p-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300"> 
                               <p className="font-medium">No students found in your assigned class.</p> 
                           </div> 
                       )} 
                   </div> 
               </div> 
           )}

           {activeTab === 'upload' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Score Entry</h1>
                    <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold border border-indigo-100">{globalSettings.term} - {globalSettings.session}</span>
                </div>

                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="w-full"> 
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">1. Select Class</label> 
                        <select value={uploadBaseClass} onChange={(e) => { setUploadBaseClass(e.target.value); setUploadArm(""); setScoreEntries([]); }} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"> 
                            <option value="">-- Choose --</option> {Object.keys(CLASS_ARMS).map(c => <option key={c} value={c}>{c}</option>)} 
                        </select> 
                    </div>
                    {CLASS_ARMS[uploadBaseClass]?.length > 0 ? ( 
                        <div className="w-full animate-in zoom-in duration-300"> 
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">2. Select Arm</label> 
                            <select value={uploadArm} onChange={(e) => { setUploadArm(e.target.value); if (uploadSubject) loadClassAndSubject(`${uploadBaseClass} ${e.target.value}`, uploadSubject); }} className="w-full p-3.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"> 
                                <option value="">-- Choose --</option> {CLASS_ARMS[uploadBaseClass].map(a => <option key={a} value={a}>{a}</option>)} 
                            </select> 
                        </div> 
                    ) : ( <div className="w-full hidden sm:block"></div> )}
                    <div className="w-full"> 
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">3. Select Subject</label> 
                        <select value={uploadSubject} onChange={(e) => { setUploadSubject(e.target.value); const fullClassName = uploadArm ? `${uploadBaseClass} ${uploadArm}` : uploadBaseClass; loadClassAndSubject(fullClassName, e.target.value); }} disabled={!uploadBaseClass || (CLASS_ARMS[uploadBaseClass]?.length > 0 && !uploadArm)} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"> 
                            <option value="">-- Choose --</option> {filteredSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)} 
                        </select> 
                    </div>
                </div>

                {scoreEntries.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
                        
                        <div className="p-4 bg-blue-50 border-b border-blue-100 text-sm text-blue-800 flex items-start md:items-center gap-3"> 
                            <AlertTriangle size={20} className="shrink-0 mt-0.5 md:mt-0" />
                            <p><strong>Heads Up:</strong> To input scores for a fresh term, use the <strong className="text-red-600">Clear Sheet</strong> button below to wipe the slates clean before typing.</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-900 text-white"> 
                                    <tr> 
                                        <th className="p-4 font-bold tracking-wider uppercase text-xs">Student Name</th> 

                                        {is3rdTermSecondary ? (
                                          <>
                                            <th className="p-4 w-28 text-center font-bold tracking-wider uppercase text-xs bg-blue-900">1st Term</th>
                                            <th className="p-4 w-28 text-center font-bold tracking-wider uppercase text-xs bg-blue-900">2nd Term</th>
                                            <th className="p-4 w-24 text-center font-bold tracking-wider uppercase text-xs">3rd Term <br></br>1st CA</th> 
                                            <th className="p-4 w-24 text-center font-bold tracking-wider uppercase text-xs">3rd Term <br></br>2nd CA</th> 
                                            <th className="p-4 w-24 text-center font-bold tracking-wider uppercase text-xs">3rd Term <br></br>Exam</th> 
                                            <th className="p-4 w-24 text-center font-bold tracking-wider uppercase text-xs bg-gray-800">3rd Term <br></br>Total</th>
                                          </>
                                        ) : (
                                          <>
                                            <th className="p-4 w-24 text-center font-bold tracking-wider uppercase text-xs">Class Quiz</th>
                                            <th className="p-4 w-24 text-center font-bold tracking-wider uppercase text-xs">Home Quiz</th>
                                            <th className="p-4 w-24 text-center font-bold tracking-wider uppercase text-xs">1st CA</th> 
                                            <th className="p-4 w-24 text-center font-bold tracking-wider uppercase text-xs">2nd CA</th> 
                                            <th className="p-4 w-24 text-center font-bold tracking-wider uppercase text-xs">Exam</th> 
                                          </>
                                        )}

                                        <th className="p-4 w-24 text-center text-indigo-300 font-black tracking-wider uppercase text-xs">{is3rdTermSecondary ? 'Average' : 'Total'}</th> 
                                        <th className="p-4 w-20 text-center font-bold tracking-wider uppercase text-xs">Grade</th> 
                                        <th className="p-4 w-32 text-center font-bold tracking-wider uppercase text-xs">Status</th> 
                                    </tr> 
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {scoreEntries.map((entry, i) => {
                                    const hasEntry = entry.ca1 !== '' || entry.ca2 !== '' || entry.exam !== '' || entry.class_quiz !== '' || entry.home_quiz !== '';
                                    const { grade } = calculateGradeAndRemarks(entry.total, uploadArm ? `${uploadBaseClass} ${uploadArm}` : uploadBaseClass);
                                    
                                    return (
                                      <tr key={entry.student_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-bold text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50 border-r border-gray-100 drop-shadow-sm min-w-[200px] truncate">{entry.student_name || 'Unknown Student'}</td>
                                        
                                        {is3rdTermSecondary ? (
                                          <>
                                            <td className="p-4 text-center font-bold text-blue-900 bg-blue-50/60 border-r border-gray-50">{entry.t1_total || 0}</td>
                                            <td className="p-4 text-center font-bold text-blue-900 bg-blue-50/60 border-r border-gray-50">{entry.t2_total || 0}</td>
                                            <td className="p-2 border-r border-gray-50"><input type="number" className="w-full min-w-[60px] p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-center font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={entry.ca1} onChange={e => handleScoreChange(i, 'ca1', e.target.value)}/></td>
                                            <td className="p-2 border-r border-gray-50"><input type="number" className="w-full min-w-[60px] p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-center font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={entry.ca2} onChange={e => handleScoreChange(i, 'ca2', e.target.value)}/></td>
                                            <td className="p-2 border-r border-gray-50"><input type="number" className="w-full min-w-[60px] p-2.5 bg-blue-50/50 border border-blue-200 rounded-lg text-center font-black text-blue-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={entry.exam} onChange={e => handleScoreChange(i, 'exam', e.target.value)}/></td>
                                            <td className="p-4 text-center font-bold text-gray-700 bg-gray-100/60 border-r border-gray-50">{ hasEntry ? entry.term3_total : '-' }</td>
                                          </>
                                        ) : (
                                          <>
                                            <td className="p-2 border-r border-gray-50"><input type="number" className="w-full min-w-[60px] p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-center font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={entry.class_quiz} onChange={e => handleScoreChange(i, 'class_quiz', e.target.value)}/></td>
                                            <td className="p-2 border-r border-gray-50"><input type="number" className="w-full min-w-[60px] p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-center font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={entry.home_quiz} onChange={e => handleScoreChange(i, 'home_quiz', e.target.value)}/></td>
                                            <td className="p-2 border-r border-gray-50"><input type="number" className="w-full min-w-[60px] p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-center font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={entry.ca1} onChange={e => handleScoreChange(i, 'ca1', e.target.value)}/></td>
                                            <td className="p-2 border-r border-gray-50"><input type="number" className="w-full min-w-[60px] p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-center font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={entry.ca2} onChange={e => handleScoreChange(i, 'ca2', e.target.value)}/></td>
                                            <td className="p-2 border-r border-gray-50"><input type="number" className="w-full min-w-[60px] p-2.5 bg-blue-50/50 border border-blue-200 rounded-lg text-center font-black text-blue-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={entry.exam} onChange={e => handleScoreChange(i, 'exam', e.target.value)}/></td>
                                          </>
                                        )}

                                        <td className="p-4 text-center font-black text-indigo-900 bg-indigo-50/30 border-r border-gray-50">{ hasEntry ? entry.total : '-' }</td>
                                        <td className="p-4 text-center font-bold text-gray-600 border-r border-gray-50">{ hasEntry ? (grade || '-') : '-' }</td>
                                        <td className="p-4 text-center text-xs font-bold"> {entry.status === 'draft' && <span className="text-orange-600 bg-orange-100 px-2.5 py-1 rounded-md whitespace-nowrap">Draft Saved</span>} {entry.status === 'pending' && <span className="text-blue-600 bg-blue-100 px-2.5 py-1 rounded-md whitespace-nowrap">Pending Admin</span>} {entry.status === 'approved' && <span className="text-green-700 bg-green-100 px-2.5 py-1 rounded-md flex items-center justify-center gap-1.5 whitespace-nowrap"><CheckCircle size={14}/> Approved</span>} {entry.status === 'new' && <span className="text-gray-400">-</span>} </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 md:p-6 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-gray-200"> 
                            <button onClick={handleClearSheet} className="w-full md:w-auto px-6 py-3.5 text-red-600 font-bold bg-white border border-red-200 rounded-xl hover:bg-red-50 flex items-center justify-center gap-2 transition-all shadow-sm order-2 md:order-1">
                                <RefreshCcw size={18}/> Clear Sheet
                            </button>

                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto order-1 md:order-2">
                                <button onClick={() => processUpload('draft')} disabled={loading} className="w-full sm:w-auto px-6 py-3.5 bg-white text-gray-700 border border-gray-300 font-bold rounded-xl shadow-sm hover:bg-gray-100 flex items-center justify-center gap-2 transition-all"> 
                                    <FileEdit size={18}/> {loading ? 'Saving...' : 'Save as Draft'} 
                                </button> 
                                <button onClick={() => processUpload('pending')} disabled={loading} className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all"> 
                                    <Send size={18}/> {loading ? 'Submitting...' : 'Submit to Admin'} 
                                </button> 
                            </div>
                        </div>
                    </div>
                )}
             </div>
           )}
        </div>
      </main>

      {selectedStudent && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"> 
            <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden my-10 animate-in zoom-in-95 duration-200"> 
                <div className="bg-gray-50 p-6 md:p-8 flex justify-between items-center border-b border-gray-100"> 
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-gray-900">Termly Report</h2>
                        <p className="text-sm font-medium text-gray-500 mt-1">{selectedStudent.full_name}</p>
                    </div> 
                    <button onClick={() => setSelectedStudent(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-colors"><X size={24}/></button> 
                </div> 

                <div className="p-6 md:p-8 space-y-8 h-[60vh] overflow-y-auto"> 
                    <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4">Academic Snapshot</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {studentGrades.map((g, i) => (
                                <div key={i} className="flex justify-between items-center text-sm p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
                                    <span className="font-medium text-gray-700 truncate mr-2">{g.subject}</span>
                                    <span className="font-black text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded">{g.total_score} ({g.grade})</span>
                                </div>
                            ))}
                        </div>
                    </div> 

                    <div>
                        <h3 className="text-gray-900 font-bold text-lg mb-4 flex items-center gap-2">Attendance Record</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div><label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Opened</label><input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-center" value={reportData.attendance.open} onChange={e => setReportData({...reportData, attendance: {...reportData.attendance, open: e.target.value}})}/></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Present</label><input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-center text-green-700" value={reportData.attendance.present} onChange={e => setReportData({...reportData, attendance: {...reportData.attendance, present: e.target.value}})}/></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Absent</label><input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-center text-red-600" value={reportData.attendance.absent} onChange={e => setReportData({...reportData, attendance: {...reportData.attendance, absent: e.target.value}})}/></div>
                        </div>
                    </div> 

                    <hr className="border-gray-100" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-gray-900 font-bold text-lg mb-4">Psychomotor</h3>
                            <div className="space-y-4">
                                {PSYCHOMOTOR_KEYS.map(k => (
                                    <div key={k} className="flex justify-between items-center">
                                        <label className="text-sm font-semibold text-gray-600">{k}</label>
                                        <select className="w-24 p-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-center focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" value={reportData.psychomotor[k]||""} onChange={e => setReportData({...reportData, psychomotor:{...reportData.psychomotor,[k]:e.target.value}})}><option value="">-</option>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n}</option>)}</select>
                                    </div>
                                ))}
                            </div>
                        </div> 
                        <div>
                            <h3 className="text-gray-900 font-bold text-lg mb-4">Affective</h3>
                            <div className="space-y-4">
                                {AFFECTIVE_KEYS.map(k => (
                                    <div key={k} className="flex justify-between items-center">
                                        <label className="text-sm font-semibold text-gray-600">{k}</label>
                                        <select className="w-24 p-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-center focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" value={reportData.affective[k]||""} onChange={e => setReportData({...reportData, affective:{...reportData.affective,[k]:e.target.value}})}><option value="">-</option>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n}</option>)}</select>
                                    </div>
                                ))}
                            </div>
                        </div> 
                    </div>

                    <hr className="border-gray-100" />

                    <div>
                        <h3 className="text-gray-900 font-bold text-lg mb-4">Teacher's Remark</h3>
                        <textarea className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" rows={4} placeholder="E.g. A brilliant performance this term..." value={reportData.remark} onChange={e => setReportData({...reportData, remark: e.target.value})}></textarea>
                    </div> 
                </div> 

                <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100">
                    <button onClick={saveReportDetails} disabled={loading} className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all">{loading ? 'Saving securely...' : 'Save Report Details'}</button>
                </div> 
            </div> 
        </div>
      )}

      {isClearModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 md:p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 border-[6px] border-red-100/50">
                   <AlertTriangle size={36} className="text-red-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900">Clear Sheet?</h3>
                <p className="text-gray-500 font-medium text-sm leading-relaxed">
                  Are you sure you want to wipe all unsaved inputs? This gives you a fresh start.
                </p>
             </div>
             <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button onClick={() => setIsClearModalOpen(false)} className="flex-1 py-3.5 bg-white text-gray-700 font-bold border border-gray-200 rounded-xl hover:bg-gray-100 transition-all shadow-sm">
                  Cancel
                </button>
                <button onClick={confirmClearSheet} className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-md shadow-red-600/20 hover:bg-red-700 transition-all">
                  Yes, Clear It
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;