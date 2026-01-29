import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, UserPlus, LogOut, LayoutDashboard, Settings, 
  GraduationCap, Trash2, Menu, Camera, RefreshCw 
} from "lucide-react";
import schoolLogo from "/school-logo.png";
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

  // Data States
  const [stats, setStats] = useState({ students: 0, staff: 0 });
  const [staffList, setStaffList] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState({ session: '', term: '' });
  const [proprietorProfile, setProprietorProfile] = useState<any>(null);

  // Forms
  const [staffForm, setStaffForm] = useState({ 
    name: '', role: 'Teacher', email: '', password: '', section: '', assigned_class: '' 
  });
  
  const [studentForm, setStudentForm] = useState({ 
    name: '', 
    gender: '',         // <--- NEW FIELD
    admission_no: '', 
    class: '', 
    dob: '', 
    parent_phone: '', 
    parent_phone_2: '', 
    password: '' 
  });

  useEffect(() => {
    fetchStats();
    fetchSettings();
    fetchProprietorProfile();
  }, []);

  // --- AUTO-GENERATORS (STAFF) ---
  useEffect(() => {
    if (!staffForm.name) return;
    const cleanName = staffForm.name.replace(/^(Mr\.|Mrs\.|Miss\.|Mr|Mrs|Miss)\s+/i, "").trim();
    const parts = cleanName.split(" ");
    if (parts.length >= 2) {
      const firstInitial = parts[0][0].toLowerCase();
      const lastName = parts[parts.length - 1].toLowerCase();
      setStaffForm(prev => ({ ...prev, email: `${firstInitial}${lastName}@citadelschool.edu.ng` }));
    }
  }, [staffForm.name]);

  const generateStaffPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setStaffForm(prev => ({ ...prev, password: pin }));
  };

  useEffect(() => {
    if (activeTab === 'register-staff' && !staffForm.password) generateStaffPin();
  }, [activeTab]);


  // --- AUTO-GENERATORS (STUDENT) ---
  const generateStudentPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setStudentForm(prev => ({ ...prev, password: pin }));
  };

  useEffect(() => {
    if (!studentForm.class) return;

    let sectionCode = "GEN"; 
    const cls = studentForm.class;

    if (cls.includes("Creche") || cls.includes("KG")) sectionCode = "KG";
    else if (cls.includes("Pry")) sectionCode = "PRI";
    else if (cls.includes("JSS")) sectionCode = "JSS";
    else if (cls.includes("SS")) sectionCode = "SS";

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedAdm = `CKIS/${sectionCode}/${randomNum}`;

    setStudentForm(prev => ({ ...prev, admission_no: generatedAdm }));

  }, [studentForm.class]);

  useEffect(() => {
    if (activeTab === 'register-student' && !studentForm.password) generateStudentPin();
  }, [activeTab]);


  // --- API CALLS ---
  const fetchStats = async () => {
    const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: staffCount } = await supabase.from('staff').select('*', { count: 'exact', head: true });
    setStats({ students: studentCount || 0, staff: staffCount || 0 });
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('school_settings').select('*').single();
    if (data) setGlobalSettings({ session: data.current_session, term: data.current_term });
  };

  const fetchProprietorProfile = async () => {
    const { data } = await supabase.from('staff').select('*').eq('role', 'Proprietor').single();
    if (data) setProprietorProfile(data);
  };

  const fetchStaffList = async () => {
    const { data } = await supabase.from('staff').select('*').order('created_at', { ascending: false });
    if (data) setStaffList(data);
  };

  const fetchStudentList = async () => {
    const { data } = await supabase.from('students').select('*').order('created_at', { ascending: false });
    if (data) setStudentList(data);
  };

  // --- HANDLERS ---
  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const finalClass = staffForm.role === 'Teacher' ? staffForm.assigned_class : null;
      const { error } = await supabase.from('staff').insert([{
        full_name: staffForm.name,
        role: staffForm.role,
        email: staffForm.email, 
        password_text: staffForm.password,
        assigned_class: finalClass,
        section: staffForm.section
      }]);
      if (error) throw error;
      toast.success(`Staff Created: ${staffForm.name}`);
      setStaffForm({ name: '', role: 'Teacher', email: '', password: '', section: '', assigned_class: '' });
      generateStaffPin();
      fetchStats();
    } catch (error: any) { toast.error(error.message); } 
    finally { setLoading(false); }
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('students').insert([{
        full_name: studentForm.name,
        gender: studentForm.gender, // <--- SEND GENDER TO DB
        admission_number: studentForm.admission_no,
        current_class: studentForm.class,
        dob: studentForm.dob,
        parent_phone: studentForm.parent_phone,
        parent_phone_2: studentForm.parent_phone_2,
        password_text: studentForm.password
      }]);
      if (error) throw error;
      toast.success(`Student Registered: ${studentForm.admission_no}`);
      // Reset Form
      setStudentForm({ 
        name: '', gender: '', admission_no: '', class: '', dob: '', 
        parent_phone: '', parent_phone_2: '', password: '' 
      });
      generateStudentPin();
      fetchStats();
    } catch (error: any) { toast.error(error.message); } 
    finally { setLoading(false); }
  };

  const handleUpdateSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('school_settings')
        .update({ current_session: globalSettings.session, current_term: globalSettings.term })
        .neq('id', '00000000-0000-0000-0000-000000000000'); 
      if (error) throw error;
      toast.success("Settings Updated!");
    } catch (error: any) { toast.error("Failed"); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (table: 'staff' | 'students', id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      toast.success("Deleted successfully");
      if (table === 'staff') fetchStaffList(); else fetchStudentList();
      fetchStats();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    setUploading(true);
    try {
      const file = event.target.files[0];
      const filePath = `proprietor-${Math.random()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('passports').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('passports').getPublicUrl(filePath);
      await supabase.from('staff').update({ passport_url: publicUrl }).eq('role', 'Proprietor');
      setProprietorProfile({ ...proprietorProfile, passport_url: publicUrl });
      toast.success("Profile Updated");
    } catch (e) { toast.error("Upload failed"); } 
    finally { setUploading(false); }
  };

  const getClassOptions = (section: string) => {
    if (section === 'Primary') return ['Creche', 'KG 1', 'KG 2', 'KG 3', 'Pry 1', 'Pry 2', 'Pry 3', 'Pry 4', 'Pry 5'];
    if (section === 'Secondary') return ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];
    return [];
  };

  // --- SIDEBAR (Gold) ---
  const SidebarContent = () => (
    <div className="h-full flex flex-col text-[#2c0a0e]">
      {/* 1. TOP: PROFILE */}
      <div className="p-8 text-center bg-[#fcf6ba]/20 border-b border-[#2c0a0e]/10">
         <div className="relative inline-block group">
           <div className="w-24 h-24 mx-auto rounded-full border-[3px] border-[#2c0a0e] shadow-xl overflow-hidden bg-[#fcf6ba]">
             {proprietorProfile?.passport_url ? (
               <img src={proprietorProfile.passport_url} className="w-full h-full object-cover"/>
             ) : (
               <span className="flex items-center justify-center h-full text-2xl font-bold">P</span>
             )}
           </div>
           <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all text-[#fcf6ba]">
             <Camera size={20} />
             <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
           </label>
         </div>
         <h3 className="font-serif font-bold text-lg mt-3 truncate">{proprietorProfile?.full_name || 'Proprietor'}</h3>
         <span className="text-[10px] font-black uppercase tracking-widest text-[#540b0e]">Owner</span>
      </div>

      {/* 2. MIDDLE: NAV */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'register-staff', label: 'Register Staff', icon: UserPlus },
          { id: 'register-student', label: 'Register Student', icon: GraduationCap },
          { id: 'staff-list', label: 'Staff Database', icon: Users },
          { id: 'student-list', label: 'Student Database', icon: Users },
          { id: 'settings', label: 'Global Settings', icon: Settings },
          { id: 'profile', label: 'My Profile', icon: Users },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); if(item.id==='staff-list') fetchStaffList(); if(item.id==='student-list') fetchStudentList(); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
              activeTab === item.id 
              ? 'bg-[#2c0a0e] text-[#fcf6ba] shadow-lg translate-x-1' 
              : 'hover:bg-[#2c0a0e]/10 text-[#2c0a0e]'
            }`}
          >
            <item.icon size={18} /> {item.label}
          </button>
        ))}
      </nav>

      {/* 3. BOTTOM: LOGO */}
      <div className="p-6 bg-[#2c0a0e]/5 mt-auto border-t border-[#2c0a0e]/10">
        <div className="flex items-center gap-3 mb-4 opacity-80">
          <img src={schoolLogo} className="w-8 h-8 opacity-80" />
          <div>
            <h4 className="font-serif font-bold text-sm leading-none">Citadel</h4>
            <p className="text-[9px] uppercase tracking-wider">School Portal</p>
          </div>
        </div>
        <button onClick={() => { navigate('/'); }} className="w-full py-3 bg-[#540b0e] hover:bg-[#2c0a0e] text-[#fcf6ba] rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-md">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f5f2] font-sans flex">
      <SEO 
        title="Citadel School of Excellence | Best School in Oko Erin, Kwara"
        description="Enroll at Citadel School, the leading primary and secondary school in Oko Erin, Kwara State. We offer world-class education, modern facilities, and a moral foundation for your child."
      />
      <aside className="hidden lg:flex w-72 flex-col z-20 shadow-2xl sticky top-0 h-screen bg-gradient-to-b from-[#bf953f] via-[#fcf6ba] to-[#b38728] border-r border-[#b38728]">
        <SidebarContent />
      </aside>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72 border-r border-[#b38728] bg-gradient-to-b from-[#bf953f] via-[#fcf6ba] to-[#b38728]">
           <SidebarContent />
        </SheetContent>
      </Sheet>

      <main className="flex-1 h-screen overflow-y-auto">
        <header className="lg:hidden p-4 bg-[#fcf6ba] border-b border-[#b38728] flex justify-between items-center sticky top-0 z-20">
          <button onClick={() => setIsMobileMenuOpen(true)}><Menu className="text-[#2c0a0e]" /></button>
          <span className="font-serif font-bold text-[#2c0a0e]">Proprietor Portal</span>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-[#d4af37]/20">
                <h3 className="text-5xl font-bold text-[#2c0a0e] mb-1">{stats.students}</h3>
                <p className="text-[#8b5e3c] font-medium text-sm uppercase tracking-wide">Total Students</p>
              </div>
              <div className="bg-[#2c0a0e] p-8 rounded-[2rem] shadow-xl">
                <h3 className="text-5xl font-bold text-[#fcf6ba] mb-1">{stats.staff}</h3>
                <p className="text-[#fcf6ba]/70 font-medium text-sm uppercase tracking-wide">Total Staff</p>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER STAFF */}
          {activeTab === 'register-staff' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-[#d4af37]/20 max-w-2xl animate-in fade-in">
              <h2 className="text-2xl font-serif font-bold text-[#2c0a0e] mb-6">Register New Staff</h2>
              <form onSubmit={handleRegisterStaff} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-sm font-bold text-[#2c0a0e]">Full Name</label><input required type="text" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4af37]" placeholder="Mr. Name" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-[#2c0a0e]">Role</label><select value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4af37]"><option>Teacher</option><option>Principal</option><option>Head Teacher</option><option>Bursar</option></select></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-[#2c0a0e]">Email (Auto)</label><input readOnly value={staffForm.email} className="w-full p-3 bg-gray-100 rounded-xl border border-gray-200 text-gray-500" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-[#2c0a0e]">PIN (Auto)</label><div className="flex gap-2"><input readOnly value={staffForm.password} className="w-full p-3 bg-gray-100 rounded-xl border border-gray-200 font-bold tracking-widest text-center" /><button type="button" onClick={generateStaffPin} className="p-3 bg-[#2c0a0e] text-[#fcf6ba] rounded-xl"><RefreshCw size={20}/></button></div></div>
                  {staffForm.role === 'Teacher' && (
                    <>
                      <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-[#2c0a0e]">Section</label><select required value={staffForm.section} onChange={e => setStaffForm({...staffForm, section: e.target.value, assigned_class: ''})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4af37]"><option value="">-- Select --</option><option value="Primary">Primary</option><option value="Secondary">Secondary</option></select></div>
                      <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-[#2c0a0e]">Assign Class</label><select required value={staffForm.assigned_class} onChange={e => setStaffForm({...staffForm, assigned_class: e.target.value})} disabled={!staffForm.section} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4af37]"><option value="">-- Select --</option>{getClassOptions(staffForm.section).map(c => <option key={c}>{c}</option>)}</select></div>
                    </>
                  )}
                </div>
                <button disabled={loading} type="submit" className="w-full py-4 bg-[#2c0a0e] text-[#fcf6ba] font-bold rounded-xl shadow-lg hover:bg-[#540b0e]">{loading ? 'Creating...' : 'Create Account'}</button>
              </form>
            </div>
          )}

          {/* TAB 3: REGISTER STUDENT (UPDATED WITH GENDER) */}
          {activeTab === 'register-student' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-[#d4af37]/20 max-w-2xl animate-in fade-in">
              <h2 className="text-2xl font-serif font-bold text-[#2c0a0e] mb-6">Register Student</h2>
              <form onSubmit={handleRegisterStudent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Name */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-[#2c0a0e]">Full Name</label>
                    <input required type="text" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4af37]" />
                  </div>

                  {/* Gender (New) */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#2c0a0e]">Gender</label>
                    <select required value={studentForm.gender} onChange={e => setStudentForm({...studentForm, gender: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4af37]">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#2c0a0e]">Date of Birth</label>
                    <input required type="date" value={studentForm.dob} onChange={e => setStudentForm({...studentForm, dob: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4af37]" />
                  </div>

                  {/* Class */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#2c0a0e]">Class</label>
                    <select required value={studentForm.class} onChange={e => setStudentForm({...studentForm, class: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4af37]">
                      <option value="">Select Class</option>
                      <optgroup label="Primary">{getClassOptions('Primary').map(c => <option key={c}>{c}</option>)}</optgroup>
                      <optgroup label="Secondary">{getClassOptions('Secondary').map(c => <option key={c}>{c}</option>)}</optgroup>
                    </select>
                  </div>

                  {/* Admission No */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#2c0a0e]">Admission No (Auto)</label>
                    <input readOnly value={studentForm.admission_no} className="w-full p-3 bg-gray-100 rounded-xl border border-gray-200 text-gray-600 font-mono font-bold" placeholder="Select Class First" />
                  </div>

                  {/* PIN */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-[#2c0a0e]">Password PIN (Auto)</label>
                    <div className="flex gap-2">
                      <input readOnly value={studentForm.password} className="w-full p-3 bg-gray-100 rounded-xl border border-gray-200 font-bold tracking-widest text-center" />
                      <button type="button" onClick={generateStudentPin} className="p-3 bg-[#2c0a0e] text-[#fcf6ba] rounded-xl"><RefreshCw size={20}/></button>
                    </div>
                  </div>

                  {/* Phone 1 */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#2c0a0e]">Parent Phone 1</label>
                    <input required type="tel" value={studentForm.parent_phone} onChange={e => setStudentForm({...studentForm, parent_phone: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4af37]" placeholder="080..." />
                  </div>

                  {/* Phone 2 */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#2c0a0e]">Parent Phone 2</label>
                    <input type="tel" value={studentForm.parent_phone_2} onChange={e => setStudentForm({...studentForm, parent_phone_2: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4af37]" placeholder="080..." />
                  </div>
                </div>
                <button disabled={loading} type="submit" className="w-full py-4 bg-[#d4af37] text-[#2c0a0e] font-bold rounded-xl shadow-lg hover:bg-[#b38728]">{loading ? 'Registering...' : 'Register Student'}</button>
              </form>
            </div>
          )}

          {/* TAB 4: STAFF LIST */}
          {activeTab === 'staff-list' && (
            <div className="bg-white rounded-3xl shadow-lg border border-[#d4af37]/20 overflow-hidden animate-in fade-in">
               <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-[#2c0a0e] text-[#fcf6ba]"><tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Email</th><th className="p-4">PIN</th><th className="p-4">Action</th></tr></thead><tbody>{staffList.map(s => (<tr key={s.id} className="border-b"><td className="p-4">{s.full_name}</td><td className="p-4">{s.role}</td><td className="p-4">{s.email}</td><td className="p-4 font-mono">{s.password_text}</td><td className="p-4"><button onClick={() => handleDelete('staff', s.id)} className="text-red-600"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div>
            </div>
          )}

          {/* TAB 5: STUDENT LIST */}
          {activeTab === 'student-list' && (
             <div className="bg-white rounded-3xl shadow-lg border border-[#d4af37]/20 overflow-hidden animate-in fade-in">
               <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-[#2c0a0e] text-[#fcf6ba]"><tr><th className="p-4">Name</th><th className="p-4">Adm No</th><th className="p-4">Class</th><th className="p-4">Phone</th><th className="p-4">Pwd</th><th className="p-4">Action</th></tr></thead><tbody>{studentList.map(s => (<tr key={s.id} className="border-b"><td className="p-4">{s.full_name}</td><td className="p-4">{s.admission_number}</td><td className="p-4">{s.current_class}</td><td className="p-4">{s.parent_phone}</td><td className="p-4">{s.password_text}</td><td className="p-4"><button onClick={() => handleDelete('students', s.id)} className="text-red-600"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div>
             </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
             <div className="bg-white p-8 md:p-12 text-center rounded-3xl shadow-lg border border-[#d4af37]/20 max-w-xl mx-auto animate-in fade-in">
                <Settings size={48} className="mx-auto text-[#d4af37] mb-4" />
                <h3 className="text-xl font-bold text-[#2c0a0e] mb-6">Global Settings</h3>
                <div className="space-y-4 text-left"><input value={globalSettings.session} onChange={e => setGlobalSettings({...globalSettings, session: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl" /><select value={globalSettings.term} onChange={e => setGlobalSettings({...globalSettings, term: e.target.value})} className="w-full p-3 bg-[#f8f5f2] rounded-xl"><option>1st Term</option><option>2nd Term</option><option>3rd Term</option></select><button onClick={handleUpdateSettings} className="w-full py-4 bg-[#2c0a0e] text-[#fcf6ba] font-bold rounded-xl shadow-lg hover:bg-[#540b0e]">Update</button></div>
             </div>
          )}

          {/* TAB 7: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white p-8 md:p-12 text-center rounded-3xl shadow-lg border border-[#d4af37]/20 max-w-xl mx-auto animate-in fade-in">
               <div className="w-32 h-32 mx-auto bg-[#2c0a0e] rounded-full flex items-center justify-center mb-6 border-4 border-[#d4af37] overflow-hidden">
                 {proprietorProfile?.passport_url ? <img src={proprietorProfile.passport_url} className="w-full h-full object-cover"/> : <span className="text-4xl text-[#fcf6ba] font-bold">P</span>}
               </div>
               <h2 className="text-2xl font-bold text-[#2c0a0e]">{proprietorProfile?.full_name || 'Proprietor'}</h2>
               <div className="mt-6 text-left space-y-3 bg-gray-50 p-6 rounded-xl">
                 <div><p className="text-xs font-bold text-gray-500 uppercase">Email</p><p className="font-medium">{proprietorProfile?.email}</p></div>
                 <div><p className="text-xs font-bold text-gray-500 uppercase">Pass</p><p className="font-medium">{proprietorProfile?.password_text}</p></div>
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default ProprietorDashboard;