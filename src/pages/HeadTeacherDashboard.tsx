import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Users, FileCheck, LogOut, 
  Menu, CheckCircle, XCircle, User, BookOpen, Camera,
  GraduationCap, AlertTriangle, Settings, Calendar, Megaphone, Trash2, Plus, UserPlus, TrendingUp, Filter, Search, FileText, RefreshCw, Download
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SEO from "@/components/SEO";
import logo from "/school-logo.png";

type ResultBatch = { id: string; class_level: string; subject: string; teacher_name: string; student_count: number; results: any[]; };

const HeadTeacherDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [headTeacherProfile, setHeadTeacherProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [stats, setStats] = useState({ students: 0, teachers: 0, pendingResults: 0 });
  const [studentList, setStudentList] = useState<any[]>([]);
  const [teacherList, setTeacherList] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState({ session: '', term: '' });
  
  const [resumptionDate, setResumptionDate] = useState("");
  const [newResumptionDate, setNewResumptionDate] = useState("");
  const [updates, setUpdates] = useState<any[]>([]);
  const [newUpdate, setNewUpdate] = useState({ title: "", category: "Event", event_date: "" });

  const [pendingBatches, setPendingBatches] = useState<ResultBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<ResultBatch | null>(null);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);

  const [studentSearch, setStudentSearch] = useState("");
  const [studentClassFilter, setStudentClassFilter] = useState("All");
  const [teacherSearch, setTeacherSearch] = useState("");

  const [staffForm, setStaffForm] = useState({ name: '', role: 'Teacher', email: '', password: '', section: 'Primary', assigned_class: '' });
  const [studentForm, setStudentForm] = useState({ name: '', gender: '', admission_no: '', class: '', dob: '', parent_phone: '', parent_phone_2: '', password: '' });
  const [promoFrom, setPromoFrom] = useState("");
  const [promoTo, setPromoTo] = useState("");

  // Broadsheet States
  const [broadsheetData, setBroadsheetData] = useState<any[]>([]);
  const [broadsheetClass, setBroadsheetClass] = useState("");
  const [broadsheetSubjects, setBroadsheetSubjects] = useState<string[]>([]);
  const [loadingBroadsheet, setLoadingBroadsheet] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('staffId');
    if (!id) navigate('/');
    fetchProfile(id!); fetchStats(); fetchStudents(); fetchTeachers(); fetchPendingResults(); fetchConfig(); fetchUpdates(); fetchSettings();
  }, []);

  const fetchProfile = async (id: string) => { const { data } = await supabase.from('staff').select('*').eq('id', id).single(); if (data) setHeadTeacherProfile(data); };
  
  const fetchSettings = async () => {
    const { data } = await supabase.from('school_settings').select('*').single();
    if (data) setGlobalSettings({ session: data.current_session, term: data.current_term });
  };

  const fetchStats = async () => {
    const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).not('current_class', 'ilike', '%SS%').not('current_class', 'ilike', '%JSS%');
    const { count: tCount } = await supabase.from('staff').select('*', { count: 'exact', head: true }).eq('role', 'Teacher').eq('section', 'Primary');
    const { count: rCount } = await supabase.from('results').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    setStats({ students: sCount || 0, teachers: tCount || 0, pendingResults: rCount || 0 });
  };
  const fetchStudents = async () => { const { data } = await supabase.from('students').select('*').not('current_class', 'ilike', '%SS%').not('current_class', 'ilike', '%JSS%').order('current_class'); setStudentList(data || []); };
  const fetchTeachers = async () => { const { data } = await supabase.from('staff').select('*').eq('role', 'Teacher').eq('section', 'Primary').order('full_name'); setTeacherList(data || []); };
  const fetchPendingResults = async () => {
    const { data } = await supabase.from('results').select('*').eq('status', 'pending').order('class_level');
    if (!data) return;
    const groups: { [key: string]: ResultBatch } = {};
    data.forEach((row) => {
      if (row.class_level.includes('SS') || row.class_level.includes('JSS')) return;
      const key = `${row.class_level}-${row.subject}`;
      if (!groups[key]) groups[key] = { id: key, class_level: row.class_level, subject: row.subject, teacher_name: row.teacher_name || 'Class Teacher', student_count: 0, results: [] };
      groups[key].results.push(row); groups[key].student_count++;
    });
    setPendingBatches(Object.values(groups));
  };

  // Broadsheet Fetcher
  const fetchBroadsheet = async () => {
    if (!broadsheetClass) return toast.error("Please select a class first.");
    setLoadingBroadsheet(true);
    const { data, error } = await supabase.from('results').select('*').eq('class_level', broadsheetClass).eq('status', 'approved');
    
    if (error) {
      toast.error("Failed to load broadsheet.");
    } else if (data) {
      const studentsMap: any = {};
      const subjectsSet = new Set<string>();

      data.forEach(row => {
        subjectsSet.add(row.subject);
        if (!studentsMap[row.student_id]) {
          studentsMap[row.student_id] = { id: row.student_id, name: row.student_name, total: 0, scores: {} };
        }
        studentsMap[row.student_id].scores[row.subject] = row.total_score;
        studentsMap[row.student_id].total += row.total_score;
      });

      setBroadsheetSubjects(Array.from(subjectsSet));
      setBroadsheetData(Object.values(studentsMap).sort((a: any, b: any) => b.total - a.total));
      if(data.length > 0) toast.success("Broadsheet Generated!");
      else toast.info("No approved results found for this class yet.");
    }
    setLoadingBroadsheet(false);
  };

  useEffect(() => {
    if (!staffForm.name) return;
    const parts = staffForm.name.replace(/^(Mr\.|Mrs\.|Miss\.|Mr|Mrs|Miss)\s+/i, "").trim().split(" ");
    if (parts.length >= 2) setStaffForm(prev => ({ ...prev, email: `${parts[0][0].toLowerCase()}${parts[parts.length - 1].toLowerCase()}@citadelschool.edu.ng` }));
  }, [staffForm.name]);

  const generateStaffPin = () => setStaffForm(prev => ({ ...prev, password: Math.floor(1000 + Math.random() * 9000).toString() }));
  const generateStudentPin = () => setStudentForm(prev => ({ ...prev, password: Math.floor(1000 + Math.random() * 9000).toString() }));
  const generateAdmissionNo = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const nextYear = (parseInt(year) + 1).toString();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setStudentForm(prev => ({ ...prev, admission_no: `CKIC/${year}/${nextYear}/${randomNum}` }));
  };

  useEffect(() => {
    if (activeTab === 'reg-staff' && !staffForm.password) generateStaffPin();
    if (activeTab === 'reg-student' && !studentForm.password) generateStudentPin();
  }, [activeTab]);

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const finalClass = staffForm.role === 'Teacher' ? staffForm.assigned_class : null;
      await supabase.from('staff').insert([{ full_name: staffForm.name, role: staffForm.role, email: staffForm.email, password_text: staffForm.password, assigned_class: finalClass, section: 'Primary' }]);
      toast.success(`Staff Created: ${staffForm.name}`); setStaffForm({ name: '', role: 'Teacher', email: '', password: '', section: 'Primary', assigned_class: '' }); generateStaffPin(); fetchStats(); fetchTeachers();
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };
  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await supabase.from('students').insert([{ full_name: studentForm.name, gender: studentForm.gender, admission_number: studentForm.admission_no, current_class: studentForm.class, dob: studentForm.dob, parent_phone: studentForm.parent_phone, parent_phone_2: studentForm.parent_phone_2, password_text: studentForm.password }]);
      toast.success(`Pupil Registered: ${studentForm.admission_no}`); setStudentForm({ name: '', gender: '', admission_no: '', class: '', dob: '', parent_phone: '', parent_phone_2: '', password: '' }); generateStudentPin(); fetchStats(); fetchStudents();
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const handlePromotion = async () => {
    if (!promoFrom || !promoTo) return toast.error("Please select both classes.");
    const studentsInClass = studentList.filter(s => s.current_class === promoFrom);
    if (studentsInClass.length === 0) return toast.error(`No pupils found in ${promoFrom}`);
    if (!confirm(`Are you sure you want to promote ${studentsInClass.length} pupils from ${promoFrom} to ${promoTo}?`)) return;
    setLoading(true);
    try {
      await supabase.from('students').update({ current_class: promoTo }).eq('current_class', promoFrom);
      toast.success(`Successfully promoted pupils to ${promoTo}!`); setPromoFrom(""); setPromoTo(""); fetchStudents();
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const getClassOptions = () => ['Creche', 'KG 1', 'KG 2', 'KG 3', 'Pry 1', 'Pry 2', 'Pry 3', 'Pry 4', 'Pry 5', 'Graduated to JSS1'];

  const filteredStudents = studentList.filter(s => {
    const matchSearch = s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) || (s.admission_number || "").toLowerCase().includes(studentSearch.toLowerCase());
    const matchClass = studentClassFilter === "All" ? true : s.current_class === studentClassFilter;
    return matchSearch && matchClass;
  });

  const filteredTeachers = teacherList.filter(t => t.full_name.toLowerCase().includes(teacherSearch.toLowerCase()) || t.email.toLowerCase().includes(teacherSearch.toLowerCase()));

  const fetchUpdates = async () => { const { data } = await supabase.from('school_updates').select('*').order('event_date', { ascending: true }); if (data) setUpdates(data); };
  const postUpdate = async () => { if (!newUpdate.title || !newUpdate.event_date) return toast.error("Please fill all fields"); setLoading(true); await supabase.from('school_updates').insert([newUpdate]); setLoading(false); toast.success("Update Posted!"); setNewUpdate({ title: "", category: "Event", event_date: "" }); fetchUpdates(); };
  const deleteUpdate = async (id: string) => { await supabase.from('school_updates').delete().eq('id', id); toast.success("Update Removed"); fetchUpdates(); };
  const fetchConfig = async () => { const { data } = await supabase.from('school_config').select('next_term_begins').limit(1).maybeSingle(); if (data) { setResumptionDate(data.next_term_begins); setNewResumptionDate(data.next_term_begins); } };
  const updateResumptionDate = async () => { if (!newResumptionDate) return; setLoading(true); await supabase.from('school_config').upsert({ section_type: 'Secondary', next_term_begins: newResumptionDate }, { onConflict: 'section_type' }); await supabase.from('school_config').upsert({ section_type: 'Primary', next_term_begins: newResumptionDate }, { onConflict: 'section_type' }); setLoading(false); toast.success("Resumption Date Updated!"); setResumptionDate(newResumptionDate); };
  const deleteStudent = async (id: string) => { if (!confirm("Delete this pupil?")) return; await supabase.from('students').delete().eq('id', id); toast.success("Deleted"); fetchStudents(); fetchStats(); };
  const deleteStaff = async (id: string) => { if (!confirm("Delete this teacher?")) return; await supabase.from('staff').delete().eq('id', id); toast.success("Deleted"); fetchTeachers(); fetchStats(); };

  const initiateBatchAction = (action: 'approve' | 'reject') => setConfirmAction(action);
  const executeBatchAction = async () => {
    if (!selectedBatch || !confirmAction) return; setLoading(true);
    try {
      const status = confirmAction === 'approve' ? 'approved' : 'rejected';
      const ids = selectedBatch.results.map(r => r.id);
      await supabase.from('results').update({ status: status }).in('id', ids);
      toast.success(`Batch ${status.toUpperCase()} successfully!`); setConfirmAction(null); setSelectedBatch(null); fetchStats(); fetchPendingResults();
    } catch (e: any) { toast.error("Error updating results"); } finally { setLoading(false); }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return; setUploading(true);
    try {
        const file = event.target.files[0]; const filePath = `headteacher-${Math.random()}.${file.name.split('.').pop()}`;
        await supabase.storage.from('passports').upload(filePath, file);
        const { data: { publicUrl } } = supabase.storage.from('passports').getPublicUrl(filePath);
        await supabase.from('staff').update({ passport_url: publicUrl }).eq('id', headTeacherProfile.id);
        setHeadTeacherProfile({ ...headTeacherProfile, passport_url: publicUrl }); toast.success("Profile Photo Updated");
    } catch (e: any) { toast.error("Upload failed: " + e.message); } finally { setUploading(false); }
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col text-white">
      <div className="p-8 text-center bg-orange-300 border-b border-green-900">
         <div className="relative inline-block group">
            <div className="w-24 h-24 mx-auto rounded-full border-[3px] border-green-500 shadow-xl overflow-hidden bg-green-900">
                {headTeacherProfile?.passport_url ? <img src={headTeacherProfile.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-2xl font-bold text-green-400">H</span>}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all"><Camera size={20} /><input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} /></label>
         </div>
         <h3 className="font-bold text-lg mt-3 truncate">{headTeacherProfile?.full_name || 'Head Teacher'}</h3>
         <span className="text-[10px] bg-orange-400 text-green-200 px-3 py-0.5 rounded-full uppercase tracking-wider">Primary Admin</span>
      </div>
      <nav className="flex-1 px-4 py-6 bg-orange-300 border-b-3 border-green-950 space-y-2 overflow-y-auto custom-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard }, 
          { id: 'approvals', label: 'Approve Results', icon: FileCheck }, 
          { id: 'broadsheet', label: 'Master Broadsheet', icon: FileText }, 
          { id: 'promotions', label: 'Promote Pupils', icon: TrendingUp }, 
          { id: 'reg-student', label: 'Register Pupil', icon: GraduationCap }, 
          { id: 'reg-staff', label: 'Register Teacher', icon: UserPlus }, 
          { id: 'updates', label: 'News & Events', icon: Megaphone }, 
          { id: 'students', label: 'Pupils Database', icon: Users }, 
          { id: 'teachers', label: 'Primary Teachers', icon: BookOpen }, 
          { id: 'settings', label: 'Settings', icon: Settings }, 
          { id: 'profile', label: 'My Profile', icon: User }
        ].map(item => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${activeTab === item.id ? 'bg-[#14532d] text-white shadow-lg translate-x-1' : 'hover:bg-green-900/50 text-green-200'}`}><item.icon size={20} /> {item.label}{item.id === 'approvals' && stats.pendingResults > 0 && <span className="ml-auto bg-yellow-500 text-[#052e16] text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{pendingBatches.length}</span>}</button>
        ))}
      </nav>
      <div className="p-6 bg-orange-300 mt-auto"><button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full py-3 bg-red-600/70 hover:bg-red-600 text-red-200 hover:text-white rounded-xl flex items-center justify-center gap-2 font-bold transition-all"><LogOut size={18} /> Logout</button></div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-orange-200 flex font-sans">
      <SEO title="Head Teacher Portal | Citadel" description="Primary Section Admin" noindex={true} />
      
      {confirmAction && selectedBatch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"><div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95"><div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmAction === 'approve' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{confirmAction === 'approve' ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}</div><h3 className="text-xl font-bold text-center text-gray-900 mb-2">{confirmAction === 'approve' ? 'Approve Results?' : 'Reject Results?'}</h3><p className="text-center text-gray-500 text-sm mb-6">Are you sure you want to <strong>{confirmAction.toUpperCase()}</strong> the {selectedBatch.subject} results for {selectedBatch.class_level}?</p><div className="grid grid-cols-2 gap-3"><button onClick={() => setConfirmAction(null)} className="py-3 px-4 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50">Cancel</button><button onClick={executeBatchAction} disabled={loading} className={`py-3 px-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 ${confirmAction === 'approve' ? 'bg-[#14532d] hover:bg-green-900' : 'bg-red-600 hover:bg-red-700'}`}>{loading ? 'Processing...' : `Yes, ${confirmAction === 'approve' ? 'Approve' : 'Reject'}`}</button></div></div></div>
      )}

      {selectedBatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95"><div className="bg-[#14532d] p-6 text-white flex justify-between items-center shrink-0"><div><h2 className="text-xl font-bold flex items-center gap-2">{selectedBatch.class_level} - {selectedBatch.subject}</h2><p className="text-green-200 text-sm">{selectedBatch.student_count} Pupils Submitted</p></div><button onClick={() => setSelectedBatch(null)} className="text-green-200 hover:text-white"><XCircle size={28}/></button></div><div className="flex-1 overflow-y-auto p-6 bg-green-50/30"><div className="bg-white border border-green-100 rounded-xl shadow-sm overflow-hidden"><table className="w-full text-left text-sm"><thead className="bg-green-50 text-green-800 font-bold border-b border-green-100"><tr><th className="p-4">Pupil Name</th><th className="p-4 text-center">CA (40)</th><th className="p-4 text-center">Exam (60)</th><th className="p-4 text-center">Total</th><th className="p-4 text-center">Grade</th></tr></thead><tbody className="divide-y divide-green-50">{selectedBatch.results.map((res: any) => (<tr key={res.id} className="hover:bg-green-50/50"><td className="p-4 font-medium text-gray-900">{res.student_name}</td><td className="p-4 text-center text-gray-600">{(res.ca1_score||0) + (res.ca2_score||0)}</td><td className="p-4 text-center text-gray-600">{res.exam_score}</td><td className="p-4 text-center font-bold text-green-900">{res.total_score}</td><td className={`p-4 text-center font-bold ${res.total_score < 40 ? 'text-red-500' : 'text-green-600'}`}>{res.grade}</td></tr>))}</tbody></table></div></div><div className="p-6 bg-white border-t flex justify-end gap-4 shrink-0"><button onClick={() => initiateBatchAction('reject')} disabled={loading} className="px-6 py-3 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-colors">Reject Batch</button><button onClick={() => initiateBatchAction('approve')} disabled={loading} className="px-6 py-3 bg-[#14532d] text-white font-bold rounded-xl hover:bg-green-900 shadow-lg transition-all flex items-center gap-2"><CheckCircle size={18}/> Approve Batch</button></div></div></div>
      )}

      <aside className="hidden lg:block w-72 bg-[#052e16] shadow-xl sticky top-0 h-[100dvh] z-30"><SidebarContent /></aside>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}><SheetContent side="left" className="p-0 w-72 bg-[#052e16] border-none"><SidebarContent /></SheetContent></Sheet>

      <main className="flex-1 h-[100dvh] overflow-y-auto">
        <header className="lg:hidden p-4 bg-white border-b flex justify-between items-center sticky top-0 z-20"><button onClick={() => setIsMobileMenuOpen(true)}><Menu className="text-green-900" /></button><span className="font-bold text-green-900 text-lg"> <img src={logo} alt="School Logo" className="w-8 h-8 inline-block mr-2" /> Head Teacher</span></header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="animate-in fade-in space-y-6">
              <h1 className="text-2xl font-bold text-green-900">Dashboard Overview</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100"><h3 className="text-gray-500 font-bold text-sm uppercase">Pupils (Primary)</h3><p className="text-4xl font-bold text-[#14532d] mt-2">{stats.students}</p></div><div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100"><h3 className="text-gray-500 font-bold text-sm uppercase">Teachers (Primary)</h3><p className="text-4xl font-bold text-[#14532d] mt-2">{stats.teachers}</p></div><div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100"><h3 className="text-gray-500 font-bold text-sm uppercase">Pending Approvals</h3><p className="text-4xl font-bold text-yellow-600 mt-2">{stats.pendingResults}</p></div></div>
            </div>
          )}

          {activeTab === 'broadsheet' && (
            <div className="space-y-6 animate-in fade-in">
              <style>{`
                @media print {
                  body * { visibility: hidden; }
                  #broadsheet-print-area, #broadsheet-print-area * { visibility: visible; }
                  #broadsheet-print-area { position: absolute; left: 0; top: 0; width: 100%; }
                  @page { size: landscape; margin: 10mm; }
                  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                  .print-hide { display: none !important; }
                }
              `}</style>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 print-hide">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-gray-800">Master Broadsheet</h1>
                  <p className="text-gray-500 text-sm">Select a class to generate the official result overview.</p>
                </div>
                {broadsheetData.length > 0 && (
                  <button onClick={() => window.print()} className="w-full sm:w-auto px-6 py-3 bg-[#14532d] text-white font-bold rounded-xl hover:bg-green-900 transition-all shadow-md flex items-center justify-center gap-2 shrink-0">
                    <Download size={18} /> Download PDF
                  </button>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-green-100 print-hide">
                 <select value={broadsheetClass} onChange={e => { setBroadsheetClass(e.target.value); setBroadsheetData([]); }} className="w-full sm:flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#14532d] font-bold text-[#14532d]">
                    <option value="">-- Select Class to Generate --</option>
                    {getClassOptions().filter(c=>!c.includes('Graduated')).map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
                 <button onClick={fetchBroadsheet} disabled={loadingBroadsheet} className="w-full sm:w-auto px-8 py-3 bg-green-700 text-white font-bold rounded-xl hover:bg-green-800 transition-all shadow-md flex items-center justify-center gap-2">
                   {loadingBroadsheet ? <RefreshCw className="animate-spin" size={18}/> : <FileText size={18}/>}
                   {loadingBroadsheet ? 'Generating...' : 'Preview Broadsheet'}
                 </button>
              </div>

              {broadsheetData.length > 0 && (
                <div id="broadsheet-print-area" className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-green-100 relative">
                  
                  {/* BEAUTIFUL DOCUMENT HEADER */}
                  <div className="text-center mb-8 border-b-2 border-[#14532d] pb-6">
                     <img src={logo} alt="Logo" className="w-20 h-20 mx-auto mb-3" />
                     <h2 className="text-2xl md:text-3xl font-black uppercase text-[#14532d] tracking-wide">Citadel of Knowledge International School</h2>
                     <p className="text-md font-bold text-gray-500 mt-1 uppercase tracking-widest">Master Broadsheet Report</p>
                     
                     <div className="flex flex-wrap justify-center gap-4 md:gap-12 mt-6 text-sm font-bold text-[#14532d] bg-green-50 py-3 px-6 rounded-xl border border-green-100 w-fit mx-auto">
                        <span>CLASS: <span className="text-gray-700">{broadsheetClass}</span></span>
                        <span>TERM: <span className="text-gray-700">{globalSettings?.term}</span></span>
                        <span>SESSION: <span className="text-gray-700">{globalSettings?.session}</span></span>
                     </div>
                  </div>

                  {/* DOCUMENT TABLE */}
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-left text-sm whitespace-nowrap border-collapse border border-gray-300">
                      <thead className="bg-[#14532d] text-white">
                        <tr>
                          <th className="p-3 border border-gray-300 sticky left-0 bg-[#14532d] z-10">Pupil Name</th>
                          {broadsheetSubjects.map(sub => <th key={sub} className="p-3 border border-gray-300 text-center">{sub.substring(0, 8)}.</th>)}
                          <th className="p-3 font-bold text-yellow-300 border border-gray-300 text-center bg-[#052e16]">Total</th>
                          <th className="p-3 font-bold text-orange-300 border border-gray-300 text-center bg-[#052e16]">Pos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                         {broadsheetData.map((student, index) => (
                           <tr key={student.id} className="hover:bg-green-50 transition-colors">
                             <td className="p-3 font-bold text-gray-900 sticky left-0 bg-white border border-gray-300 drop-shadow-[2px_0_2px_rgba(0,0,0,0.02)]">{student.name}</td>
                             {broadsheetSubjects.map(sub => (
                               <td key={sub} className="p-3 text-gray-600 border border-gray-300 text-center font-medium">{student.scores[sub] || <span className="text-gray-300">-</span>}</td>
                             ))}
                             <td className="p-3 font-bold text-green-900 bg-green-50/50 border border-gray-300 text-center">{student.total}</td>
                             <td className="p-3 font-bold text-orange-700 bg-orange-50/50 border border-gray-300 text-center">
                                {index + 1}<sup className="text-[10px] ml-0.5 text-gray-500">{index + 1 === 1 ? 'st' : index + 1 === 2 ? 'nd' : index + 1 === 3 ? 'rd' : 'th'}</sup>
                             </td>
                           </tr>
                         ))}
                      </tbody>
                    </table>
                  </div>

                  {/* DOCUMENT FOOTER SIGNATURES */}
                  <div className="mt-20 flex justify-between px-4 text-sm font-bold text-gray-800">
                     <div className="text-center">
                       <div className="w-40 md:w-56 border-b-2 border-gray-800 mb-2"></div>
                       <p>Class Teacher's Signature</p>
                     </div>
                     <div className="text-center">
                       <div className="w-40 md:w-56 border-b-2 border-gray-800 mb-2"></div>
                       <p>Head Teacher's Signature</p>
                       <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">{headTeacherProfile?.full_name}</p>
                     </div>
                  </div>

                </div>
              )}
            </div>
          )}
          
          {activeTab === 'promotions' && (
            <div className="space-y-6 animate-in fade-in">
              <h1 className="text-2xl font-bold text-gray-800">Bulk Promote Pupils</h1>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100 max-w-2xl"><div className="flex items-center gap-3 mb-6"><div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#14532d]"><TrendingUp size={24}/></div><div><h3 className="font-bold text-gray-800 text-lg">Class Promotion</h3><p className="text-sm text-gray-500">Move an entire class to the next level.</p></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end"><div className="space-y-2"><label className="text-sm font-bold text-gray-700">From Class</label><select value={promoFrom} onChange={e=>setPromoFrom(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-[#14532d]"><option value="">Select Class</option>{getClassOptions().map(c=><option key={c}>{c}</option>)}</select></div><div className="space-y-2"><label className="text-sm font-bold text-gray-700">To Class</label><select value={promoTo} onChange={e=>setPromoTo(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-[#14532d]"><option value="">Select Destination</option>{getClassOptions().map(c=><option key={c}>{c}</option>)}</select></div></div><button onClick={handlePromotion} disabled={loading} className="w-full mt-8 py-4 bg-[#14532d] text-white font-bold rounded-xl shadow-lg hover:bg-green-900 transition-all">{loading ? 'Promoting...' : 'Promote Pupils'}</button></div>
            </div>
          )}

          {activeTab === 'reg-staff' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-green-100 max-w-2xl animate-in fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Register Primary Teacher</h2>
              <form onSubmit={handleRegisterStaff} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Full Name</label><input required type="text" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-[#14532d] outline-none" placeholder="Mr. Name" /></div>
                  <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-gray-700">Email (Auto)</label><input readOnly value={staffForm.email} className="w-full p-3 bg-gray-100 border rounded-xl text-gray-500 outline-none" /></div>
                  <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-gray-700">Assign Class (Optional)</label><select value={staffForm.assigned_class} onChange={e => setStaffForm({...staffForm, assigned_class: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-[#14532d] outline-none"><option value="">Subject Teacher Only</option>{getClassOptions().map(c=><option key={c}>{c}</option>)}</select></div>
                </div>
                <button disabled={loading} type="submit" className="w-full py-4 bg-[#14532d] text-white font-bold rounded-xl shadow-lg hover:bg-green-900">{loading ? 'Creating...' : 'Register Teacher'}</button>
              </form>
            </div>
          )}

          {activeTab === 'reg-student' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-green-100 max-w-2xl animate-in fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Register Pupil</h2>
              <form onSubmit={handleRegisterStudent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-gray-700">Full Name</label><input required type="text" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-[#14532d] outline-none" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Gender</label><select required value={studentForm.gender} onChange={e => setStudentForm({...studentForm, gender: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-[#14532d] outline-none"><option value="">Select</option><option>Male</option><option>Female</option></select></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-700">DOB</label><input required type="date" value={studentForm.dob} onChange={e => setStudentForm({...studentForm, dob: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-[#14532d] outline-none" /></div>
                  <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-gray-700">Class</label><select required value={studentForm.class} onChange={e => setStudentForm({...studentForm, class: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-[#14532d] outline-none"><option value="">Select</option>{getClassOptions().filter(c=>!c.includes('Graduated')).map(c=><option key={c}>{c}</option>)}</select></div>
                  
                  <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-gray-700">Admission Number</label><div className="flex gap-2"><input required type="text" value={studentForm.admission_no} onChange={e => setStudentForm({...studentForm, admission_no: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-[#14532d] outline-none" placeholder="e.g. CKIS/26/27/001" /><button type="button" onClick={generateAdmissionNo} className="p-3 bg-green-100 text-green-700 font-bold rounded-xl whitespace-nowrap hover:bg-green-200 transition-colors">Auto Gen</button></div></div>
                  
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Parent Phone 1</label><input required type="tel" value={studentForm.parent_phone} onChange={e => setStudentForm({...studentForm, parent_phone: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-[#14532d] outline-none" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Parent Phone 2</label><input type="tel" value={studentForm.parent_phone_2} onChange={e => setStudentForm({...studentForm, parent_phone_2: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-[#14532d] outline-none" /></div>
                </div>
                <button disabled={loading} type="submit" className="w-full py-4 bg-[#14532d] text-white font-bold rounded-xl shadow-lg hover:bg-green-900">{loading ? 'Registering...' : 'Register Pupil'}</button>
              </form>
            </div>
          )}

          {activeTab === 'approvals' && (
             <div className="space-y-6 animate-in fade-in">
               <div className="flex justify-between items-center"><h1 className="text-2xl font-bold text-green-900">Result Approvals</h1><span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">{pendingBatches.length} Batches Pending</span></div>
               {pendingBatches.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{pendingBatches.map(batch => (<div key={batch.id} onClick={() => setSelectedBatch(batch)} className="bg-white border border-green-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-green-300 transition-all cursor-pointer group"><div className="flex justify-between items-start mb-4"><div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-[#14532d] group-hover:text-white transition-colors"><BookOpen size={24} /></div><span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Pending</span></div><h3 className="text-lg font-bold text-gray-800">{batch.subject}</h3><p className="text-sm font-medium text-gray-500 mb-4">{batch.class_level}</p><div className="flex items-center gap-3 text-xs text-gray-400 border-t pt-4"><User size={14} /> <span className="truncate">{batch.teacher_name}</span><span className="ml-auto font-bold text-gray-600">{batch.student_count} Pupils</span></div></div>))}</div>
               ) : (<div className="bg-white p-12 text-center rounded-2xl border border-dashed border-green-200 text-gray-400"><CheckCircle size={48} className="mx-auto mb-3 opacity-20 text-green-500"/><p>No pending results.</p></div>)}
             </div>
          )}

          {activeTab === 'updates' && (
            <div className="space-y-6 animate-in fade-in">
                <h1 className="text-2xl font-bold text-green-900">Manage News & Updates</h1>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex flex-col md:flex-row gap-4 items-end"><div className="w-full"><label className="text-xs font-bold text-gray-400 uppercase">Title</label><input type="text" className="w-full p-3 bg-gray-50 border rounded-xl" value={newUpdate.title} onChange={e => setNewUpdate({...newUpdate, title: e.target.value})} /></div><div className="w-full md:w-48"><label className="text-xs font-bold text-gray-400 uppercase">Category</label><select className="w-full p-3 bg-gray-50 border rounded-xl" value={newUpdate.category} onChange={e => setNewUpdate({...newUpdate, category: e.target.value})}><option>Event</option><option>Holiday</option><option>Admission</option><option>News</option></select></div><div className="w-full md:w-48"><label className="text-xs font-bold text-gray-400 uppercase">Date</label><input type="date" className="w-full p-3 bg-gray-50 border rounded-xl" value={newUpdate.event_date} onChange={e => setNewUpdate({...newUpdate, event_date: e.target.value})} /></div><button onClick={postUpdate} disabled={loading} className="px-6 py-3 bg-[#14532d] text-white font-bold rounded-xl hover:bg-green-900 flex items-center gap-2">{loading ? 'Posting...' : <><Plus size={18}/> Post</>}</button></div>
                <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden"><table className="w-full text-left text-sm"><thead className="bg-[#14532d] text-white"><tr><th className="p-4">Title</th><th className="p-4">Category</th><th className="p-4">Date</th><th className="p-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-green-50">{updates.map(update => (<tr key={update.id} className="hover:bg-green-50/50"><td className="p-4 font-bold">{update.title}</td><td className="p-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">{update.category}</span></td><td className="p-4 text-gray-500">{new Date(update.event_date).toDateString()}</td><td className="p-4 text-right"><button onClick={() => deleteUpdate(update.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18}/></button></td></tr>))}</tbody></table></div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-6 animate-in fade-in">
               <h1 className="text-2xl font-bold text-green-900">Primary Pupils Database</h1>
               
               <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-green-100 mb-6">
                 <div className="flex-1 relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input 
                     type="text" 
                     placeholder="Search by name or admission number..." 
                     value={studentSearch} 
                     onChange={e => setStudentSearch(e.target.value)} 
                     className="w-full pl-10 p-2 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-[#14532d]" 
                   />
                 </div>
                 
                 <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                   <div className="hidden lg:flex items-center gap-2 text-gray-400">
                     <Filter size={18} className="text-[#14532d]" />
                   </div>
                   
                   <select 
                     value={studentClassFilter} 
                     onChange={e => setStudentClassFilter(e.target.value)} 
                     className="w-full sm:w-auto p-2 bg-gray-50 border rounded-xl outline-none font-medium focus:ring-2 focus:ring-[#14532d]"
                   >
                     <option value="All">All Classes</option>
                     {getClassOptions().filter(c=>!c.includes('Graduated')).map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                 </div>
               </div>

               <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-x-auto">
                 <table className="w-full text-left text-sm"><thead className="bg-[#14532d] text-white"><tr><th className="p-4">Pupil</th><th className="p-4">Class</th><th className="p-4">Admission No</th><th className="p-4">Date of Birth</th><th className="p-4">Parent Phone</th><th className="p-4">Action</th></tr></thead>
                   <tbody className="divide-y divide-green-50">
                     {filteredStudents.map(s => (
                       <tr key={s.id} className="hover:bg-green-50/50">
                         <td className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">{s.passport_url ? <img src={s.passport_url} className="w-full h-full object-cover"/> : <span className="font-bold text-gray-400">{s.full_name[0]}</span>}</div><span className="font-bold text-gray-900">{s.full_name}</span></td>
                         <td className="p-4">{s.current_class}</td><td className="p-4 font-mono text-sm">{s.admission_number}</td><td className="p-4">{s.dob || 'N/A'}</td><td className="p-4">{s.parent_phone}</td>
                         <td className="p-4"><button onClick={() => deleteStudent(s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button></td>
                       </tr>
                     ))}
                     {filteredStudents.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No pupils found.</td></tr>}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'teachers' && (
            <div className="space-y-6 animate-in fade-in">
               <h1 className="text-2xl font-bold text-green-900">Primary Teachers Database</h1>
               <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-green-100 mb-6">
                 <div className="flex-1 relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input type="text" placeholder="Search teacher by name or email..." value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)} className="w-full pl-10 p-2 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-[#14532d]" />
                 </div>
               </div>
               <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#14532d] text-white"><tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Assigned Class</th><th className="p-4">Email</th><th className="p-4">Action</th></tr></thead><tbody className="divide-y divide-green-50">{filteredTeachers.map(t => (<tr key={t.id} className="hover:bg-green-50/50 transition-colors"><td className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">{t.passport_url ? <img src={t.passport_url} className="w-full h-full object-cover"/> : <span className="font-bold text-gray-400">{t.full_name[0]}</span>}</div><span className="font-bold text-gray-900">{t.full_name}</span></td><td className="p-4"><span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">{t.assigned_class ? `${t.assigned_class}` : `Subject Teacher`}</span></td><td className="p-4 text-gray-600">{t.email}</td><td className="p-4"><button onClick={() => deleteStaff(t.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button></td></tr>))}{filteredTeachers.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No primary teachers found.</td></tr>}</tbody></table></div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in">
                <h1 className="text-2xl font-bold text-gray-800">School Configuration</h1>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100 max-w-2xl"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-full bg-[#14532d] flex items-center justify-center text-white"><Calendar size={20}/></div><div><h3 className="font-bold text-gray-800">Resumption Date</h3><p className="text-xs text-gray-500">Set the next term begin date for ALL students.</p></div></div><div className="space-y-4"><div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Current Setting</label><div className="text-lg font-bold text-green-900">{resumptionDate || 'Not Set'}</div></div><div className="pt-4 border-t border-gray-100"><label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Update Date</label><div className="flex gap-4"><input type="text" placeholder="e.g. January 12th, 2026" className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" value={newResumptionDate} onChange={(e) => setNewResumptionDate(e.target.value)} /><button onClick={updateResumptionDate} disabled={loading} className="bg-[#14532d] text-white px-6 py-3 rounded-xl font-bold hover:bg-green-900 transition-all disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button></div></div></div></div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white p-8 md:p-12 text-center rounded-3xl shadow-sm border border-green-100 max-w-xl mx-auto animate-in fade-in">
               <div className="w-32 h-32 mx-auto bg-[#14532d] rounded-full flex items-center justify-center mb-6 border-4 border-green-200 overflow-hidden relative group">
                 {headTeacherProfile?.passport_url ? <img src={headTeacherProfile.passport_url} className="w-full h-full object-cover"/> : <span className="text-4xl text-white font-bold">H</span>}
                 <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"><Camera size={32} /><input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} /></label>
               </div>
               <h2 className="text-2xl font-bold text-[#052e16]">{headTeacherProfile?.full_name || 'Head Teacher'}</h2>
               <p className="text-[#14532d] font-bold text-sm uppercase tracking-widest mt-1">Primary Administrator</p>
               <div className="mt-8 text-left space-y-3 bg-green-50 p-6 rounded-xl border border-green-100"><div><p className="text-xs font-bold text-gray-500 uppercase">Email</p><p className="font-medium text-[#052e16]">{headTeacherProfile?.email}</p></div><div><p className="text-xs font-bold text-gray-500 uppercase">Access PIN</p><p className="font-medium font-mono text-[#052e16]">{headTeacherProfile?.password_text}</p></div></div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HeadTeacherDashboard;