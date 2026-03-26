import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, LogOut, LayoutDashboard, Settings, 
  Trash2, Menu, Camera, Filter,
  Megaphone, Plus, Calendar, Search
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
  
  const handleDelete = async (table: 'staff' | 'students', id: string) => {
    if (!confirm("Are you sure?")) return;
    await supabase.from(table).delete().eq('id', id); toast.success("Deleted successfully");
    if (table === 'staff') fetchStaffList(); else fetchStudentList(); fetchStats();
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
    if (section === 'Primary') return ['Creche', 'KG 1', 'KG 2', 'KG 3', 'Pry 1', 'Pry 2', 'Pry 3', 'Pry 4', 'Pry 5'];
    if (section === 'Secondary') return ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];
    return [];
  };

  const filteredStudents = studentList.filter(student => {
    const stuClass = student.current_class || ""; 
    const matchesSearch = student.full_name.toLowerCase().includes(studentSearch.toLowerCase()) || (student.admission_number || "").toLowerCase().includes(studentSearch.toLowerCase());
    if (filterSection !== "All") {
      const isPrimary = stuClass.includes("Creche") || stuClass.includes("KG") || stuClass.includes("Pry");
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
    <div className="h-full flex flex-col text-white">
      <div className="p-8 text-center bg-[#0f172a] border-b border-gray-800">
         <div className="relative inline-block group">
           <div className="w-24 h-24 mx-auto rounded-full border-[3px] border-blue-500 shadow-xl overflow-hidden bg-gray-800">
             {proprietorProfile?.passport_url ? <img src={proprietorProfile.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-2xl font-bold">P</span>}
           </div>
           <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all text-white">
             <Camera size={20} />
             <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
           </label>
         </div>
         <h3 className="font-bold text-lg mt-3 truncate">{proprietorProfile?.full_name || 'Proprietor'}</h3>
         <span className="text-[10px] bg-blue-900/50 text-blue-200 px-3 py-0.5 rounded-full uppercase tracking-wider">Owner / Director</span>
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
          <button key={item.id} onClick={() => { setActiveTab(item.id); if(item.id==='staff-list') fetchStaffList(); if(item.id==='student-list') fetchStudentList(); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg translate-x-1' : 'hover:bg-gray-800 text-gray-400'}`}><item.icon size={18} /> {item.label}</button>
        ))}
      </nav>
      <div className="p-6 bg-gray-900/50 mt-auto border-t border-gray-800"><button onClick={() => { navigate('/'); }} className="w-full py-3 bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-md"><LogOut size={16} /> Sign Out</button></div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-slate-50 font-sans flex">
      <SEO title="Proprietor Portal | Citadel" description="Admin Area" noindex={true} />
      <aside className="hidden lg:flex w-72 flex-col z-20 shadow-2xl sticky top-0 h-[100dvh] bg-[#0f172a]"><SidebarContent /></aside>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}><SheetContent side="left" className="p-0 w-72 bg-[#0f172a] border-none"><SidebarContent /></SheetContent></Sheet>

      <main className="flex-1 h-[100dvh] overflow-y-auto">
        <header className="lg:hidden p-4 bg-white border-b border-gray-200 flex justify-between items-center sticky top-0 z-20"><button onClick={() => setIsMobileMenuOpen(true)}><Menu className="text-blue-900" /></button><span className="font-bold text-blue-900"> <img src={logo} alt="School Logo" className="w-8 h-8 inline rounded-full mr-2" /> Proprietor Portal</span></header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-blue-100"><h3 className="text-5xl font-bold text-blue-900 mb-1">{stats.students}</h3><p className="text-gray-500 font-bold text-sm uppercase tracking-wide">Total Students</p></div>
              <div className="bg-blue-900 p-8 rounded-[2rem] shadow-xl"><h3 className="text-5xl font-bold text-white mb-1">{stats.staff}</h3><p className="text-blue-200 font-medium text-sm uppercase tracking-wide">Total Staff</p></div>
            </div>
          )}

          {activeTab === 'staff-list' && (
            <div className="space-y-6 animate-in fade-in">
               <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-blue-100 mb-6">
                 <div className="flex-1 relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input type="text" placeholder="Search staff by name or email..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} className="w-full pl-12 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600" />
                 </div>
                 <div className="flex items-center gap-2">
                   <Filter size={18} className="text-gray-400 hidden md:block" />
                   <select value={staffRoleFilter} onChange={e => setStaffRoleFilter(e.target.value)} className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium focus:ring-2 focus:ring-blue-600">
                     <option value="All">All Roles</option><option value="Teacher">Teacher</option><option value="Principal">Principal</option><option value="Head Teacher">Head Teacher</option><option value="Bursar">Bursar</option>
                   </select>
                 </div>
               </div>

               <div className="bg-white rounded-3xl shadow-sm border border-blue-100 overflow-hidden">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-[#0f172a] text-white"><tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Assigned Class</th><th className="p-4">Email</th><th className="p-4">PIN</th><th className="p-4">Action</th></tr></thead>
                     <tbody className="divide-y divide-gray-100">
                       {filteredStaff.map(s => (
                         <tr key={s.id} className="hover:bg-blue-50/50 transition-colors">
                           <td className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">{s.passport_url ? <img src={s.passport_url} className="w-full h-full object-cover"/> : <span className="font-bold text-gray-400">{s.full_name ? s.full_name[0] : '?'}</span>}</div><span className="font-bold text-gray-900">{s.full_name}</span></td>
                           <td className="p-4"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{s.role}</span></td>
                           <td className="p-4">{s.role === 'Teacher' ? <span className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">{s.assigned_class ? `${s.assigned_class} (${s.section})` : `Subject Teacher (${s.section || 'N/A'})`}</span> : <span className="text-gray-400 text-xs italic">N/A</span>}</td>
                           <td className="p-4 text-gray-600">{s.email}</td>
                           <td className="p-4 font-mono text-gray-500">{s.password_text}</td>
                           <td className="p-4"><button onClick={() => handleDelete('staff', s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button></td>
                         </tr>
                       ))}
                       {filteredStaff.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No staff found matching your search.</td></tr>}
                     </tbody>
                   </table>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'student-list' && (
             <div className="space-y-6 animate-in fade-in">
               <div className="flex flex-col xl:flex-row gap-4 bg-white p-5 rounded-2xl shadow-sm border border-blue-100 mb-6">
                 <div className="flex-1 relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                   <input type="text" placeholder="Search by student name or admission number..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="w-full pl-12 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-700 focus:ring-2 focus:ring-blue-600 transition-all" />
                 </div>
                 <div className="flex items-center gap-3">
                   <Filter size={20} className="text-gray-400 hidden md:block" />
                   <select value={filterSection} onChange={e => { setFilterSection(e.target.value); setFilterClass("All"); }} className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-600">
                     <option value="All">All Sections</option><option value="Primary">Primary Section</option><option value="Secondary">Secondary Section</option>
                   </select>
                   <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-600">
                     <option value="All">All Classes</option>
                     {filterSection === "All" && [...getClassOptions("Primary"), ...getClassOptions("Secondary")].map(c => <option key={c} value={c}>{c}</option>)}
                     {filterSection === "Primary" && getClassOptions("Primary").map(c => <option key={c} value={c}>{c}</option>)}
                     {filterSection === "Secondary" && getClassOptions("Secondary").map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                 {filteredStudents.length > 0 ? filteredStudents.map(s => (
                   <div key={s.id} className="bg-white border border-blue-100 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                      <div className="flex gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-200 overflow-hidden flex-shrink-0">{s.passport_url ? <img src={s.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full font-bold text-2xl text-blue-400">{s.full_name[0]}</span>}</div>
                        <div className="overflow-hidden"><h3 className="font-bold text-gray-900 truncate text-lg">{s.full_name}</h3><div className="flex gap-2 mt-1"><span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-xs font-bold rounded text-gray-600">{s.current_class}</span><span className={`px-2 py-0.5 text-xs font-bold rounded border ${s.gender === 'Male' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-pink-50 border-pink-100 text-pink-600'}`}>{s.gender || 'N/A'}</span></div></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl mb-4 text-sm"><div><p className="text-[10px] uppercase text-gray-400 font-bold">Admission ID</p><p className="font-bold text-gray-900 truncate">{s.admission_number}</p><p className="text-[10px] text-red-500 font-bold mt-1 italic">PIN Hidden (Bursar Access)</p></div><div><p className="text-[10px] uppercase text-gray-400 font-bold">Parent</p><p className="font-bold text-gray-900">{s.parent_phone}</p></div></div>
                      <div className="flex items-center justify-between border-t border-gray-100 pt-3"><label className="flex items-center gap-2 cursor-pointer"><div className={`w-10 h-5 rounded-full p-1 transition-colors ${s.is_active ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => toggleStudentStatus(s.id, s.is_active)}><div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${s.is_active ? 'translate-x-5' : 'translate-x-0'}`}></div></div><span className={`text-xs font-bold ${s.is_active ? 'text-green-600' : 'text-gray-500'}`}>{s.is_active ? 'Active' : 'Locked'}</span></label><button onClick={() => handleDelete('students', s.id)} className="text-red-400 hover:text-red-600 flex items-center gap-1 text-xs font-bold transition-colors"><Trash2 size={14}/> Delete</button></div>
                   </div>
                 )) : (<div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-blue-200"><p>No students matching your filter.</p></div>)}
               </div>
             </div>
          )}

          {activeTab === 'updates' && (
            <div className="space-y-6 animate-in fade-in">
                <h1 className="text-2xl font-bold text-gray-800">Manage News & Updates</h1>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full"><label className="text-xs font-bold text-gray-400 uppercase">Title</label><input type="text" className="w-full p-3 bg-gray-50 border rounded-xl" value={newUpdate.title} onChange={e => setNewUpdate({...newUpdate, title: e.target.value})} /></div>
                    <div className="w-full md:w-48"><label className="text-xs font-bold text-gray-400 uppercase">Category</label><select className="w-full p-3 bg-gray-50 border rounded-xl" value={newUpdate.category} onChange={e => setNewUpdate({...newUpdate, category: e.target.value})}><option>Event</option><option>Holiday</option><option>Admission</option><option>News</option></select></div>
                    <div className="w-full md:w-48"><label className="text-xs font-bold text-gray-400 uppercase">Date</label><input type="date" className="w-full p-3 bg-gray-50 border rounded-xl" value={newUpdate.event_date} onChange={e => setNewUpdate({...newUpdate, event_date: e.target.value})} /></div>
                    <button onClick={postUpdate} disabled={loading} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center gap-2">{loading ? 'Posting...' : <><Plus size={18}/> Post</>}</button>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden"><table className="w-full text-left text-sm"><thead className="bg-[#0f172a] text-white"><tr><th className="p-4">Title</th><th className="p-4">Category</th><th className="p-4">Date</th><th className="p-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-gray-100">{updates.map(update => (<tr key={update.id} className="hover:bg-blue-50/50"><td className="p-4 font-bold text-gray-800">{update.title}</td><td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{update.category}</span></td><td className="p-4 text-gray-500">{new Date(update.event_date).toDateString()}</td><td className="p-4 text-right"><button onClick={() => deleteUpdate(update.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18}/></button></td></tr>))}</tbody></table></div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6 animate-in fade-in">
                <h1 className="text-2xl font-bold text-gray-800">School Configuration</h1>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100 max-w-2xl">
                    <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-white"><Calendar size={20}/></div><div><h3 className="font-bold text-gray-800">Resumption Date</h3><p className="text-xs text-gray-500">Set the next term begin date for ALL students.</p></div></div>
                    <div className="space-y-4">
                        <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Current Setting</label><div className="text-lg font-bold text-blue-900">{resumptionDate || 'Not Set'}</div></div>
                        <div className="pt-4 border-t border-gray-100"><label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Update Date</label><div className="flex gap-4"><input type="text" placeholder="e.g. January 12th, 2026" className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" value={newResumptionDate} onChange={(e) => setNewResumptionDate(e.target.value)} /><button onClick={updateResumptionDate} disabled={loading} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">{loading ? 'Saving...' : 'Save'}</button></div></div>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="bg-white p-8 md:p-12 text-center rounded-3xl shadow-sm border border-blue-100 max-w-xl mx-auto animate-in fade-in">
                <Settings size={48} className="mx-auto text-blue-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-6">Global Settings</h3>
                <div className="space-y-4 text-left"><input value={globalSettings.session} onChange={e => setGlobalSettings({...globalSettings, session: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" /><select value={globalSettings.term} onChange={e => setGlobalSettings({...globalSettings, term: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"><option>1st Term</option><option>2nd Term</option><option>3rd Term</option></select><button onClick={handleUpdateSettings} className="w-full py-4 bg-blue-900 text-white font-bold rounded-xl shadow-lg hover:bg-blue-800 transition-colors">Update</button></div>
             </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white p-8 md:p-12 text-center rounded-3xl shadow-sm border border-blue-100 max-w-xl mx-auto animate-in fade-in">
               <div className="w-32 h-32 mx-auto bg-[#0f172a] rounded-full flex items-center justify-center mb-6 border-4 border-blue-100 overflow-hidden relative group">
                 {proprietorProfile?.passport_url ? <img src={proprietorProfile.passport_url} className="w-full h-full object-cover"/> : <span className="text-4xl text-white font-bold">P</span>}
                 <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all text-white">
                   <Camera size={24} />
                   <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                 </label>
               </div>
               <h2 className="text-2xl font-bold text-gray-900">{proprietorProfile?.full_name || 'Proprietor'}</h2>
               <div className="mt-6 text-left space-y-3 bg-gray-50 p-6 rounded-xl border border-gray-100">
                 <div><p className="text-xs font-bold text-gray-500 uppercase">Email</p><p className="font-medium text-gray-800">{proprietorProfile?.email}</p></div>
                 <div><p className="text-xs font-bold text-gray-500 uppercase">Pass</p><p className="font-medium text-gray-800">{proprietorProfile?.password_text}</p></div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProprietorDashboard;