import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, LogOut, LayoutDashboard, Settings, 
  Trash2, Menu, Camera, Filter,
  Megaphone, Plus, Calendar, Search, AlertTriangle
} from "lucide-react";
import logo from "/school-logo.png";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SEO from "@/components/SEO";

const ProprietorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [stats, setStats] = useState({ students: 0, staff: 0 });
  const [staffList, setStaffList] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState({ session: '', term: '' });
  const [proprietorProfile, setProprietorProfile] = useState<any>(null);

  // Search & Filters
  const [filterSection, setFilterSection] = useState("All");
  const [filterClass, setFilterClass] = useState("All");
  const [studentSearch, setStudentSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("All");

  const [resumptionDate, setResumptionDate] = useState("");
  const [newResumptionDate, setNewResumptionDate] = useState("");
  const [updates, setUpdates] = useState<any[]>([]);
  const [newUpdate, setNewUpdate] = useState({ title: "", category: "Event", event_date: "" });

  // Custom Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'staff' | 'students', id: string } | null>(null);

  useEffect(() => {
    fetchStats(); fetchSettings(); fetchProfile(); fetchConfig(); fetchUpdates(); fetchStaffList(); fetchStudentList();
  }, []);

  const fetchStats = async () => {
    const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: staffCount } = await supabase.from('staff').select('*', { count: 'exact', head: true });
    setStats({ students: studentCount || 0, staff: staffCount || 0 });
  };
  const fetchSettings = async () => {
    const { data } = await supabase.from('school_settings').select('*').single();
    if (data) setGlobalSettings({ session: data.current_session, term: data.current_term });
  };
  const fetchProfile = async () => {
    const { data } = await supabase.from('staff').select('*').eq('role', 'Proprietor').single();
    if (data) setProprietorProfile(data);
  };
  const fetchStaffList = async () => {
    const { data } = await supabase.from('staff').select('*').order('full_name', { ascending: true });
    setStaffList(data || []);
  };
  const fetchStudentList = async () => {
    const { data } = await supabase.from('students').select('*').order('full_name', { ascending: true });
    setStudentList(data || []);
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
    await supabase.from('school_config').upsert({ section_type: 'Secondary', next_term_begins: newResumptionDate }, { onConflict: 'section_type' });
    await supabase.from('school_config').upsert({ section_type: 'Primary', next_term_begins: newResumptionDate }, { onConflict: 'section_type' });
    setLoading(false); toast.success("Resumption Date Updated!"); setResumptionDate(newResumptionDate);
  };
  const toggleStudentStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('students').update({ is_active: !currentStatus }).eq('id', id);
    toast.success(currentStatus ? "Access Restricted" : "Access Granted"); fetchStudentList(); 
  };

  const handleUpdateSettings = async () => {
    setLoading(true); await supabase.from('school_settings').update({ current_session: globalSettings.session, current_term: globalSettings.term }).neq('id', '00000000-0000-0000-0000-000000000000'); setLoading(false); toast.success("Settings Updated!");
  };
  
  const promptDelete = (table: 'staff' | 'students', id: string) => {
    setItemToDelete({ type: table, id });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setLoading(true);
    const { type, id } = itemToDelete;
    await supabase.from(type).delete().eq('id', id); 
    toast.success("Deleted successfully");
    if (type === 'staff') fetchStaffList(); else fetchStudentList(); 
    fetchStats();
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
    setLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return; setUploading(true);
    try {
      const file = event.target.files[0]; const filePath = `proprietor-${Math.random()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('passports').upload(filePath, file);
      const { data: { publicUrl } } = supabase.storage.from('passports').getPublicUrl(filePath);
      await supabase.from('staff').update({ passport_url: publicUrl }).eq('role', 'Proprietor');
      setProprietorProfile({ ...proprietorProfile, passport_url: publicUrl }); toast.success("Profile Updated");
    } catch (e) { toast.error("Upload failed"); } finally { setUploading(false); }
  };

  const getClassOptions = (section: string) => {
    if (section === 'Primary') return ['Pre-KG', 'Creche', 'KG 1', 'KG 2', 'KG 3', 'Pry 1', 'Pry 2', 'Pry 3', 'Pry 4', 'Pry 5'];
    if (section === 'Secondary') return ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];
    return [];
  };

  const filteredStudents = studentList.filter(student => {
    const stuClass = student.current_class || ""; 
    const matchesSearch = student.full_name.toLowerCase().includes(studentSearch.toLowerCase()) || (student.admission_number || "").toLowerCase().includes(studentSearch.toLowerCase());
    if (filterSection !== "All") {
      const isPrimary = stuClass.includes("Pre-KG") || stuClass.includes("Creche") || stuClass.includes("KG") || stuClass.includes("Pry");
      const isSecondary = stuClass.includes("JSS") || stuClass.includes("SS");
      if (filterSection === "Primary" && !isPrimary) return false;
      if (filterSection === "Secondary" && !isSecondary) return false;
    }
    if (filterClass !== "All" && stuClass !== filterClass) return false;
    return matchesSearch;
  });

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(staffSearch.toLowerCase()) || s.email.toLowerCase().includes(staffSearch.toLowerCase());
    const matchesRole = staffRoleFilter === "All" ? true : s.role === staffRoleFilter;
    return matchesSearch && matchesRole;
  });

  const SidebarContent = () => (
    <div className="h-full flex flex-col text-white bg-black">
      <div className="p-8 text-center border-b border-gray-800">
         <div className="relative inline-block group">
           <div className="w-24 h-24 mx-auto rounded-full border-4 border-[#FFD700] shadow-xl overflow-hidden bg-white">
             {proprietorProfile?.passport_url ? <img src={proprietorProfile.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-4xl font-black text-red-600">P</span>}
           </div>
           <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all text-[#FFD700]">
             <Camera size={20} />
             <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
           </label>
         </div>
         <h3 className="font-black text-lg mt-4 truncate text-white">{proprietorProfile?.full_name || 'Proprietor'}</h3>
         <span className="text-[10px] bg-red-600 text-white px-4 py-1 rounded-full uppercase tracking-widest font-bold mt-2 inline-block">Owner / Director</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard }, 
          { id: 'staff-list', label: 'Staff Database', icon: Users }, 
          { id: 'student-list', label: 'Student Database', icon: Users }, 
          { id: 'updates', label: 'News & Events', icon: Megaphone }, 
          { id: 'settings', label: 'Global Settings', icon: Settings }, 
          { id: 'config', label: 'School Config', icon: Calendar }, 
          { id: 'profile', label: 'My Profile', icon: Users }
        ].map(item => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); if(item.id==='staff-list') fetchStaffList(); if(item.id==='student-list') fetchStudentList(); setIsMobileMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-bold ${activeTab === item.id ? 'bg-[#FFD700] text-black shadow-lg translate-x-2' : 'hover:bg-gray-900 text-gray-400 hover:text-white'}`}>
            <item.icon size={20} /> {item.label}
          </button>
        ))}
      </nav>
      <div className="p-6 mt-auto border-t border-gray-800">
        <button onClick={() => { navigate('/'); }} className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2 font-black transition-all shadow-md uppercase tracking-wider"><LogOut size={18} /> Sign Out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex selection:bg-yellow-300 selection:text-black">
      <SEO title="Proprietor Portal | Citadel" description="Admin Area" noindex={true} />
      <aside className="hidden lg:flex w-72 flex-col z-20 shadow-2xl sticky top-0 h-screen bg-black"><SidebarContent /></aside>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}><SheetContent side="left" className="p-0 w-72 bg-black border-none"><SidebarContent /></SheetContent></Sheet>

      <main className="flex-1 h-screen overflow-y-auto">
        <header className="lg:hidden p-4 bg-[#FFD700] border-b-4 border-black flex justify-between items-center sticky top-0 z-20">
          <button onClick={() => setIsMobileMenuOpen(true)}><Menu className="text-black" /></button>
          <span className="font-black text-black tracking-wide uppercase flex items-center"> <img src={logo} alt="School Logo" className="w-8 h-8 inline rounded-full mr-2 border-2 border-red-600" /> Proprietor</span>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
              <div className="bg-white p-8 rounded-3xl shadow-sm border-l-4 border-red-600">
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Total Students</p>
                <h3 className="text-5xl font-black text-black">{stats.students}</h3>
              </div>
              <div className="bg-black p-8 rounded-3xl shadow-xl border-t-8 border-[#FFD700]">
                <p className="text-[#FFD700] font-bold text-xs uppercase tracking-widest mb-1">Total Staff</p>
                <h3 className="text-5xl font-black text-white">{stats.staff}</h3>
              </div>
            </div>
          )}

          {activeTab === 'staff-list' && (
            <div className="space-y-6 animate-in fade-in">
               <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6">
                 <div className="flex-1 relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input type="text" placeholder="Search staff by name or email..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} className="w-full pl-12 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium focus:ring-2 focus:ring-[#FFD700]" />
                 </div>
                 <div className="flex items-center gap-2">
                   <Filter size={18} className="text-red-600 hidden md:block" />
                   <select value={staffRoleFilter} onChange={e => setStaffRoleFilter(e.target.value)} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-700 focus:ring-2 focus:ring-[#FFD700]">
                     <option value="All">All Roles</option><option value="Teacher">Teacher</option><option value="Principal">Principal</option><option value="Head Teacher">Head Teacher</option><option value="Bursar">Bursar</option>
                   </select>
                 </div>
               </div>

               <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-black text-[#FFD700]"><tr><th className="p-4 font-black tracking-wider uppercase text-xs">Name</th><th className="p-4 font-black tracking-wider uppercase text-xs">Role</th><th className="p-4 font-black tracking-wider uppercase text-xs">Assigned Class</th><th className="p-4 font-black tracking-wider uppercase text-xs">Email</th><th className="p-4 font-black tracking-wider uppercase text-xs">PIN</th><th className="p-4 font-black tracking-wider uppercase text-xs">Action</th></tr></thead>
                     <tbody className="divide-y divide-gray-100">
                       {filteredStaff.map(s => (
                         <tr key={s.id} className="hover:bg-yellow-50 transition-colors">
                           <td className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">{s.passport_url ? <img src={s.passport_url} className="w-full h-full object-cover"/> : <span className="font-bold text-gray-400">{s.full_name ? s.full_name[0] : '?'}</span>}</div><span className="font-bold text-gray-900">{s.full_name}</span></td>
                           <td className="p-4"><span className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{s.role}</span></td>
                           <td className="p-4">{s.role === 'Teacher' ? <span className="bg-red-50 text-red-800 px-3 py-1 rounded-full text-xs font-bold border border-red-100">{s.assigned_class ? `${s.assigned_class} (${s.section})` : `Subject Teacher (${s.section || 'N/A'})`}</span> : <span className="text-gray-400 text-xs italic">N/A</span>}</td>
                           <td className="p-4 text-gray-600 font-medium">{s.email}</td>
                           <td className="p-4 font-mono font-bold text-gray-500">{s.password_text}</td>
                           <td className="p-4"><button onClick={() => promptDelete('staff', s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button></td>
                         </tr>
                       ))}
                       {filteredStaff.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400 font-medium">No staff found matching your search.</td></tr>}
                     </tbody>
                   </table>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'student-list' && (
             <div className="space-y-6 animate-in fade-in">
               <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6">
                 <div className="flex-1 relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input type="text" placeholder="Search student by name or admission number..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="w-full pl-12 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium focus:ring-2 focus:ring-[#FFD700]" />
                 </div>
                 <div className="flex items-center gap-2">
                   <Filter size={18} className="text-red-600 hidden md:block" />
                   <select value={filterSection} onChange={e => { setFilterSection(e.target.value); setFilterClass("All"); }} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-700 focus:ring-2 focus:ring-[#FFD700]">
                     <option value="All">All Sections</option><option value="Primary">Primary</option><option value="Secondary">Secondary</option>
                   </select>
                   <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-700 focus:ring-2 focus:ring-[#FFD700]">
                     <option value="All">All Classes</option>
                     {filterSection === "All" && [...getClassOptions("Primary"), ...getClassOptions("Secondary")].map(c => <option key={c} value={c}>{c}</option>)}
                     {filterSection === "Primary" && getClassOptions("Primary").map(c => <option key={c} value={c}>{c}</option>)}
                     {filterSection === "Secondary" && getClassOptions("Secondary").map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                 </div>
               </div>

               <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-black text-[#FFD700]"><tr><th className="p-4 font-black tracking-wider uppercase text-xs">Name</th><th className="p-4 font-black tracking-wider uppercase text-xs">Class</th><th className="p-4 font-black tracking-wider uppercase text-xs">Admission No</th><th className="p-4 font-black tracking-wider uppercase text-xs">Gender</th><th className="p-4 font-black tracking-wider uppercase text-xs">Status</th><th className="p-4 font-black tracking-wider uppercase text-xs">Action</th></tr></thead>
                     <tbody className="divide-y divide-gray-100">
                       {filteredStudents.map(s => (
                         <tr key={s.id} className="hover:bg-yellow-50 transition-colors">
                           <td className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">{s.passport_url ? <img src={s.passport_url} className="w-full h-full object-cover"/> : <span className="font-bold text-gray-400">{s.full_name ? s.full_name[0] : '?'}</span>}</div><span className="font-bold text-gray-900">{s.full_name}</span></td>
                           <td className="p-4"><span className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{s.current_class}</span></td>
                           <td className="p-4 font-mono font-bold text-gray-600">{s.admission_number}</td>
                           <td className="p-4 text-gray-600 font-medium">{s.gender}</td>
                           <td className="p-4"><button onClick={() => toggleStudentStatus(s.id, s.is_active)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${s.is_active ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'}`}>{s.is_active ? 'Active' : 'Locked'}</button></td>
                           <td className="p-4"><button onClick={() => promptDelete('students', s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button></td>
                         </tr>
                       ))}
                       {filteredStudents.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400 font-medium">No students found matching your search.</td></tr>}
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'updates' && (
            <div className="space-y-6 animate-in fade-in">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manage News & Updates</h1>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full"><label className="text-xs font-black text-gray-400 uppercase tracking-widest">Title</label><input type="text" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FFD700] font-medium mt-1" value={newUpdate.title} onChange={e => setNewUpdate({...newUpdate, title: e.target.value})} /></div>
                    <div className="w-full md:w-48"><label className="text-xs font-black text-gray-400 uppercase tracking-widest">Category</label><select className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FFD700] font-bold text-gray-700 mt-1" value={newUpdate.category} onChange={e => setNewUpdate({...newUpdate, category: e.target.value})}><option>Event</option><option>Holiday</option><option>Admission</option><option>News</option></select></div>
                    <div className="w-full md:w-48"><label className="text-xs font-black text-gray-400 uppercase tracking-widest">Date</label><input type="date" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FFD700] font-medium mt-1" value={newUpdate.event_date} onChange={e => setNewUpdate({...newUpdate, event_date: e.target.value})} /></div>
                    <button onClick={postUpdate} disabled={loading} className="px-8 py-3.5 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 flex items-center gap-2 shadow-md uppercase tracking-wider">{loading ? 'Posting...' : <><Plus size={18}/> Post</>}</button>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-black text-[#FFD700]"><tr><th className="p-4 font-black uppercase tracking-wider text-xs">Title</th><th className="p-4 font-black uppercase tracking-wider text-xs">Category</th><th className="p-4 font-black uppercase tracking-wider text-xs">Date</th><th className="p-4 font-black uppercase tracking-wider text-xs text-right">Action</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {updates.map(update => (
                                <tr key={update.id} className="hover:bg-yellow-50 transition-colors">
                                    <td className="p-4 font-bold text-gray-900">{update.title}</td>
                                    <td className="p-4"><span className="bg-gray-100 border border-gray-200 text-gray-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">{update.category}</span></td>
                                    <td className="p-4 text-gray-500 font-medium">{new Date(update.event_date).toDateString()}</td>
                                    <td className="p-4 text-right"><button onClick={() => deleteUpdate(update.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18}/></button></td>
                                </tr>
                            ))}
                            {updates.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-medium">No updates posted yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6 animate-in fade-in">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">School Configuration</h1>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 max-w-2xl border-t-8 border-black">
                    <div className="flex items-center gap-3 mb-6"><div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100"><Calendar size={20}/></div><div><h3 className="font-black text-gray-900 text-lg">Resumption Date</h3><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Set the next term begin date for ALL students.</p></div></div>
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Current Setting</label><div className="text-xl font-black text-red-600">{resumptionDate || 'Not Set'}</div></div>
                        <div className="pt-4"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Update Date</label><div className="flex gap-4"><input type="text" placeholder="e.g. January 12th, 2026" className="flex-1 p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none font-medium text-gray-900" value={newResumptionDate} onChange={(e) => setNewResumptionDate(e.target.value)} /><button onClick={updateResumptionDate} disabled={loading} className="bg-black text-[#FFD700] px-8 py-3.5 rounded-xl font-black hover:bg-gray-800 transition-colors uppercase tracking-widest shadow-md disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button></div></div>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="bg-white p-8 md:p-12 text-center rounded-3xl shadow-sm border border-gray-200 max-w-xl mx-auto animate-in fade-in border-t-8 border-red-600 mt-4 md:mt-0">
                <Settings size={56} className="mx-auto text-gray-300 mb-6" />
                <h3 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Global Settings</h3>
                <div className="space-y-4 text-left">
                  <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Session</label><input value={globalSettings.session} onChange={e => setGlobalSettings({...globalSettings, session: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFD700] outline-none font-bold text-gray-900" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Term</label><select value={globalSettings.term} onChange={e => setGlobalSettings({...globalSettings, term: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFD700] outline-none font-bold text-gray-900"><option>1st Term</option><option>2nd Term</option><option>3rd Term</option></select></div>
                  <button onClick={handleUpdateSettings} className="w-full py-4 mt-4 bg-red-600 text-white font-black rounded-xl shadow-lg hover:bg-red-700 transition-all uppercase tracking-widest">Update Settings</button>
                </div>
             </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white p-8 md:p-12 text-center rounded-3xl shadow-sm border border-gray-200 max-w-xl mx-auto animate-in fade-in border-t-8 border-black mt-4 md:mt-0">
               <div className="w-32 h-32 mx-auto bg-black rounded-full flex items-center justify-center mb-6 border-4 border-[#FFD700] overflow-hidden relative group">
                 {proprietorProfile?.passport_url ? <img src={proprietorProfile.passport_url} className="w-full h-full object-cover"/> : <span className="text-4xl text-[#FFD700] font-black">P</span>}
                 <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all text-[#FFD700]">
                   <Camera size={32} />
                   <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                 </label>
               </div>
               <h2 className="text-3xl font-black text-gray-900 tracking-tight">{proprietorProfile?.full_name || 'Proprietor'}</h2>
               <p className="bg-red-600 text-white font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-widest mt-3 inline-block shadow-sm">Owner / Director</p>
               
               <div className="mt-8 text-left space-y-4 bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-200">
                 <div className="bg-white p-4 border border-gray-100 rounded-xl shadow-sm"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email / Login ID</p><p className="font-bold text-gray-900 text-lg truncate">{proprietorProfile?.email}</p></div>
                 <div className="bg-white p-4 border border-gray-100 rounded-xl shadow-sm"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Access PIN</p><p className="font-black font-mono text-red-600 text-xl tracking-widest">{proprietorProfile?.password_text}</p></div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 md:p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 border-[6px] border-red-100/50">
                   <AlertTriangle size={36} className="text-red-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Delete Record?</h3>
                <p className="text-gray-500 font-medium text-sm leading-relaxed">
                  Are you sure you want to delete this {itemToDelete.type === 'staff' ? 'staff member' : 'student'}? This action cannot be undone.
                </p>
             </div>
             <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3.5 bg-white text-gray-700 font-bold border border-gray-200 rounded-xl hover:bg-gray-100 transition-all shadow-sm">
                  Cancel
                </button>
                <button onClick={confirmDelete} disabled={loading} className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-md shadow-red-600/20 hover:bg-red-700 transition-all">
                  {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProprietorDashboard;