import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Users, FileCheck, LogOut, Archive,
  Menu, CheckCircle, XCircle, User, AlertTriangle, 
  Camera, Settings, Calendar, Megaphone, Trash2, Plus,
  GraduationCap, UserPlus, TrendingUp, Filter, Search, FileText, RefreshCw, Download
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SEO from "@/components/SEO";
import logo from "/school-logo.png";

type ResultBatch = { id: string; class_level: string; subject: string; teacher_name: string; student_count: number; results: any[]; };

const CLASS_ARMS: Record<string, string[]> = {
  "KG 1": ["Gold", "Diamond", "Silver"],
  "KG 2": ["Candy", "Chocolate", "Strawberry"],
  "KG 3": ["Rose", "Vanilla", "Sweet"],
  "Pry 1": ["Greatness", "Glorious", "Progress"],
  "Pry 2": ["Mars", "Jupiter", "Venus"],
  "Pry 3": ["Pluto", "Neptune", "Uranus"],
  "Pry 4": ["South America", "North America", "Africa", "Europe"],
  "Pry 5": ["Asia", "Antarctica"]
};

const HeadTeacherDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [headProfile, setHeadProfile] = useState<any>(null);
  
  const [stats, setStats] = useState({ students: 0, teachers: 0, pendingResults: 0 });
  const [studentList, setStudentList] = useState<any[]>([]);
  const [teacherList, setTeacherList] = useState<any[]>([]);
  const [pendingBatches, setPendingBatches] = useState<ResultBatch[]>([]);
  const [approvedBatches, setApprovedBatches] = useState<ResultBatch[]>([]);
  const [globalSettings, setGlobalSettings] = useState({ session: '2025/2026', term: '1st Term' });
  
  const [resumptionDate, setResumptionDate] = useState("");
  const [newResumptionDate, setNewResumptionDate] = useState("");
  const [newGlobalSession, setNewGlobalSession] = useState("");
  const [newGlobalTerm, setNewGlobalTerm] = useState("");

  const [updates, setUpdates] = useState<any[]>([]);
  const [newUpdate, setNewUpdate] = useState({ title: "", category: "Event", event_date: "" });
  
  const [selectedBatch, setSelectedBatch] = useState<ResultBatch | null>(null); 
  const [selectedApprovedBatch, setSelectedApprovedBatch] = useState<ResultBatch | null>(null); 
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null); 
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [studentSearch, setStudentSearch] = useState("");
  const [studentClassFilter, setStudentClassFilter] = useState("All");
  const [teacherSearch, setTeacherSearch] = useState("");

  const [staffForm, setStaffForm] = useState({ name: '', role: 'Teacher', email: '', password: '', section: 'Primary' });
  const [staffBaseClass, setStaffBaseClass] = useState("");
  const [staffArm, setStaffArm] = useState("");

  const [studentForm, setStudentForm] = useState({ name: '', gender: '', admission_no: '', dob: '', parent_phone: '', parent_phone_2: '', password: '' });
  const [studentBaseClass, setStudentBaseClass] = useState("");
  const [studentArm, setStudentArm] = useState("");

  const [promoFromBase, setPromoFromBase] = useState("");
  const [promoFromArm, setPromoFromArm] = useState("");
  const [promoToBase, setPromoToBase] = useState("");
  const [promoToArm, setPromoToArm] = useState("");

  const [broadsheetData, setBroadsheetData] = useState<any[]>([]);
  const [broadsheetBaseClass, setBroadsheetBaseClass] = useState("");
  const [broadsheetArm, setBroadsheetArm] = useState("");
  const [broadsheetSubjects, setBroadsheetSubjects] = useState<string[]>([]);
  const [loadingBroadsheet, setLoadingBroadsheet] = useState(false);
  const [formTeacherName, setFormTeacherName] = useState(""); 

  useEffect(() => {
    const id = localStorage.getItem('staffId');
    if (!id) navigate('/');
    fetchProfile(id!); fetchStats(); fetchStudents(); fetchTeachers(); fetchPendingResults(); fetchApprovedResults(); fetchConfig(); fetchUpdates(); fetchSettings();
  }, []);

  const fetchProfile = async (id: string) => {
    const { data } = await supabase.from('staff').select('*').eq('id', id).single();
    if (data) setHeadProfile(data);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('school_settings').select('*').single();
    if (data) {
        setGlobalSettings({ session: data.current_session, term: data.current_term });
        setNewGlobalSession(data.current_session);
        setNewGlobalTerm(data.current_term);
    }
  };

  const updateGlobalSettings = async () => {
      if (!newGlobalSession || !newGlobalTerm) return toast.error("Please provide both session and term.");
      setLoading(true);
      const { error } = await supabase.from('school_settings').update({ current_session: newGlobalSession, current_term: newGlobalTerm }).eq('id', 1);
      if (error) {
          await supabase.from('school_settings').insert([{ id: 1, current_session: newGlobalSession, current_term: newGlobalTerm }]);
      }
      toast.success("Global Term & Session Updated!");
      setGlobalSettings({ session: newGlobalSession, term: newGlobalTerm });
      setLoading(false);
  };

  const fetchUpdates = async () => {
    const { data } = await supabase.from('school_updates').select('*').order('event_date', { ascending: true });
    if (data) setUpdates(data);
  };
  const postUpdate = async () => {
    if (!newUpdate.title || !newUpdate.event_date) return toast.error("Please fill all fields");
    setLoading(true); await supabase.from('school_updates').insert([newUpdate]); setLoading(false);
    toast.success("Update Posted!"); setNewUpdate({ title: "", category: "Event", event_date: "" }); fetchUpdates();
  };
  const deleteUpdate = async (id: string) => { await supabase.from('school_updates').delete().eq('id', id); toast.success("Update Removed"); fetchUpdates(); };
  
  const fetchConfig = async () => {
    const { data } = await supabase.from('school_config').select('next_term_begins').limit(1).maybeSingle();
    if (data) { setResumptionDate(data.next_term_begins); setNewResumptionDate(data.next_term_begins); }
  };
  const updateResumptionDate = async () => {
    if (!newResumptionDate) return;
    setLoading(true);
    await supabase.from('school_config').upsert({ section_type: 'Primary', next_term_begins: newResumptionDate }, { onConflict: 'section_type' });
    await supabase.from('school_config').upsert({ section_type: 'Secondary', next_term_begins: newResumptionDate }, { onConflict: 'section_type' });
    setLoading(false); toast.success("Resumption Date Updated for ALL Students!"); setResumptionDate(newResumptionDate);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length || !headProfile) return;
    setUploading(true);
    try {
        const file = event.target.files[0];
        const filePath = `staff_${headProfile.id}_${Math.random()}.${file.name.split('.').pop()}`;
        await supabase.storage.from('passports').upload(filePath, file);
        const { data: { publicUrl } } = supabase.storage.from('passports').getPublicUrl(filePath);
        await supabase.from('staff').update({ passport_url: publicUrl }).eq('id', headProfile.id);
        setHeadProfile({ ...headProfile, passport_url: publicUrl }); toast.success("Profile Photo Updated");
    } catch (e: any) { toast.error("Upload failed"); } finally { setUploading(false); }
  };

  const calculateGradeAndRemarks = (totalScore: number, studentClass: string = '') => {
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

  const fetchStats = async () => {
    const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).or('current_class.ilike.%Pry%,current_class.ilike.%KG%'); 
    const { count: tCount } = await supabase.from('staff').select('*', { count: 'exact', head: true }).eq('role', 'Teacher').eq('section', 'Primary');
    const { count: rCount } = await supabase.from('results').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    setStats({ students: sCount || 0, teachers: tCount || 0, pendingResults: rCount || 0 });
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('*').or('current_class.ilike.%Pry%,current_class.ilike.%KG%').order('full_name', { ascending: true });
    setStudentList(data || []);
  };

  const fetchTeachers = async () => {
    const { data } = await supabase.from('staff').select('*').eq('role', 'Teacher').eq('section', 'Primary').order('full_name', { ascending: true });
    setTeacherList(data || []);
  };
  
  const fetchPendingResults = async () => {
    try {
      const { data } = await supabase.from('results').select('*').eq('status', 'pending').order('class_level');
      if (!data) return;
      const groups: { [key: string]: ResultBatch } = {};
      data.forEach((row) => {
        if (!row || !row.class_level || (!row.class_level.includes('Pry') && !row.class_level.includes('KG'))) return; 
        const key = `${row.class_level}-${row.subject}`;
        if (!groups[key]) groups[key] = { id: key, class_level: row.class_level, subject: row.subject || 'Unknown Subject', teacher_name: row.teacher_name || 'Unknown', student_count: 0, results: [] };
        groups[key].results.push(row); groups[key].student_count++;
      });
      setPendingBatches(Object.values(groups));
    } catch (err) { console.error(err); }
  };

  const fetchApprovedResults = async () => {
    try {
      const { data } = await supabase.from('results').select('*').eq('status', 'approved').order('class_level');
      if (!data) return;
      const groups: { [key: string]: ResultBatch } = {};
      data.forEach((row) => {
        if (!row || !row.class_level || (!row.class_level.includes('Pry') && !row.class_level.includes('KG'))) return;
        const key = `${row.class_level}-${row.subject}`;
        if (!groups[key]) groups[key] = { id: key, class_level: row.class_level, subject: row.subject || 'Unknown Subject', teacher_name: row.teacher_name || 'Unknown', student_count: 0, results: [] };
        groups[key].results.push(row); groups[key].student_count++;
      });
      setApprovedBatches(Object.values(groups));
    } catch (err) { console.error(err); }
  };

  const fetchBroadsheet = async () => {
    const targetClass = broadsheetArm ? `${broadsheetBaseClass} ${broadsheetArm}` : broadsheetBaseClass;
    if (!targetClass) return toast.error("Please select a class and arm first.");
    setLoadingBroadsheet(true);

    const { data: formTeacher } = await supabase.from('staff').select('full_name').eq('assigned_class', targetClass).maybeSingle();
    setFormTeacherName(formTeacher?.full_name || 'Class Teacher');

    const { data, error } = await supabase.from('results').select('*').eq('class_level', targetClass).eq('status', 'approved');
    
    if (error) {
      toast.error("Failed to load broadsheet.");
    } else if (data) {
      const studentsMap: any = {};
      const subjectsSet = new Set<string>();

      const validData = data.filter(r => !(r.ca1_score === 0 && r.ca2_score === 0 && r.exam_score === 0 && (r.class_quiz || 0) === 0 && (r.home_quiz || 0) === 0));

      validData.forEach(row => {
        subjectsSet.add(row.subject);
        if (!studentsMap[row.student_id]) {
          studentsMap[row.student_id] = { id: row.student_id, name: row.student_name, total: 0, subjectCount: 0, scores: {} };
        }
        studentsMap[row.student_id].scores[row.subject] = row.total_score;
        studentsMap[row.student_id].total += row.total_score;
        studentsMap[row.student_id].subjectCount += 1; 
      });

      setBroadsheetSubjects(Array.from(subjectsSet));
      
      const processedData = Object.values(studentsMap).map((s: any) => ({
          ...s,
          average: s.subjectCount > 0 ? Number((s.total / s.subjectCount).toFixed(1)) : 0
      })).sort((a: any, b: any) => b.average - a.average);

      setBroadsheetData(processedData);
      if(validData.length > 0) toast.success("Broadsheet Generated!");
      else toast.info("No approved results found for this class yet.");
    }
    setLoadingBroadsheet(false);
  };

  const downloadBroadsheet = () => {
    if (broadsheetData.length === 0) return;
    const targetClass = broadsheetArm ? `${broadsheetBaseClass} ${broadsheetArm}` : broadsheetBaseClass;
    const headers = ['Student Name', ...broadsheetSubjects, 'Total Score', 'Average (%)', 'Position'];
    let csvContent = headers.join(',') + '\n';

    broadsheetData.forEach((student, index) => {
      const row = [
        `"${student.name}"`, 
        ...broadsheetSubjects.map(sub => student.scores[sub] !== undefined ? student.scores[sub] : '-'),
        student.total,
        student.average,
        index + 1
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${targetClass}_Broadsheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started!");
  };

  useEffect(() => {
    if (!staffForm.name) return;
    const parts = staffForm.name.replace(/^(Mr\.|Mrs\.|Miss\.|Mr|Mrs|Miss)\s+/i, "").trim().split(" ");
    if (parts.length >= 2) setStaffForm(prev => ({ ...prev, email: `${parts[0][0].toLowerCase()}${parts[parts.length - 1].toLowerCase()}@citadelschool.edu.ng` }));
  }, [staffForm.name]);

  const generateStaffPin = () => setStaffForm(prev => ({ ...prev, password: Math.floor(1000 + Math.random() * 9000).toString() }));
  const generateStudentPin = () => setStudentForm(prev => ({ ...prev, password: Math.floor(1000 + Math.random() * 9000).toString() }));
  
  // PRIMARY ONLY ADMISSION NUMBER GENERATOR (CIS/YY/XXXX)
  const generateAdmissionNo = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setStudentForm(prev => ({ ...prev, admission_no: `CIS/${year}/${randomNum}` }));
  };

  useEffect(() => {
    if (activeTab === 'reg-staff' && !staffForm.password) generateStaffPin();
    if (activeTab === 'reg-student' && !studentForm.password) generateStudentPin();
  }, [activeTab]);

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const finalClass = staffForm.role === 'Teacher' ? (staffArm ? `${staffBaseClass} ${staffArm}` : staffBaseClass) : null;
      await supabase.from('staff').insert([{ full_name: staffForm.name, role: staffForm.role, email: staffForm.email, password_text: staffForm.password, assigned_class: finalClass, section: 'Primary' }]);
      toast.success(`Staff Created: ${staffForm.name}`); setStaffForm({ name: '', role: 'Teacher', email: '', password: '', section: 'Primary' }); setStaffBaseClass(""); setStaffArm(""); generateStaffPin(); fetchStats(); fetchTeachers();
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const finalClass = studentArm ? `${studentBaseClass} ${studentArm}` : studentBaseClass;
      if (!finalClass) return toast.error("Please select a class");

      await supabase.from('students').insert([{ full_name: studentForm.name, gender: studentForm.gender, admission_number: studentForm.admission_no, current_class: finalClass, dob: studentForm.dob, parent_phone: studentForm.parent_phone, parent_phone_2: studentForm.parent_phone_2, password_text: studentForm.password }]);
      toast.success(`Student Registered: ${studentForm.admission_no}`); setStudentForm({ name: '', gender: '', admission_no: '', dob: '', parent_phone: '', parent_phone_2: '', password: '' }); setStudentBaseClass(""); setStudentArm(""); generateStudentPin(); fetchStats(); fetchStudents();
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const handlePromotion = async () => {
    const fromClass = promoFromArm ? `${promoFromBase} ${promoFromArm}` : promoFromBase;
    const toClass = promoToArm ? `${promoToBase} ${promoToArm}` : promoToBase;
    if (!fromClass || !toClass) return toast.error("Please select source and destination classes.");

    const studentsInClass = studentList.filter(s => s.current_class === fromClass);
    if (studentsInClass.length === 0) return toast.error(`No students found in ${fromClass}`);
    if (!confirm(`Are you sure you want to promote ${studentsInClass.length} students from ${fromClass} to ${toClass}?`)) return;
    
    setLoading(true);
    try {
      await supabase.from('students').update({ current_class: toClass }).eq('current_class', fromClass);
      toast.success(`Successfully promoted students to ${toClass}!`); setPromoFromBase(""); setPromoFromArm(""); setPromoToBase(""); setPromoToArm(""); fetchStudents();
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const filteredStudents = studentList.filter(s => {
    const matchSearch = s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) || (s.admission_number || "").toLowerCase().includes(studentSearch.toLowerCase());
    const matchClass = studentClassFilter === "All" ? true : s.current_class === studentClassFilter;
    return matchSearch && matchClass;
  });

  const filteredTeachers = teacherList.filter(t => t.full_name.toLowerCase().includes(teacherSearch.toLowerCase()) || t.email.toLowerCase().includes(teacherSearch.toLowerCase()));

  const initiateBatchAction = (action: 'approve' | 'reject') => setConfirmAction(action);
  
  const executeBatchAction = async () => {
    if (!selectedBatch || !confirmAction) return; 
    setLoading(true);
    try {
      const status = confirmAction === 'approve' ? 'approved' : 'rejected';
      
      if (status === 'approved') {
        for (const res of selectedBatch.results) {
            const { grade, remark } = calculateGradeAndRemarks(res.total_score, selectedBatch.class_level);
            await supabase.from('results')
              .update({ status: 'approved', grade: grade, remarks: remark })
              .eq('id', res.id);
        }
      } else {
        const ids = selectedBatch.results.map(r => r.id);
        await supabase.from('results').update({ status: status }).in('id', ids);
      }

      toast.success(`Batch ${status.toUpperCase()} successfully!`); 
      setConfirmAction(null); 
      setSelectedBatch(null); 
      fetchStats(); 
      fetchPendingResults(); 
      fetchApprovedResults();
    } catch (e: any) { 
      toast.error("Error updating results"); 
    } finally { 
      setLoading(false); 
    }
  };

  const deleteSingleResult = async (id: string) => {
    if (!confirm("Are you sure you want to delete this specific student's result?")) return;
    setLoading(true);
    await supabase.from('results').delete().eq('id', id);
    toast.success("Result deleted");
    fetchApprovedResults(); fetchStats();
    if (selectedApprovedBatch) {
       setSelectedApprovedBatch({
         ...selectedApprovedBatch,
         results: selectedApprovedBatch.results.filter(r => r.id !== id),
         student_count: selectedApprovedBatch.student_count - 1
       });
    }
    setLoading(false);
  };

  const deleteBatchResults = async (batch: ResultBatch) => {
    if (!confirm(`Are you sure you want to completely delete ALL results for ${batch.class_level} ${batch.subject}? This action cannot be undone.`)) return;
    setLoading(true);
    const ids = batch.results.map(r => r.id);
    await supabase.from('results').delete().in('id', ids);
    toast.success("Batch completely deleted!");
    fetchApprovedResults(); fetchStats();
    setSelectedApprovedBatch(null);
    setLoading(false);
  };

  const deleteStudent = async (id: string) => { if (!confirm("Delete this student?")) return; await supabase.from('students').delete().eq('id', id); toast.success("Deleted"); fetchStudents(); fetchStats(); };
  const deleteStaff = async (id: string) => { if (!confirm("Delete this teacher?")) return; await supabase.from('staff').delete().eq('id', id); toast.success("Deleted"); fetchTeachers(); fetchStats(); };

  const SidebarContent = () => (
    <div className="h-full flex flex-col text-white">
      <div className="p-8 text-center bg-emerald-950 border-b border-emerald-900">
         <div className="w-24 h-24 mx-auto rounded-full border-[3px] border-emerald-500 shadow-xl overflow-hidden bg-emerald-900 relative group">
             {headProfile?.passport_url ? <img src={headProfile.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-2xl font-bold text-emerald-400">HT</span>}
             <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Camera className="text-white" size={24} /><input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} /></label>
         </div>
         <h3 className="font-bold text-lg mt-3 truncate">{headProfile?.full_name || 'Head Teacher'}</h3>
         <span className="text-[10px] bg-emerald-800/50 text-emerald-200 px-3 py-0.5 rounded-full uppercase tracking-wider">Primary Admin</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar bg-emerald-950">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard }, 
          { id: 'approvals', label: 'Pending Results', icon: FileCheck }, 
          { id: 'manage-results', label: 'Approved Results', icon: Archive }, 
          { id: 'broadsheet', label: 'Master Broadsheet', icon: FileText }, 
          { id: 'promotions', label: 'Promote Students', icon: TrendingUp }, 
          { id: 'reg-student', label: 'Register Student', icon: GraduationCap }, 
          { id: 'reg-staff', label: 'Register Teacher', icon: UserPlus }, 
          { id: 'updates', label: 'News & Events', icon: Megaphone }, 
          { id: 'students', label: 'Primary Students', icon: Users }, 
          { id: 'teachers', label: 'Primary Teachers', icon: GraduationCap }, 
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(item => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg translate-x-1' : 'hover:bg-emerald-900 text-emerald-100/70'}`}>
            <item.icon size={20} /> {item.label}
            {item.id === 'approvals' && stats.pendingResults > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{pendingBatches.length}</span>}
          </button>
        ))}
      </nav>
      <div className="p-6 bg-emerald-950 mt-auto"><button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full py-3 bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white rounded-xl flex items-center justify-center gap-2 font-bold transition-all"><LogOut size={18} /> Logout</button></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <SEO title="Head Teacher | Citadel" description="Academic Admin" noindex={true} />
      
      {/* CONFIRM PENDING ACTION MODAL */}
      {confirmAction && selectedBatch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"><div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95"><div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmAction === 'approve' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{confirmAction === 'approve' ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}</div><h3 className="text-xl font-bold text-center text-gray-900 mb-2">{confirmAction === 'approve' ? 'Approve Results?' : 'Reject Results?'}</h3><p className="text-center text-gray-500 text-sm mb-6">Are you sure you want to <strong>{confirmAction.toUpperCase()}</strong> the {selectedBatch.subject} results?</p><div className="grid grid-cols-2 gap-3"><button onClick={() => setConfirmAction(null)} className="py-3 px-4 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50">Cancel</button><button onClick={executeBatchAction} disabled={loading} className={`py-3 px-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 ${confirmAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>{loading ? 'Processing...' : `Yes, ${confirmAction === 'approve' ? 'Approve' : 'Reject'}`}</button></div></div></div>
      )}

      {/* PENDING BATCH DETAIL MODAL */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95"><div className="bg-emerald-800 p-6 text-white flex justify-between items-center shrink-0"><div><h2 className="text-xl font-bold flex items-center gap-2">{selectedBatch.class_level} - {selectedBatch.subject}</h2><p className="text-emerald-200 text-sm">{selectedBatch.student_count} Students Submitted</p></div><button onClick={() => setSelectedBatch(null)} className="text-emerald-200 hover:text-white"><XCircle size={28}/></button></div><div className="flex-1 overflow-y-auto p-6 bg-gray-50"><div className="bg-white border rounded-xl shadow-sm overflow-x-auto"><table className="w-full text-left text-sm whitespace-nowrap"><thead className="bg-gray-100 text-gray-700 font-bold border-b"><tr><th className="p-4">Student Name</th><th className="p-4 text-center">CQ</th><th className="p-4 text-center">HQ</th><th className="p-4 text-center">1st CA</th><th className="p-4 text-center">2nd CA</th><th className="p-4 text-center">Exam</th><th className="p-4 text-center">Total</th><th className="p-4 text-center">Grade</th></tr></thead><tbody className="divide-y">{selectedBatch.results.map((res: any) => (<tr key={res.id} className="hover:bg-emerald-50/50"><td className="p-4 font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-emerald-50/50">{res.student_name}</td><td className="p-4 text-center text-gray-600">{res.class_quiz || '-'}</td><td className="p-4 text-center text-gray-600">{res.home_quiz || '-'}</td><td className="p-4 text-center text-gray-600">{res.ca1_score || '-'}</td><td className="p-4 text-center text-gray-600">{res.ca2_score || '-'}</td><td className="p-4 text-center text-gray-600">{res.exam_score}</td><td className="p-4 text-center font-bold text-emerald-900">{res.total_score}</td><td className={`p-4 text-center font-bold ${res.total_score >= 50 ? 'text-green-600' : 'text-red-500'}`}>{calculateGradeAndRemarks(res.total_score, selectedBatch.class_level).grade}</td></tr>))}</tbody></table></div><div className="mt-8 flex justify-end"><div className="text-right border-t-2 border-gray-300 pt-2 px-4"><p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Uploaded By</p><p className="text-lg font-serif font-bold text-emerald-800">{selectedBatch.teacher_name}</p><p className="text-xs text-gray-400 italic">Subject Teacher</p></div></div></div><div className="p-6 bg-white border-t flex justify-end gap-4 shrink-0"><button onClick={() => initiateBatchAction('reject')} disabled={loading} className="px-6 py-3 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-colors">Reject Batch</button><button onClick={() => initiateBatchAction('approve')} disabled={loading} className="px-6 py-3 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 shadow-lg transition-all flex items-center gap-2"><CheckCircle size={18}/> Approve Batch</button></div></div></div>
      )}

      {/* APPROVED BATCH DETAIL MODAL */}
      {selectedApprovedBatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95"><div className="bg-emerald-600 p-6 text-white flex justify-between items-center shrink-0"><div><h2 className="text-xl font-bold flex items-center gap-2">{selectedApprovedBatch.class_level} - {selectedApprovedBatch.subject} <span className="bg-white text-emerald-700 text-xs px-2 py-0.5 rounded-full font-black">APPROVED</span></h2><p className="text-emerald-100 text-sm">{selectedApprovedBatch.student_count} Results Managed</p></div><button onClick={() => setSelectedApprovedBatch(null)} className="text-emerald-100 hover:text-white"><XCircle size={28}/></button></div><div className="flex-1 overflow-y-auto p-6 bg-gray-50"><div className="bg-white border rounded-xl shadow-sm overflow-x-auto"><table className="w-full text-left text-sm whitespace-nowrap"><thead className="bg-gray-100 text-gray-700 font-bold border-b"><tr><th className="p-4">Student Name</th><th className="p-4 text-center">CQ</th><th className="p-4 text-center">HQ</th><th className="p-4 text-center">1st CA</th><th className="p-4 text-center">2nd CA</th><th className="p-4 text-center">Exam</th><th className="p-4 text-center">Total</th><th className="p-4 text-center">Grade</th><th className="p-4 text-center">Action</th></tr></thead><tbody className="divide-y">{selectedApprovedBatch.results.map((res: any) => (<tr key={res.id} className="hover:bg-gray-50"><td className="p-4 font-medium text-gray-900 sticky left-0 bg-white">{res.student_name}</td><td className="p-4 text-center text-gray-600">{res.class_quiz || '-'}</td><td className="p-4 text-center text-gray-600">{res.home_quiz || '-'}</td><td className="p-4 text-center text-gray-600">{res.ca1_score || '-'}</td><td className="p-4 text-center text-gray-600">{res.ca2_score || '-'}</td><td className="p-4 text-center text-gray-600">{res.exam_score}</td><td className="p-4 text-center font-bold text-emerald-700">{res.total_score}</td><td className={`p-4 text-center font-bold ${res.total_score >= 50 ? 'text-green-600' : 'text-red-500'}`}>{calculateGradeAndRemarks(res.total_score, selectedApprovedBatch.class_level).grade}</td><td className="p-4 text-center"><button onClick={() => deleteSingleResult(res.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button></td></tr>))}</tbody></table></div></div><div className="p-6 bg-red-50 border-t border-red-100 flex justify-between items-center shrink-0"><p className="text-xs text-red-400 max-w-sm">Warning: Deleting the batch removes all results permanently.</p><button onClick={() => deleteBatchResults(selectedApprovedBatch)} disabled={loading} className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow flex items-center gap-2"><Trash2 size={18}/> Delete Entire Batch</button></div></div></div>
      )}

      <aside className="hidden lg:block w-72 bg-[#0f172a] shadow-xl sticky top-0 h-screen z-30"><SidebarContent /></aside>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}><SheetContent side="left" className="p-0 w-72 bg-[#0f172a] border-none"><SidebarContent /></SheetContent></Sheet>

      <main className="flex-1 h-screen overflow-y-auto">
        <header className="lg:hidden p-4 bg-white border-b flex justify-between items-center sticky top-0 z-20"><button onClick={() => setIsMobileMenuOpen(true)}><Menu className="text-emerald-900" /></button><span className="font-bold text-emerald-900 text-lg"> <img src={logo} alt="School Logo" className="w-8 h-8 inline-block mr-2" /> Head Teacher Portal</span></header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="animate-in fade-in space-y-6">
              <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100"><h3 className="text-gray-500 font-bold text-sm uppercase">Students (Primary/KG)</h3><p className="text-4xl font-bold text-emerald-900 mt-2">{stats.students}</p></div><div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100"><h3 className="text-gray-500 font-bold text-sm uppercase">Teachers (Primary)</h3><p className="text-4xl font-bold text-emerald-900 mt-2">{stats.teachers}</p></div><div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100"><h3 className="text-gray-500 font-bold text-sm uppercase">Pending Approvals</h3><p className="text-4xl font-bold text-orange-500 mt-2">{stats.pendingResults}</p></div></div>
            </div>
          )}

          {activeTab === 'approvals' && ( <div className="space-y-6 animate-in fade-in"> <div className="flex justify-between items-center"> <h1 className="text-2xl font-bold text-gray-800">Result Approvals</h1> <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">{pendingBatches.length} Batches Pending</span> </div> {pendingBatches.length > 0 ? ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {pendingBatches.map(batch => ( <div key={batch.id} onClick={() => setSelectedBatch(batch)} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"> <div className="flex justify-between items-start mb-4"> <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><FileCheck size={24} /></div> <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">Pending</span> </div> <h3 className="text-lg font-bold text-gray-800">{batch.subject}</h3> <p className="text-sm font-medium text-gray-500 mb-4">{batch.class_level}</p> <div className="flex items-center gap-3 text-xs text-gray-400 border-t pt-4"> <User size={14} /> <span className="truncate">{batch.teacher_name}</span> <span className="ml-auto font-bold text-gray-600">{batch.student_count} Students</span> </div> </div> ))} </div> ) : ( <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300 text-gray-400"> <CheckCircle size={48} className="mx-auto mb-3 opacity-20 text-emerald-500"/> <p>No pending results.</p> </div> )} </div> )}
          {activeTab === 'manage-results' && ( <div className="space-y-6 animate-in fade-in"> <div className="flex justify-between items-center"> <div> <h1 className="text-2xl font-bold text-gray-800">Manage Approved Results</h1> <p className="text-gray-500 text-sm mt-1">View or delete results that have already been approved.</p> </div> <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">{approvedBatches.length} Batches</span> </div> {approvedBatches.length > 0 ? ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {approvedBatches.map(batch => ( <div key={batch.id} onClick={() => setSelectedApprovedBatch(batch)} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"> <div className="flex justify-between items-start mb-4"> <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><FileCheck size={24} /></div> <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Approved</span> </div> <h3 className="text-lg font-bold text-gray-800">{batch.subject}</h3> <p className="text-sm font-medium text-gray-500 mb-4">{batch.class_level}</p> <div className="flex items-center gap-3 text-xs text-gray-400 border-t pt-4"> <User size={14} /> <span className="truncate">{batch.teacher_name}</span> <span className="ml-auto font-bold text-gray-600">{batch.student_count} Students</span> </div> </div> ))} </div> ) : ( <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300 text-gray-400"> <Archive size={48} className="mx-auto mb-3 opacity-20 text-gray-400"/> <p>No approved results to manage.</p> </div> )} </div> )}

          {activeTab === 'broadsheet' && (
            <div className="space-y-6 animate-in fade-in">
              <style>{`@media print { body * { visibility: hidden; } #broadsheet-print-area, #broadsheet-print-area * { visibility: visible; } #broadsheet-print-area { position: absolute; left: 0; top: 0; width: 100%; } @page { size: landscape; margin: 10mm; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .print-hide { display: none !important; } }`}</style>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 print-hide"> <div className="space-y-1"> <h1 className="text-2xl font-bold text-gray-800">Master Broadsheet</h1> <p className="text-gray-500 text-sm">Select a class to generate the official result overview.</p> </div> {broadsheetData.length > 0 && ( <button onClick={() => window.print()} className="w-full sm:w-auto px-6 py-3 bg-emerald-800 text-white font-bold rounded-xl hover:bg-emerald-900 transition-all shadow-md flex items-center justify-center gap-2 shrink-0"> <Download size={18} /> Download PDF </button> )} </div>
              <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 print-hide items-end"> <div className="w-full"> <label className="text-xs font-bold text-gray-400 uppercase">1. Select Class</label> <select value={broadsheetBaseClass} onChange={e => { setBroadsheetBaseClass(e.target.value); setBroadsheetArm(""); setBroadsheetData([]); }} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 font-bold text-emerald-900"> <option value="">-- Select Class --</option> {Object.keys(CLASS_ARMS).map(c => <option key={c} value={c}>{c}</option>)} </select> </div> {CLASS_ARMS[broadsheetBaseClass]?.length > 0 && ( <div className="w-full"> <label className="text-xs font-bold text-emerald-600 uppercase">2. Select Arm</label> <select value={broadsheetArm} onChange={e => { setBroadsheetArm(e.target.value); setBroadsheetData([]); }} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 font-bold text-emerald-900"> <option value="">-- Select Arm --</option> {CLASS_ARMS[broadsheetBaseClass].map(a => <option key={a} value={a}>{a}</option>)} </select> </div> )} <button onClick={fetchBroadsheet} disabled={loadingBroadsheet || !broadsheetBaseClass} className="w-full sm:w-auto px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"> {loadingBroadsheet ? <RefreshCw className="animate-spin" size={18}/> : <FileText size={18}/>} Preview </button> </div>

              {broadsheetData.length > 0 && (
                <div id="broadsheet-print-area" className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-emerald-100 relative">
                  <div className="text-center mb-8 border-b-2 border-emerald-800 pb-6"> <img src={logo} alt="Logo" className="w-20 h-20 mx-auto mb-3" /> <h2 className="text-2xl md:text-3xl font-black uppercase text-emerald-800 tracking-wide">Citadel of Knowledge International School</h2> <p className="text-md font-bold text-gray-500 mt-1 uppercase tracking-widest">Master Broadsheet Report</p> <div className="flex flex-wrap justify-center gap-4 md:gap-12 mt-6 text-sm font-bold text-emerald-800 bg-emerald-50 py-3 px-6 rounded-xl border border-emerald-100 w-fit mx-auto"> <span>CLASS: <span className="text-gray-700">{broadsheetArm ? `${broadsheetBaseClass} ${broadsheetArm}` : broadsheetBaseClass}</span></span> <span>TERM: <span className="text-gray-700">{globalSettings?.term}</span></span> <span>SESSION: <span className="text-gray-700">{globalSettings?.session}</span></span> </div> </div>
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-left text-sm whitespace-nowrap border-collapse border border-gray-300">
                      <thead className="bg-emerald-800 text-white"> <tr> <th className="p-3 border border-gray-300 sticky left-0 bg-emerald-800 z-10">Student Name</th> {broadsheetSubjects.map(sub => <th key={sub} className="p-3 border border-gray-300 text-center">{sub.substring(0, 8)}.</th>)} <th className="p-3 font-bold text-yellow-300 border border-gray-300 text-center bg-emerald-900">Total</th> <th className="p-3 font-bold text-emerald-300 border border-gray-300 text-center bg-emerald-900">Avg (%)</th> <th className="p-3 font-bold text-orange-300 border border-gray-300 text-center bg-emerald-900">Pos</th> </tr> </thead>
                      <tbody className="divide-y divide-gray-200">
                         {broadsheetData.map((student, index) => (
                           <tr key={student.id} className="hover:bg-emerald-50 transition-colors">
                             <td className="p-3 font-bold text-gray-900 sticky left-0 bg-white border border-gray-300 drop-shadow-[2px_0_2px_rgba(0,0,0,0.02)]">{student.name}</td>
                             {broadsheetSubjects.map(sub => ( <td key={sub} className="p-3 text-gray-600 border border-gray-300 text-center font-medium">{student.scores[sub] !== undefined ? student.scores[sub] : <span className="text-gray-300">-</span>}</td> ))}
                             <td className="p-3 font-bold text-emerald-900 bg-emerald-50/50 border border-gray-300 text-center">{student.total}</td>
                             <td className="p-3 font-bold text-emerald-700 bg-emerald-100/50 border border-gray-300 text-center">{student.average}%</td>
                             <td className="p-3 font-bold text-orange-700 bg-orange-50/50 border border-gray-300 text-center"> {index + 1}<sup className="text-[10px] ml-0.5 text-gray-500">{index + 1 === 1 ? 'st' : index + 1 === 2 ? 'nd' : index + 1 === 3 ? 'rd' : 'th'}</sup> </td>
                           </tr>
                         ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-20 flex justify-between px-4 text-sm font-bold text-gray-800"> <div className="text-center"> <div className="w-40 md:w-56 border-b-2 border-gray-800 mb-2"></div> <p>Class Teacher's Signature</p> <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">{formTeacherName}</p> </div> <div className="text-center"> <div className="w-40 md:w-56 border-b-2 border-gray-800 mb-2"></div> <p>Head Teacher's Signature</p> <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">{headProfile?.full_name}</p> </div> </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'promotions' && ( <div className="space-y-6 animate-in fade-in"> <h1 className="text-2xl font-bold text-gray-800">Bulk Promote Students</h1> <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 max-w-4xl"> <div className="flex items-center gap-3 mb-6"><div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><TrendingUp size={24}/></div><div><h3 className="font-bold text-gray-800 text-lg">Class Promotion</h3><p className="text-sm text-gray-500">Move an entire class to the next level.</p></div></div> <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end"> <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"> <label className="text-sm font-bold text-gray-700 block mb-2">From Class</label> <select value={promoFromBase} onChange={e=>{setPromoFromBase(e.target.value); setPromoFromArm("");}} className="w-full p-3 bg-white border rounded-xl outline-none focus:border-emerald-500 mb-3"><option value="">Select Base Class</option>{Object.keys(CLASS_ARMS).map(c=><option key={c}>{c}</option>)}</select> {CLASS_ARMS[promoFromBase]?.length > 0 && <select value={promoFromArm} onChange={e=>setPromoFromArm(e.target.value)} className="w-full p-3 bg-white border rounded-xl outline-none focus:border-emerald-500"><option value="">Select Arm</option>{CLASS_ARMS[promoFromBase].map(a=><option key={a}>{a}</option>)}</select>} </div> <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200"> <label className="text-sm font-bold text-gray-700 block mb-2">To Class</label> <select value={promoToBase} onChange={e=>{setPromoToBase(e.target.value); setPromoToArm("");}} className="w-full p-3 bg-white border rounded-xl outline-none focus:border-emerald-500 mb-3"><option value="">Select Destination</option>{Object.keys(CLASS_ARMS).map(c=><option key={c}>{c}</option>)}</select> {CLASS_ARMS[promoToBase]?.length > 0 && <select value={promoToArm} onChange={e=>setPromoToArm(e.target.value)} className="w-full p-3 bg-white border rounded-xl outline-none focus:border-emerald-500"><option value="">Select Arm</option>{CLASS_ARMS[promoToBase].map(a=><option key={a}>{a}</option>)}</select>} </div> </div> <button onClick={handlePromotion} disabled={loading} className="w-full mt-8 py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all">{loading ? 'Promoting...' : 'Promote Students'}</button> </div> </div> )}
          
          {activeTab === 'reg-staff' && ( <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-emerald-100 max-w-2xl animate-in fade-in"> <h2 className="text-2xl font-bold text-gray-800 mb-6">Register Primary Teacher</h2> <form onSubmit={handleRegisterStaff} className="space-y-6"> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Full Name</label><input required type="text" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-emerald-500 outline-none" placeholder="Mr. Name" /></div> <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-gray-700">Email (Auto)</label><input readOnly value={staffForm.email} className="w-full p-3 bg-gray-100 border rounded-xl text-gray-500 outline-none" /></div> <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Assign Class (Optional)</label><select value={staffBaseClass} onChange={e => { setStaffBaseClass(e.target.value); setStaffArm(""); }} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-emerald-500 outline-none"><option value="">Subject Teacher Only</option>{Object.keys(CLASS_ARMS).map(c=><option key={c}>{c}</option>)}</select></div> {CLASS_ARMS[staffBaseClass]?.length > 0 ? ( <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Assign Arm</label><select value={staffArm} onChange={e => setStaffArm(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-emerald-500 outline-none"><option value="">Select Arm</option>{CLASS_ARMS[staffBaseClass].map(a=><option key={a}>{a}</option>)}</select></div> ) : <div></div>} </div> <button disabled={loading} type="submit" className="w-full py-4 bg-emerald-800 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-900">{loading ? 'Creating...' : 'Register Teacher'}</button> </form> </div> )}
          
          {activeTab === 'reg-student' && ( <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-emerald-100 max-w-2xl animate-in fade-in"> <h2 className="text-2xl font-bold text-gray-800 mb-6">Register Primary Student</h2> <form onSubmit={handleRegisterStudent} className="space-y-6"> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-gray-700">Full Name</label><input required type="text" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-emerald-500 outline-none" /></div> <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Gender</label><select required value={studentForm.gender} onChange={e => setStudentForm({...studentForm, gender: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-emerald-500 outline-none"><option value="">Select</option><option>Male</option><option>Female</option></select></div> <div className="space-y-2"><label className="text-sm font-bold text-gray-700">DOB</label><input required type="date" value={studentForm.dob} onChange={e => setStudentForm({...studentForm, dob: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-emerald-500 outline-none" /></div> <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Class</label><select required value={studentBaseClass} onChange={e => { setStudentBaseClass(e.target.value); setStudentArm(""); }} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-emerald-500 outline-none"><option value="">Select</option>{Object.keys(CLASS_ARMS).map(c=><option key={c}>{c}</option>)}</select></div> {CLASS_ARMS[studentBaseClass]?.length > 0 ? ( <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Arm</label><select required value={studentArm} onChange={e => setStudentArm(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-emerald-500 outline-none"><option value="">Select Arm</option>{CLASS_ARMS[studentBaseClass].map(a=><option key={a}>{a}</option>)}</select></div> ) : <div></div>} <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-gray-700">Admission Number</label><div className="flex gap-2"><input required type="text" value={studentForm.admission_no} onChange={e => setStudentForm({...studentForm, admission_no: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none" placeholder="e.g. CIS/24/1707" /><button type="button" onClick={generateAdmissionNo} className="p-3 bg-emerald-100 text-emerald-700 font-bold rounded-xl whitespace-nowrap hover:bg-emerald-200 transition-colors">Auto Gen</button></div></div> <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Parent Phone 1</label><input required type="tel" value={studentForm.parent_phone} onChange={e => setStudentForm({...studentForm, parent_phone: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-emerald-500 outline-none" /></div> <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Parent Phone 2</label><input type="tel" value={studentForm.parent_phone_2} onChange={e => setStudentForm({...studentForm, parent_phone_2: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:border-emerald-500 outline-none" /></div> </div> <button disabled={loading} type="submit" className="w-full py-4 bg-emerald-800 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-900">{loading ? 'Registering...' : 'Register Student'}</button> </form> </div> )}
          
          {activeTab === 'updates' && ( <div className="space-y-6 animate-in fade-in"> <h1 className="text-2xl font-bold text-gray-800">Manage News & Updates</h1> <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col md:flex-row gap-4 items-end"><div className="w-full"><label className="text-xs font-bold text-gray-400 uppercase">Title</label><input type="text" className="w-full p-3 bg-gray-50 border rounded-xl" placeholder="e.g. Inter-House Sports" value={newUpdate.title} onChange={e => setNewUpdate({...newUpdate, title: e.target.value})} /></div><div className="w-full md:w-48"><label className="text-xs font-bold text-gray-400 uppercase">Category</label><select className="w-full p-3 bg-gray-50 border rounded-xl" value={newUpdate.category} onChange={e => setNewUpdate({...newUpdate, category: e.target.value})}><option>Event</option><option>Holiday</option><option>Admission</option><option>News</option></select></div><div className="w-full md:w-48"><label className="text-xs font-bold text-gray-400 uppercase">Date</label><input type="date" className="w-full p-3 bg-gray-50 border rounded-xl" value={newUpdate.event_date} onChange={e => setNewUpdate({...newUpdate, event_date: e.target.value})} /></div><button onClick={postUpdate} disabled={loading} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex items-center gap-2">{loading ? 'Posting...' : <><Plus size={18}/> Post</>}</button></div> <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden"><table className="w-full text-left text-sm"><thead className="bg-emerald-50 text-emerald-900 border-b border-emerald-100"><tr><th className="p-4">Title</th><th className="p-4">Category</th><th className="p-4">Date</th><th className="p-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-emerald-50">{updates.map(update => (<tr key={update.id} className="hover:bg-emerald-50/50"><td className="p-4 font-bold">{update.title}</td><td className="p-4"><span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold">{update.category}</span></td><td className="p-4 text-gray-500">{new Date(update.event_date).toDateString()}</td><td className="p-4 text-right"><button onClick={() => deleteUpdate(update.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18}/></button></td></tr>))}{updates.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">No updates posted yet.</td></tr>}</tbody></table></div> </div> )}
          
          {activeTab === 'students' && ( <div className="space-y-6 animate-in fade-in"> <h1 className="text-2xl font-bold text-gray-800">Primary/KG Students Database</h1> <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 mb-6"> <div className="flex-1 relative"> <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /> <input type="text" placeholder="Search by student name or admission number..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="w-full pl-12 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-700 focus:ring-2 focus:ring-emerald-600 transition-all" /> </div> </div> <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-x-auto"> <table className="w-full text-left text-sm"><thead className="bg-emerald-800 text-white"><tr><th className="p-4">Student</th><th className="p-4">Class</th><th className="p-4">Admission No</th><th className="p-4">Date of Birth</th><th className="p-4">Parent Phone</th><th className="p-4">Action</th></tr></thead> <tbody className="divide-y divide-emerald-50"> {filteredStudents.map(s => ( <tr key={s.id} className="hover:bg-emerald-50/50"> <td className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-emerald-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">{s.passport_url ? <img src={s.passport_url} className="w-full h-full object-cover"/> : <span className="font-bold text-emerald-700">{s.full_name[0]}</span>}</div><span className="font-bold text-gray-900">{s.full_name}</span></td> <td className="p-4">{s.current_class}</td><td className="p-4 font-mono text-sm">{s.admission_number}</td><td className="p-4">{s.dob || 'N/A'}</td><td className="p-4">{s.parent_phone}</td> <td className="p-4"><button onClick={() => deleteStudent(s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button></td> </tr> ))} {filteredStudents.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No students found.</td></tr>} </tbody> </table> </div> </div> )}
          
          {activeTab === 'teachers' && ( <div className="space-y-6 animate-in fade-in"> <h1 className="text-2xl font-bold text-gray-800">Primary Teachers Database</h1> <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 mb-6"> <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Search teacher by name or email..." value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)} className="w-full pl-10 p-2 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-600" /></div> </div> <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-x-auto"><table className="w-full text-left text-sm "><thead className="bg-emerald-800 text-white"><tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Assigned Class</th><th className="p-4">Email</th><th className="p-4">Action</th></tr></thead><tbody className="divide-y divide-emerald-50">{filteredTeachers.map(t => (<tr key={t.id} className="hover:bg-emerald-50/50 transition-colors"><td className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-emerald-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">{t.passport_url ? <img src={t.passport_url} className="w-full h-full object-cover"/> : <span className="font-bold text-emerald-700">{t.full_name[0]}</span>}</div><span className="font-bold text-gray-900">{t.full_name}</span></td><td className="p-4"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{t.role}</span></td><td className="p-4"><span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">{t.assigned_class ? `${t.assigned_class}` : `Subject Teacher`}</span></td><td className="p-4 text-gray-600">{t.email}</td><td className="p-4"><button onClick={() => deleteStaff(t.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button></td></tr>))}{filteredTeachers.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No primary teachers found.</td></tr>}</tbody></table></div> </div> )}
          
          {activeTab === 'settings' && ( <div className="space-y-6 animate-in fade-in"> <h1 className="text-2xl font-bold text-gray-800">School Configuration</h1> <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 max-w-2xl"> <div className="mb-10 pb-10 border-b border-gray-100"> <div className="flex items-center gap-3 mb-6"> <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><FileText size={20}/></div> <div><h3 className="font-bold text-gray-800">Current Academic Term</h3><p className="text-xs text-gray-500">This dictates where new results are uploaded to.</p></div> </div> <div className="grid grid-cols-2 gap-4 mb-4"> <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Active Session</label><div className="text-lg font-bold text-emerald-900">{globalSettings.session || 'Not Set'}</div></div> <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Active Term</label><div className="text-lg font-bold text-emerald-900">{globalSettings.term || 'Not Set'}</div></div> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200"> <div> <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Update Session</label> <input type="text" value={newGlobalSession} onChange={(e) => setNewGlobalSession(e.target.value)} placeholder="e.g. 2025/2026" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" /> </div> <div> <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Update Term</label> <select value={newGlobalTerm} onChange={(e) => setNewGlobalTerm(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"> <option>1st Term</option><option>2nd Term</option><option>3rd Term</option> </select> </div> <button onClick={updateGlobalSettings} disabled={loading} className="md:col-span-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"> {loading ? 'Saving...' : 'Update Term & Session'} </button> </div> </div> <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><Calendar size={20}/></div><div><h3 className="font-bold text-gray-800">Resumption Date</h3><p className="text-xs text-gray-500">Appears on Student Report Cards.</p></div></div> <div className="space-y-4"><div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Current Setting</label><div className="text-lg font-bold text-emerald-900">{resumptionDate || 'Not Set'}</div></div><div className="pt-4 border-t border-gray-100"><label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Update Date</label><div className="flex gap-4"><input type="text" placeholder="e.g. January 12th, 2026" className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={newResumptionDate} onChange={(e) => setNewResumptionDate(e.target.value)} /><button onClick={updateResumptionDate} disabled={loading} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button></div></div></div> </div> </div> )}

        </div>
      </main>
    </div>
  );
};

export default HeadTeacherDashboard;