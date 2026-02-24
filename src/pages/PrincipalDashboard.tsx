import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Users, FileCheck, LogOut, 
  Menu, CheckCircle, XCircle, User, AlertTriangle, 
  Camera, Settings, Calendar, Megaphone, Trash2, Plus,
  GraduationCap
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SEO from "@/components/SEO";
import logo from "/school-logo.png";

// Types
type ResultBatch = {
  id: string; class_level: string; subject: string;
  teacher_name: string; student_count: number; results: any[];
};

const PrincipalDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [principalProfile, setPrincipalProfile] = useState<any>(null);
  
  // Data States
  const [stats, setStats] = useState({ students: 0, teachers: 0, pendingResults: 0 });
  const [studentList, setStudentList] = useState<any[]>([]);
  const [teacherList, setTeacherList] = useState<any[]>([]);
  const [pendingBatches, setPendingBatches] = useState<ResultBatch[]>([]);
  
  // Settings & Updates State
  const [resumptionDate, setResumptionDate] = useState("");
  const [newResumptionDate, setNewResumptionDate] = useState("");
  const [updates, setUpdates] = useState<any[]>([]);
  const [newUpdate, setNewUpdate] = useState({ title: "", category: "Event", event_date: "" });
  
  // Modal & Upload States
  const [selectedBatch, setSelectedBatch] = useState<ResultBatch | null>(null); 
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null); 
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('staffId');
    if (!id) navigate('/');
    fetchProfile(id!);
    fetchStats();
    fetchStudents();
    fetchTeachers();
    fetchPendingResults();
    fetchConfig();
    fetchUpdates();
  }, []);

  const fetchProfile = async (id: string) => {
    const { data } = await supabase.from('staff').select('*').eq('id', id).single();
    if (data) setPrincipalProfile(data);
  };

  // --- UPDATES MANAGEMENT ---
  const fetchUpdates = async () => {
    const { data } = await supabase.from('school_updates').select('*').order('event_date', { ascending: true });
    if (data) setUpdates(data);
  };

  const postUpdate = async () => {
    if (!newUpdate.title || !newUpdate.event_date) return toast.error("Please fill all fields");
    setLoading(true);
    const { error } = await supabase.from('school_updates').insert([newUpdate]);
    setLoading(false);
    if (error) toast.error("Failed to post update");
    else {
        toast.success("Update Posted!");
        setNewUpdate({ title: "", category: "Event", event_date: "" });
        fetchUpdates();
    }
  };

  const deleteUpdate = async (id: string) => {
    const { error } = await supabase.from('school_updates').delete().eq('id', id);
    if (error) toast.error("Failed to delete");
    else {
        toast.success("Update Removed");
        fetchUpdates();
    }
  };

  // --- CONFIG (RESUMPTION DATE) ---
  const fetchConfig = async () => {
    const { data } = await supabase.from('school_config').select('next_term_begins').limit(1).maybeSingle();
    if (data) {
        setResumptionDate(data.next_term_begins);
        setNewResumptionDate(data.next_term_begins);
    }
  };

  const updateResumptionDate = async () => {
    if (!newResumptionDate) return;
    setLoading(true);
    
    const { error: error1 } = await supabase.from('school_config').upsert({ section_type: 'Secondary', next_term_begins: newResumptionDate }, { onConflict: 'section_type' });
    const { error: error2 } = await supabase.from('school_config').upsert({ section_type: 'Primary', next_term_begins: newResumptionDate }, { onConflict: 'section_type' });
    
    setLoading(false);
    if (error1 || error2) toast.error("Failed to update date");
    else {
        toast.success("Resumption Date Updated for ALL Students!");
        setResumptionDate(newResumptionDate);
    }
  };

  // --- PROFILE UPLOAD ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length || !principalProfile) return;
    setUploading(true);
    try {
        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `staff_${principalProfile.id}_${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('passports').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('passports').getPublicUrl(filePath);
        const { error: updateError } = await supabase.from('staff').update({ passport_url: publicUrl }).eq('id', principalProfile.id);
        if (updateError) throw updateError;
        setPrincipalProfile({ ...principalProfile, passport_url: publicUrl });
        toast.success("Profile Photo Updated");
    } catch (e: any) { toast.error("Upload failed: " + e.message); } finally { setUploading(false); }
  };

  // --- DATA FETCHERS ---
  const fetchStats = async () => {
    const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).or('current_class.ilike.%SS%,current_class.ilike.%JSS%'); 
    const { count: tCount } = await supabase.from('staff').select('*', { count: 'exact', head: true }).eq('role', 'Teacher').eq('section', 'Secondary');
    const { count: rCount } = await supabase.from('results').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    setStats({ students: sCount || 0, teachers: tCount || 0, pendingResults: rCount || 0 });
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('*').or('current_class.ilike.%SS%,current_class.ilike.%JSS%').order('full_name', { ascending: true });
    setStudentList(data || []);
  };

  const fetchTeachers = async () => {
    const { data } = await supabase.from('staff').select('*').eq('role', 'Teacher').eq('section', 'Secondary').order('full_name', { ascending: true });
    setTeacherList(data || []);
  };

  const fetchPendingResults = async () => {
    const { data } = await supabase.from('results').select('*').eq('status', 'pending').order('class_level');
    if (!data) return;
    const groups: { [key: string]: ResultBatch } = {};
    data.forEach((row) => {
      const key = `${row.class_level}-${row.subject}`;
      if (!groups[key]) groups[key] = { id: key, class_level: row.class_level, subject: row.subject, teacher_name: row.teacher_name || 'Unknown', student_count: 0, results: [] };
      groups[key].results.push(row);
      groups[key].student_count++;
    });
    setPendingBatches(Object.values(groups));
  };

  const initiateBatchAction = (action: 'approve' | 'reject') => setConfirmAction(action);
  
  const executeBatchAction = async () => {
    if (!selectedBatch || !confirmAction) return;
    setLoading(true);
    try {
      const status = confirmAction === 'approve' ? 'approved' : 'rejected';
      const ids = selectedBatch.results.map(r => r.id);
      const { error } = await supabase.from('results').update({ status: status }).in('id', ids);
      if (error) throw error;
      toast.success(`Batch ${status.toUpperCase()} successfully!`);
      setConfirmAction(null); setSelectedBatch(null); fetchStats(); fetchPendingResults();
    } catch (e: any) { toast.error("Error updating results"); } finally { setLoading(false); }
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col text-white">
      <div className="p-8 text-center bg-[#0f172a] border-b border-gray-800">
         <div className="w-24 h-24 mx-auto rounded-full border-[3px] border-blue-500 shadow-xl overflow-hidden bg-gray-800 relative group">
             {principalProfile?.passport_url ? <img src={principalProfile.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-2xl font-bold text-blue-400">P</span>}
             <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                 <Camera className="text-white" size={24} />
                 <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
             </label>
         </div>
         <h3 className="font-bold text-lg mt-3 truncate">{principalProfile?.full_name || 'Principal'}</h3>
         <span className="text-[10px] bg-blue-900/50 text-blue-200 px-3 py-0.5 rounded-full uppercase tracking-wider">Administration</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'approvals', label: 'Approve Results', icon: FileCheck },
          { id: 'updates', label: 'News & Events', icon: Megaphone },
          { id: 'students', label: 'Secondary Students', icon: Users },
          { id: 'teachers', label: 'Secondary Teachers', icon: GraduationCap },
          { id: 'settings', label: 'Settings', icon: Settings }, 
        ].map(item => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg translate-x-1' : 'hover:bg-gray-800 text-gray-400'}`}>
            <item.icon size={20} /> {item.label}
            {item.id === 'approvals' && stats.pendingResults > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{pendingBatches.length}</span>}
          </button>
        ))}
      </nav>
      <div className="p-6 bg-gray-900/50 mt-auto"><button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full py-3 bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white rounded-xl flex items-center justify-center gap-2 font-bold transition-all"><LogOut size={18} /> Logout</button></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <SEO title="Principal Portal | Citadel" description="Academic Admin" noindex={true} />
      
      {/* CONFIRM MODAL */}
      {confirmAction && selectedBatch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmAction === 'approve' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                 {confirmAction === 'approve' ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">{confirmAction === 'approve' ? 'Approve Results?' : 'Reject Results?'}</h3>
              <p className="text-center text-gray-500 text-sm mb-6">Are you sure you want to <strong>{confirmAction.toUpperCase()}</strong> the {selectedBatch.subject} results?</p>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setConfirmAction(null)} className="py-3 px-4 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                 <button onClick={executeBatchAction} disabled={loading} className={`py-3 px-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 ${confirmAction === 'approve' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>{loading ? 'Processing...' : `Yes, ${confirmAction === 'approve' ? 'Approve' : 'Reject'}`}</button>
              </div>
           </div>
        </div>
      )}

      {/* BATCH DETAIL MODAL */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#1e3a8a] p-6 text-white flex justify-between items-center shrink-0">
              <div><h2 className="text-xl font-bold flex items-center gap-2">{selectedBatch.class_level} - {selectedBatch.subject}</h2><p className="text-blue-200 text-sm">{selectedBatch.student_count} Students Submitted</p></div>
              <button onClick={() => setSelectedBatch(null)} className="text-blue-200 hover:text-white"><XCircle size={28}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 text-gray-700 font-bold border-b"><tr><th className="p-4">Student Name</th><th className="p-4 text-center">CA (40)</th><th className="p-4 text-center">Exam (60)</th><th className="p-4 text-center">Total (100)</th><th className="p-4 text-center">Grade</th></tr></thead>
                  <tbody className="divide-y">{selectedBatch.results.map((res: any) => (<tr key={res.id} className="hover:bg-blue-50/50"><td className="p-4 font-medium text-gray-900">{res.student_name}</td><td className="p-4 text-center text-gray-600">{(res.ca1_score||0) + (res.ca2_score||0)}</td><td className="p-4 text-center text-gray-600">{res.exam_score}</td><td className="p-4 text-center font-bold text-blue-900">{res.total_score}</td><td className={`p-4 text-center font-bold ${res.total_score < 40 ? 'text-red-500' : 'text-green-600'}`}>{res.grade}</td></tr>))}</tbody>
                </table>
              </div>
              <div className="mt-8 flex justify-end"><div className="text-right border-t-2 border-gray-300 pt-2 px-4"><p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Uploaded By</p><p className="text-lg font-serif font-bold text-[#1e3a8a]">{selectedBatch.teacher_name}</p><p className="text-xs text-gray-400 italic">Subject Teacher</p></div></div>
            </div>
            <div className="p-6 bg-white border-t flex justify-end gap-4 shrink-0">
               <button onClick={() => initiateBatchAction('reject')} disabled={loading} className="px-6 py-3 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-colors">Reject Batch</button>
               <button onClick={() => initiateBatchAction('approve')} disabled={loading} className="px-6 py-3 bg-[#1e3a8a] text-white font-bold rounded-xl hover:bg-blue-900 shadow-lg transition-all flex items-center gap-2"><CheckCircle size={18}/> Approve Batch</button>
            </div>
          </div>
        </div>
      )}

      <aside className="hidden lg:block w-72 bg-[#0f172a] shadow-xl sticky top-0 h-screen z-30"><SidebarContent /></aside>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}><SheetContent side="left" className="p-0 w-72 bg-[#0f172a] border-none"><SidebarContent /></SheetContent></Sheet>

      <main className="flex-1 h-screen overflow-y-auto">
        <header className="lg:hidden p-4 bg-white border-b flex justify-between items-center sticky top-0 z-20">
          <button onClick={() => setIsMobileMenuOpen(true)}><Menu className="text-blue-900" /></button>
          <span className="font-bold text-blue-900 text-lg"> <img src={logo} alt="School Logo" className="w-8 h-8 inline-block mr-2" /> Principal Portal</span>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="animate-in fade-in space-y-6">
              <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100"><h3 className="text-gray-500 font-bold text-sm uppercase">Students (Sec)</h3><p className="text-4xl font-bold text-blue-900 mt-2">{stats.students}</p></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100"><h3 className="text-gray-500 font-bold text-sm uppercase">Teachers (Sec)</h3><p className="text-4xl font-bold text-blue-900 mt-2">{stats.teachers}</p></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100"><h3 className="text-gray-500 font-bold text-sm uppercase">Pending Approvals</h3><p className="text-4xl font-bold text-orange-500 mt-2">{stats.pendingResults}</p></div>
              </div>
            </div>
          )}

          {activeTab === 'approvals' && (
             <div className="space-y-6 animate-in fade-in">
               <div className="flex justify-between items-center"><h1 className="text-2xl font-bold text-gray-800">Result Approvals</h1><span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">{pendingBatches.length} Batches Pending</span></div>
               {pendingBatches.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{pendingBatches.map(batch => (<div key={batch.id} onClick={() => setSelectedBatch(batch)} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"><div className="flex justify-between items-start mb-4"><div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><FileCheck size={24} /></div><span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">Pending</span></div><h3 className="text-lg font-bold text-gray-800">{batch.subject}</h3><p className="text-sm font-medium text-gray-500 mb-4">{batch.class_level}</p><div className="flex items-center gap-3 text-xs text-gray-400 border-t pt-4"><User size={14} /> <span className="truncate">{batch.teacher_name}</span><span className="ml-auto font-bold text-gray-600">{batch.student_count} Students</span></div></div>))}</div>
               ) : (<div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300 text-gray-400"><CheckCircle size={48} className="mx-auto mb-3 opacity-20 text-green-500"/><p>No pending results.</p></div>)}
             </div>
          )}

          {/* --- NEWS & UPDATES TAB --- */}
          {activeTab === 'updates' && (
            <div className="space-y-6 animate-in fade-in">
                <h1 className="text-2xl font-bold text-gray-800">Manage News & Updates</h1>
                
                {/* POST NEW UPDATE */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full">
                        <label className="text-xs font-bold text-gray-400 uppercase">Title</label>
                        <input type="text" className="w-full p-3 bg-gray-50 border rounded-xl" placeholder="e.g. Inter-House Sports" value={newUpdate.title} onChange={e => setNewUpdate({...newUpdate, title: e.target.value})} />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="text-xs font-bold text-gray-400 uppercase">Category</label>
                        <select className="w-full p-3 bg-gray-50 border rounded-xl" value={newUpdate.category} onChange={e => setNewUpdate({...newUpdate, category: e.target.value})}>
                            <option>Event</option><option>Holiday</option><option>Admission</option><option>News</option>
                        </select>
                    </div>
                    <div className="w-full md:w-48">
                        <label className="text-xs font-bold text-gray-400 uppercase">Date</label>
                        <input type="date" className="w-full p-3 bg-gray-50 border rounded-xl" value={newUpdate.event_date} onChange={e => setNewUpdate({...newUpdate, event_date: e.target.value})} />
                    </div>
                    <button onClick={postUpdate} disabled={loading} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center gap-2">{loading ? 'Posting...' : <><Plus size={18}/> Post</>}</button>
                </div>

                {/* LIST OF UPDATES */}
                <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-blue-50 text-blue-900 border-b border-blue-100">
                            <tr><th className="p-4">Title</th><th className="p-4">Category</th><th className="p-4">Date</th><th className="p-4 text-right">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                            {updates.map(update => (
                                <tr key={update.id} className="hover:bg-blue-50/50">
                                    <td className="p-4 font-bold">{update.title}</td>
                                    <td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{update.category}</span></td>
                                    <td className="p-4 text-gray-500">{new Date(update.event_date).toDateString()}</td>
                                    <td className="p-4 text-right"><button onClick={() => deleteUpdate(update.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18}/></button></td>
                                </tr>
                            ))}
                            {updates.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">No updates posted yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {/* --- NEW: SECONDARY STUDENTS TAB --- */}
          {activeTab === 'students' && (
            <div className="space-y-6 animate-in fade-in">
               <h1 className="text-2xl font-bold text-gray-800">Secondary Students Database</h1>
               <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-[#1e3a8a] text-white">
                     <tr><th className="p-4">Student</th><th className="p-4">Class</th><th className="p-4">Admission No</th><th className="p-4">Date of Birth</th><th className="p-4">Parent Phone</th></tr>
                   </thead>
                   <tbody className="divide-y divide-blue-50">
                     {studentList.map(s => (
                       <tr key={s.id} className="hover:bg-blue-50/50">
                         <td className="p-4 flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden shrink-0">
                             {s.passport_url ? <img src={s.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full font-bold text-blue-700">{s.full_name[0]}</span>}
                           </div>
                           <span className="font-bold text-gray-900">{s.full_name}</span>
                         </td>
                         <td className="p-4">{s.current_class}</td>
                         <td className="p-4 font-mono text-sm">{s.admission_number}</td>
                         <td className="p-4">{s.dob || 'N/A'}</td>
                         <td className="p-4">{s.parent_phone}</td>
                       </tr>
                     ))}
                     {studentList.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No secondary students found.</td></tr>}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* --- NEW: SECONDARY TEACHERS TAB --- */}
          {activeTab === 'teachers' && (
            <div className="space-y-6 animate-in fade-in">
               <h1 className="text-2xl font-bold text-gray-800">Secondary Teachers Database</h1>
               <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-x-auto">
                 <table className="w-full text-left text-sm ">
                   <thead className="bg-[#1e3a8a] text-white">
                     <tr>
                       <th className="p-4">Name</th>
                       <th className="p-4">Role</th>
                       <th className="p-4">Assigned Class</th>
                       <th className="p-4">Email</th>
                       <th className="p-4">PIN</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-blue-50">
                     {teacherList.map(t => (
                       <tr key={t.id} className="hover:bg-blue-50/50 transition-colors">
                         <td className="p-4 flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden shrink-0">
                             {t.passport_url ? <img src={t.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full font-bold text-blue-700">{t.full_name[0]}</span>}
                           </div>
                           <span className="font-bold text-gray-900">{t.full_name}</span>
                         </td>
                         <td className="p-4"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{t.role}</span></td>
                         <td className="p-4">
                           <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                             {t.assigned_class ? `${t.assigned_class}` : `Subject Teacher (${t.section || 'N/A'})`}
                           </span>
                         </td>
                         <td className="p-4 text-gray-600">{t.email}</td>
                         <td className="p-4 font-mono text-gray-500">{t.password_text}</td>
                       </tr>
                     ))}
                     {teacherList.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No secondary teachers found.</td></tr>}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* --- SETTINGS TAB (Resumption Date) --- */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in">
                <h1 className="text-2xl font-bold text-gray-800">School Configuration</h1>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100 max-w-2xl">
                    <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Calendar size={20}/></div><div><h3 className="font-bold text-gray-800">Resumption Date</h3><p className="text-xs text-gray-500">Set the next term begin date for ALL students.</p></div></div>
                    <div className="space-y-4">
                        <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Current Setting</label><div className="text-lg font-bold text-blue-900">{resumptionDate || 'Not Set'}</div></div>
                        <div className="pt-4 border-t border-gray-100"><label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Update Date</label><div className="flex gap-4"><input type="text" placeholder="e.g. January 12th, 2026" className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={newResumptionDate} onChange={(e) => setNewResumptionDate(e.target.value)} /><button onClick={updateResumptionDate} disabled={loading} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button></div></div>
                    </div>
                </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default PrincipalDashboard;