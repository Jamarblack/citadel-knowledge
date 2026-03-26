import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, UserPlus, LogOut, LayoutDashboard, Settings, 
  GraduationCap, Trash2, Menu, Camera, RefreshCw, Filter,
  Megaphone, Plus, Calendar, Search
} from "lucide-react";
import logo from "/school-logo.png";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SEO from "@/components/SEO";

const ProprietressDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [stats, setStats] = useState({ students: 0, staff: 0 });
  const [staffList, setStaffList] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState({ session: '', term: '' });
  const [proprietressProfile, setProprietressProfile] = useState<any>(null);

  // Search & Filters
  const [filterSection, setFilterSection] = useState("Primary");
  const [filterClass, setFilterClass] = useState("All");
  const [studentSearch, setStudentSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("All");

  const [resumptionDate, setResumptionDate] = useState("");
  const [newResumptionDate, setNewResumptionDate] = useState("");
  const [updates, setUpdates] = useState<any[]>([]);
  const [newUpdate, setNewUpdate] = useState({ title: "", category: "Event", event_date: "" });

  const [staffForm, setStaffForm] = useState({ name: '', role: 'Teacher', email: '', password: '', section: 'Primary', assigned_class: '' });
  const [studentForm, setStudentForm] = useState({ name: '', gender: '', admission_no: '', class: '', dob: '', parent_phone: '', parent_phone_2: '', password: '' });

  useEffect(() => {
    fetchStats(); fetchSettings(); fetchProprietressProfile(); fetchConfig(); fetchUpdates(); fetchStaffList(); fetchStudentList();
  }, []);

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
    if (activeTab === 'register-staff' && !staffForm.password) generateStaffPin();
    if (activeTab === 'register-student' && !studentForm.password) generateStudentPin();
  }, [activeTab]);

  const fetchStats = async () => {
    const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: staffCount } = await supabase.from('staff').select('*', { count: 'exact', head: true });
    setStats({ students: studentCount || 0, staff: staffCount || 0 });
  };
  const fetchSettings = async () => {
    const { data } = await supabase.from('school_settings').select('*').single();
    if (data) setGlobalSettings({ session: data.current_session, term: data.current_term });
  };
  const fetchProprietressProfile = async () => {
    const { data } = await supabase.from('staff').select('*').eq('role', 'Proprietress').single();
    if (data) setProprietressProfile(data);
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
  
  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const finalClass = staffForm.role === 'Teacher' ? staffForm.assigned_class : null;
      await supabase.from('staff').insert([{ full_name: staffForm.name, role: staffForm.role, email: staffForm.email, password_text: staffForm.password, assigned_class: finalClass, section: staffForm.section }]);
      toast.success(`Staff Created: ${staffForm.name}`); setStaffForm({ name: '', role: 'Teacher', email: '', password: '', section: 'Primary', assigned_class: '' }); generateStaffPin(); fetchStats(); fetchStaffList();
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await supabase.from('students').insert([{ full_name: studentForm.name, gender: studentForm.gender, admission_number: studentForm.admission_no, current_class: studentForm.class, dob: studentForm.dob, parent_phone: studentForm.parent_phone, parent_phone_2: studentForm.parent_phone_2, password_text: studentForm.password }]);
      toast.success(`Student Registered: ${studentForm.admission_no}`); setStudentForm({ name: '', gender: '', admission_no: '', class: '', dob: '', parent_phone: '', parent_phone_2: '', password: '' }); generateStudentPin(); fetchStats(); fetchStudentList();
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
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
      const file = event.target.files[0]; const filePath = `proprietress-${Math.random()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('passports').upload(filePath, file);
      const { data: { publicUrl } } = supabase.storage.from('passports').getPublicUrl(filePath);
      await supabase.from('staff').update({ passport_url: publicUrl }).eq('role', 'Proprietress');
      setProprietressProfile({ ...proprietressProfile, passport_url: publicUrl }); toast.success("Profile Updated");
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
    <div className="h-full flex flex-col text-[#2c0a0e]">
      <div className="p-8 text-center bg-[#fdf6e3]/30 border-b border-[#2c0a0e]/10">
         <div className="relative inline-block group">
           <div className="w-24 h-24 mx-auto rounded-full border-[3px] border-[#2c0a0e] shadow-xl overflow-hidden bg-[#fdf6e3]">
             {proprietressProfile?.passport_url ? <img src={proprietressProfile.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-2xl font-bold">P</span>}
           </div>
           <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all text-white">
             <Camera size={20} />
             <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
           </label>
         </div>
         <h3 className="font-serif font-bold text-lg mt-3 truncate">{proprietressProfile?.full_name || 'Proprietress'}</h3>
         <span className="text-[10px] font-black uppercase tracking-widest text-[#540b0e]">Owner / Director</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {[{ id: 'overview', label: 'Overview', icon: LayoutDashboard }, { id: 'register-staff', label: 'Register Staff', icon: UserPlus }, { id: 'register-student', label: 'Register Student', icon: GraduationCap }, { id: 'staff-list', label: 'Staff Database', icon: Users }, { id: 'student-list', label: 'Student Database', icon: Users }, { id: 'updates', label: 'News & Events', icon: Megaphone }, { id: 'settings', label: 'Global Settings', icon: Settings }, { id: 'config', label: 'School Config', icon: Calendar }, { id: 'profile', label: 'My Profile', icon: Users }].map(item => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); if(item.id==='staff-list') fetchStaffList(); if(item.id==='student-list') fetchStudentList(); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id ? 'bg-[#2c0a0e] text-[#fcf6ba] shadow-lg translate-x-1' : 'hover:bg-[#2c0a0e]/10 text-[#2c0a0e]'}`}><item.icon size={18} /> {item.label}</button>
        ))}
      </nav>
      <div className="p-6 bg-[#2c0a0e]/5 mt-auto border-t border-[#2c0a0e]/10"><button onClick={() => { navigate('/'); }} className="w-full py-3 bg-[#540b0e] hover:bg-[#2c0a0e] text-[#fcf6ba] rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-md"><LogOut size={16} /> Sign Out</button></div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#f8f5f2] font-sans flex">
      <SEO title="Proprietress Portal | Citadel" description="Admin Area" noindex={true} />
      <aside className="hidden lg:flex w-72 flex-col z-20 shadow-2xl sticky top-0 h-[100dvh] bg-gradient-to-b from-[#e6b981] via-[#fdf6e3] to-[#d4a373] border-r border-[#c28e5c]"><SidebarContent /></aside>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}><SheetContent side="left" className="p-0 w-72 border-r border-[#c28e5c] bg-gradient-to-b from-[#e6b981] via-[#fdf6e3] to-[#d4a373]"><SidebarContent /></SheetContent></Sheet>

      <main className="flex-1 h-[100dvh] overflow-y-auto">
        <header className="lg:hidden p-4 bg-[#fdf6e3] border-b border-[#c28e5c] flex justify-between items-center sticky top-0 z-20"><button onClick={() => setIsMobileMenuOpen(true)}><Menu className="text-[#2c0a0e]" /></button><span className="font-serif font-bold text-[#2c0a0e]"> <img src={logo} alt="School Logo" className="w-8 h-8 inline rounded-full mr-2" /> Proprietress Portal</span></header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-[#d4a373]/20"><h3 className="text-5xl font-bold text-[#2c0a0e] mb-1">{stats.students}</h3><p className="text-[#8b5e3c] font-medium text-sm uppercase tracking-wide">Total Students</p></div>
              <div className="bg-[#2c0a0e] p-8 rounded-[2rem] shadow-xl"><h3 className="text-5xl font-bold text-[#fcf6ba] mb-1">{stats.staff}</h3><p className="text-[#fcf6ba]/70 font-medium text-sm uppercase tracking-wide">Total Staff</p></div>
            </div>
          )}

          {activeTab === 'register-staff' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-[#d4a373]/20 max-w-2xl animate-in fade-in">
              <h2 className="text-2xl font-serif font-bold text-[#2c0a0e] mb-6">Register New Staff</h2>
              <form onSubmit={handleRegisterStaff} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-sm font-bold text-[#2c0a0e]">Full Name</label><input required type="text" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4a373]" placeholder="Mr. Name" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-[#2c0a0e]">Role</label><select value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4a373]"><option>Teacher</option><option>Principal</option><option>Head Teacher</option><option>Bursar</option></select></div>
                  <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-[#2c0a0e]">Email (Auto)</label><input readOnly value={staffForm.email} className="w-full p-3 bg-gray-100 rounded-xl border border-gray-200 text-gray-500" /></div>
                  {staffForm.role === 'Teacher' && (
                    <>
                      <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-[#2c0a0e]">Section</label><select required value={staffForm.section} onChange={e => setStaffForm({...staffForm, section: e.target.value, assigned_class: ''})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4a373]"><option value="">-- Select --</option><option value="Primary">Primary</option><option value="Secondary">Secondary</option></select></div>
                      <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-[#2c0a0e]">Assign Class</label><select required value={staffForm.assigned_class} onChange={e => setStaffForm({...staffForm, assigned_class: e.target.value})} disabled={!staffForm.section} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4a373]"><option value="">-- Select --</option>{getClassOptions(staffForm.section).map(c => <option key={c}>{c}</option>)}</select></div>
                    </>
                  )}
                </div>
                <button disabled={loading} type="submit" className="w-full py-4 bg-[#2c0a0e] text-[#fcf6ba] font-bold rounded-xl shadow-lg hover:bg-[#540b0e]">{loading ? 'Creating...' : 'Create Account'}</button>
              </form>
            </div>
          )}

          {activeTab === 'register-student' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-[#d4a373]/20 max-w-2xl animate-in fade-in">
              <h2 className="text-2xl font-serif font-bold text-[#2c0a0e] mb-6">Register Student</h2>
              <form onSubmit={handleRegisterStudent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-[#2c0a0e]">Full Name</label><input required type="text" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4a373]" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-[#2c0a0e]">Gender</label><select required value={studentForm.gender} onChange={e => setStudentForm({...studentForm, gender: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4a373]"><option value="">Select</option><option>Male</option><option>Female</option></select></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-[#2c0a0e]">DOB</label><input required type="date" value={studentForm.dob} onChange={e => setStudentForm({...studentForm, dob: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4a373]" /></div>
                  <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-[#2c0a0e]">Class</label><select required value={studentForm.class} onChange={e => setStudentForm({...studentForm, class: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4a373]"><option value="">Select</option><optgroup label="Primary">{getClassOptions('Primary').map(c => <option key={c}>{c}</option>)}</optgroup><optgroup label="Secondary">{getClassOptions('Secondary').map(c => <option key={c}>{c}</option>)}</optgroup></select></div>
                  
                  <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-[#2c0a0e]">Admission Number</label><div className="flex gap-2"><input required type="text" value={studentForm.admission_no} onChange={e => setStudentForm({...studentForm, admission_no: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4a373]" placeholder="e.g. CKIS/26/27/001" /><button type="button" onClick={generateAdmissionNo} className="p-3 bg-[#d4a373] text-[#2c0a0e] font-bold rounded-xl whitespace-nowrap hover:bg-[#c28e5c] transition-colors">Auto Gen</button></div></div>
                  
                  <div className="space-y-2"><label className="text-sm font-bold text-[#2c0a0e]">Phone 1</label><input required type="tel" value={studentForm.parent_phone} onChange={e => setStudentForm({...studentForm, parent_phone: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4a373]" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-[#2c0a0e]">Phone 2</label><input type="tel" value={studentForm.parent_phone_2} onChange={e => setStudentForm({...studentForm, parent_phone_2: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4a373]" /></div>
                </div>
                <button disabled={loading} type="submit" className="w-full py-4 bg-[#d4a373] text-[#2c0a0e] font-bold rounded-xl shadow-lg hover:bg-[#c28e5c]">{loading ? 'Registering...' : 'Register Student'}</button>
              </form>
            </div>
          )}

          {activeTab === 'staff-list' && (
            <div className="space-y-6 animate-in fade-in">
               <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-[#d4a373]/20 mb-6">
                 <div className="flex-1 relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input type="text" placeholder="Search staff by name or email..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} className="w-full pl-12 p-3 bg-[#f8f5f2] border border-[#d4a373]/30 rounded-xl outline-none focus:ring-2 focus:ring-[#d4a373]" />
                 </div>
                 <div className="flex items-center gap-2">
                   <Filter size={18} className="text-[#d4a373] hidden md:block" />
                   <select value={staffRoleFilter} onChange={e => setStaffRoleFilter(e.target.value)} className="p-3 bg-[#f8f5f2] border border-[#d4a373]/30 rounded-xl outline-none font-medium focus:ring-2 focus:ring-[#d4a373]">
                     <option value="All">All Roles</option><option value="Teacher">Teacher</option><option value="Principal">Principal</option><option value="Head Teacher">Head Teacher</option><option value="Bursar">Bursar</option>
                   </select>
                 </div>
               </div>

               <div className="bg-white rounded-3xl shadow-lg border border-[#d4a373]/20 overflow-hidden">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="bg-[#2c0a0e] text-[#fcf6ba]"><tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Assigned Class</th><th className="p-4">Email</th><th className="p-4">PIN</th><th className="p-4">Action</th></tr></thead>
                     <tbody>
                       {filteredStaff.map(s => (
                         <tr key={s.id} className="border-b hover:bg-[#fcf6ba]/10 transition-colors">
                           <td className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">{s.passport_url ? <img src={s.passport_url} className="w-full h-full object-cover"/> : <span className="font-bold text-gray-400">{s.full_name ? s.full_name[0] : '?'}</span>}</div><span className="font-bold text-[#2c0a0e]">{s.full_name}</span></td>
                           <td className="p-4"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{s.role}</span></td>
                           <td className="p-4">{s.role === 'Teacher' ? <span className="bg-[#d4a373]/20 text-[#2c0a0e] px-3 py-1 rounded-full text-xs font-bold">{s.assigned_class ? `${s.assigned_class} (${s.section})` : `Subject Teacher (${s.section || 'N/A'})`}</span> : <span className="text-gray-400 text-xs italic">N/A</span>}</td>
                           <td className="p-4 text-gray-600">{s.email}</td>
                           <td className="p-4 font-mono text-gray-500">{s.password_text}</td>
                           <td className="p-4"><button onClick={() => handleDelete('staff', s.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18}/></button></td>
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
               <div className="flex flex-col xl:flex-row gap-4 bg-white p-5 rounded-2xl shadow-sm border border-[#d4a373]/20 mb-6">
                 <div className="flex-1 relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                   <input type="text" placeholder="Search by student name or admission number..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="w-full pl-12 p-3 bg-[#f8f5f2] border border-[#d4a373]/30 rounded-xl outline-none text-[#2c0a0e] focus:ring-2 focus:ring-[#d4a373] transition-all" />
                 </div>
                 <div className="flex items-center gap-3">
                   <Filter size={20} className="text-[#d4a373] hidden md:block" />
                   <select value={filterSection} onChange={e => { setFilterSection(e.target.value); setFilterClass("All"); }} className="p-3 bg-[#f8f5f2] border border-[#d4a373]/30 rounded-xl text-sm font-bold text-[#2c0a0e] outline-none cursor-pointer focus:ring-2 focus:ring-[#d4a373]">
                     <option value="All">All Sections</option><option value="Primary">Primary Section</option><option value="Secondary">Secondary Section</option>
                   </select>
                   <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-3 bg-[#f8f5f2] border border-[#d4a373]/30 rounded-xl text-sm font-bold text-[#2c0a0e] outline-none cursor-pointer focus:ring-2 focus:ring-[#d4a373]">
                     <option value="All">All Classes</option>
                     {filterSection === "All" && [...getClassOptions("Primary"), ...getClassOptions("Secondary")].map(c => <option key={c} value={c}>{c}</option>)}
                     {filterSection === "Primary" && getClassOptions("Primary").map(c => <option key={c} value={c}>{c}</option>)}
                     {filterSection === "Secondary" && getClassOptions("Secondary").map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                 {filteredStudents.length > 0 ? filteredStudents.map(s => (
                   <div key={s.id} className="bg-[#f8f5f2] border border-[#d4a373]/20 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                      <div className="flex gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-white border-2 border-[#d4a373] overflow-hidden flex-shrink-0">{s.passport_url ? <img src={s.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full font-bold text-2xl text-[#d4a373]">{s.full_name[0]}</span>}</div>
                        <div className="overflow-hidden"><h3 className="font-serif font-bold text-[#2c0a0e] truncate text-lg">{s.full_name}</h3><div className="flex gap-2 mt-1"><span className="px-2 py-0.5 bg-white border border-gray-200 text-xs font-bold rounded text-gray-600">{s.current_class}</span><span className={`px-2 py-0.5 text-xs font-bold rounded border ${s.gender === 'Male' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-pink-50 border-pink-100 text-pink-600'}`}>{s.gender || 'N/A'}</span></div></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 bg-white/50 p-3 rounded-xl mb-4 text-sm"><div><p className="text-[10px] uppercase text-gray-400 font-bold">Admission ID</p><p className="font-bold text-[#2c0a0e] truncate">{s.admission_number}</p><p className="text-[10px] text-red-500 font-bold mt-1 italic">PIN Hidden (Bursar Access)</p></div><div><p className="text-[10px] uppercase text-gray-400 font-bold">Parent</p><p className="font-bold text-[#2c0a0e]">{s.parent_phone}</p></div></div>
                      <div className="flex items-center justify-between border-t border-gray-200 pt-3"><label className="flex items-center gap-2 cursor-pointer"><div className={`w-10 h-5 rounded-full p-1 transition-colors ${s.is_active ? 'bg-green-600' : 'bg-gray-300'}`} onClick={() => toggleStudentStatus(s.id, s.is_active)}><div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${s.is_active ? 'translate-x-5' : 'translate-x-0'}`}></div></div><span className={`text-xs font-bold ${s.is_active ? 'text-green-700' : 'text-gray-500'}`}>{s.is_active ? 'Active' : 'Locked'}</span></label><button onClick={() => handleDelete('students', s.id)} className="text-red-400 hover:text-red-600 flex items-center gap-1 text-xs font-bold transition-colors"><Trash2 size={14}/> Delete</button></div>
                   </div>
                 )) : (<div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-[#d4a373]/30"><p>No students matching your filter.</p></div>)}
               </div>
             </div>
          )}

          {activeTab === 'updates' && (
            <div className="space-y-6 animate-in fade-in">
                <h1 className="text-2xl font-serif font-bold text-[#2c0a0e]">Manage News & Updates</h1>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#d4a373]/20 flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full"><label className="text-xs font-bold text-gray-400 uppercase">Title</label><input type="text" className="w-full p-3 bg-gray-50 border rounded-xl" value={newUpdate.title} onChange={e => setNewUpdate({...newUpdate, title: e.target.value})} /></div>
                    <div className="w-full md:w-48"><label className="text-xs font-bold text-gray-400 uppercase">Category</label><select className="w-full p-3 bg-gray-50 border rounded-xl" value={newUpdate.category} onChange={e => setNewUpdate({...newUpdate, category: e.target.value})}><option>Event</option><option>Holiday</option><option>Admission</option><option>News</option></select></div>
                    <div className="w-full md:w-48"><label className="text-xs font-bold text-gray-400 uppercase">Date</label><input type="date" className="w-full p-3 bg-gray-50 border rounded-xl" value={newUpdate.event_date} onChange={e => setNewUpdate({...newUpdate, event_date: e.target.value})} /></div>
                    <button onClick={postUpdate} disabled={loading} className="px-6 py-3 bg-[#2c0a0e] text-[#fcf6ba] font-bold rounded-xl hover:bg-[#540b0e] flex items-center gap-2">{loading ? 'Posting...' : <><Plus size={18}/> Post</>}</button>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-[#d4a373]/20 overflow-hidden"><table className="w-full text-left text-sm"><thead className="bg-[#2c0a0e] text-[#fcf6ba]"><tr><th className="p-4">Title</th><th className="p-4">Category</th><th className="p-4">Date</th><th className="p-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-[#d4a373]/10">{updates.map(update => (<tr key={update.id} className="hover:bg-[#fcf6ba]/20"><td className="p-4 font-bold">{update.title}</td><td className="p-4"><span className="bg-[#fcf6ba] text-[#2c0a0e] px-2 py-1 rounded text-xs font-bold">{update.category}</span></td><td className="p-4 text-gray-500">{new Date(update.event_date).toDateString()}</td><td className="p-4 text-right"><button onClick={() => deleteUpdate(update.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18}/></button></td></tr>))}</tbody></table></div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6 animate-in fade-in">
                <h1 className="text-2xl font-serif font-bold text-[#2c0a0e]">School Configuration</h1>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#d4a373]/20 max-w-2xl">
                    <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-full bg-[#2c0a0e] flex items-center justify-center text-[#fcf6ba]"><Calendar size={20}/></div><div><h3 className="font-bold text-[#2c0a0e]">Resumption Date</h3><p className="text-xs text-gray-500">Set the next term begin date for ALL students.</p></div></div>
                    <div className="space-y-4">
                        <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Current Setting</label><div className="text-lg font-bold text-[#2c0a0e]">{resumptionDate || 'Not Set'}</div></div>
                        <div className="pt-4 border-t border-gray-100"><label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Update Date</label><div className="flex gap-4"><input type="text" placeholder="e.g. January 12th, 2026" className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#d4a373] outline-none" value={newResumptionDate} onChange={(e) => setNewResumptionDate(e.target.value)} /><button onClick={updateResumptionDate} disabled={loading} className="bg-[#2c0a0e] text-[#fcf6ba] px-6 py-3 rounded-xl font-bold hover:bg-[#540b0e] transition-all disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button></div></div>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="bg-white p-8 md:p-12 text-center rounded-3xl shadow-lg border border-[#d4a373]/20 max-w-xl mx-auto animate-in fade-in">
                <Settings size={48} className="mx-auto text-[#d4a373] mb-4" />
                <h3 className="text-xl font-bold text-[#2c0a0e] mb-6">Global Settings</h3>
                <div className="space-y-4 text-left"><input value={globalSettings.session} onChange={e => setGlobalSettings({...globalSettings, session: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl" /><select value={globalSettings.term} onChange={e => setGlobalSettings({...globalSettings, term: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl"><option>1st Term</option><option>2nd Term</option><option>3rd Term</option></select><button onClick={handleUpdateSettings} className="w-full py-4 bg-[#2c0a0e] text-[#fcf6ba] font-bold rounded-xl shadow-lg hover:bg-[#540b0e]">Update</button></div>
             </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white p-8 md:p-12 text-center rounded-3xl shadow-lg border border-[#d4a373]/20 max-w-xl mx-auto animate-in fade-in">
               <div className="w-32 h-32 mx-auto bg-[#2c0a0e] rounded-full flex items-center justify-center mb-6 border-4 border-[#d4a373] overflow-hidden">
                 {proprietressProfile?.passport_url ? <img src={proprietressProfile.passport_url} className="w-full h-full object-cover"/> : <span className="text-4xl text-[#fcf6ba] font-bold">P</span>}
               </div>
               <h2 className="text-2xl font-bold text-[#2c0a0e]">{proprietressProfile?.full_name || 'Proprietress'}</h2>
               <div className="mt-6 text-left space-y-3 bg-gray-50 p-6 rounded-xl">
                 <div><p className="text-xs font-bold text-gray-500 uppercase">Email</p><p className="font-medium">{proprietressProfile?.email}</p></div>
                 <div><p className="text-xs font-bold text-gray-500 uppercase">Pass</p><p className="font-medium">{proprietressProfile?.password_text}</p></div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProprietressDashboard;