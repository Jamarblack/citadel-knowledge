import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, LayoutDashboard, ArrowUpCircle, Users, GraduationCap, 
  FileCheck, User, Menu, Camera 
} from "lucide-react";
import schoolLogo from "/school-logo.png";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SEO from "@/components/SEO";

const PrincipalDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  
  // Data States
  const [stats, setStats] = useState({ staff: 0, students: 0 });
  const [staffList, setStaffList] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  
  // Promotion State
  const [promoFromClass, setPromoFromClass] = useState("");
  const [promoToClass, setPromoToClass] = useState("");
  const [promoStudents, setPromoStudents] = useState<any[]>([]);

  // Approval State
  const [approvalClass, setApprovalClass] = useState("");
  const [approvalSubject, setApprovalSubject] = useState("");
  const [pendingResults, setPendingResults] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const secondaryClasses = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];

  useEffect(() => {
    const id = localStorage.getItem('staffId');
    if (!id) navigate('/');
    fetchProfile(id!);
    fetchStats();
    fetchSubjects();
  }, []);

  // --- FETCHING LOGIC ---
  const fetchProfile = async (id: string) => {
    const { data } = await supabase.from('staff').select('*').eq('id', id).single();
    if (data) setAdminProfile(data);
  };

  const fetchStats = async () => {
    const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).in('current_class', secondaryClasses);
    const { count: tCount } = await supabase.from('staff').select('*', { count: 'exact', head: true }).eq('section', 'Secondary');
    setStats({ students: sCount || 0, staff: tCount || 0 });
  };

  const fetchStaffList = async () => {
    setLoading(true);
    const { data } = await supabase.from('staff').select('*').eq('section', 'Secondary').order('full_name');
    if (data) setStaffList(data);
    setLoading(false);
  };

  const fetchStudentList = async () => {
    setLoading(true);
    const { data } = await supabase.from('students').select('*').in('current_class', secondaryClasses).order('current_class');
    if (data) setStudentList(data);
    setLoading(false);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').order('name');
    if (data) setSubjects(data || []);
  };

  // --- PROMOTION LOGIC ---
  const loadPromoStudents = async () => {
    if (!promoFromClass) return;
    setLoading(true);
    const { data } = await supabase.from('students').select('*').eq('current_class', promoFromClass).order('full_name');
    setPromoStudents(data || []);
    setLoading(false);
  };

  const handlePromote = async () => {
    if (!promoToClass || promoStudents.length === 0) return;
    if (!confirm(`Promote ${promoStudents.length} students to ${promoToClass}?`)) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('students').update({ current_class: promoToClass }).eq('current_class', promoFromClass);
      if (error) throw error;
      toast.success("Students Promoted Successfully!");
      setPromoStudents([]); setPromoFromClass(""); setPromoToClass(""); fetchStats();
    } catch (e: any) { toast.error("Promotion failed: " + e.message); } 
    finally { setLoading(false); }
  };

  // --- APPROVAL LOGIC ---
  const loadApprovalSheet = async () => {
    if (!approvalClass || !approvalSubject) return;
    setLoading(true);
    const { data } = await supabase.from('results').select('*').eq('class_name', approvalClass).eq('subject', approvalSubject);
    setPendingResults(data || []);
    setLoading(false);
  };

  const handleApprove = async (status: 'approved' | 'rejected') => {
    if (!confirm(`Mark all as ${status}?`)) return;
    const { error } = await supabase.from('results').update({ status }).eq('class_name', approvalClass).eq('subject', approvalSubject);
    if (error) toast.error("Failed"); else { toast.success(`Results ${status}`); loadApprovalSheet(); }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];
    const filePath = `principal-${Math.random()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('passports').upload(filePath, file);
    if (error) return toast.error("Upload failed");
    const { data: { publicUrl } } = supabase.storage.from('passports').getPublicUrl(filePath);
    await supabase.from('staff').update({ passport_url: publicUrl }).eq('id', adminProfile.id);
    setAdminProfile({ ...adminProfile, passport_url: publicUrl });
    toast.success("Profile Updated");
  };

  // --- SIDEBAR ---
  const SidebarContent = () => (
    <div className="h-full flex flex-col text-white">
      {/* 1. TOP: PROFILE */}
      <div className="p-8 text-center bg-[#172554] border-b border-blue-800">
         <div className="relative inline-block group">
           <div className="w-24 h-24 mx-auto rounded-full border-[3px] border-blue-200 shadow-xl overflow-hidden bg-[#1e3a8a]">
             {adminProfile?.passport_url ? (
               <img src={adminProfile.passport_url} className="w-full h-full object-cover"/>
             ) : (
               <User className="w-full h-full p-5 text-blue-200"/>
             )}
           </div>
           <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
             <Camera size={20} />
             <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
           </label>
         </div>
         <h3 className="font-bold text-lg mt-3 truncate">{adminProfile?.full_name || 'Principal'}</h3>
         <span className="text-[10px] bg-blue-500/30 px-3 py-0.5 rounded-full uppercase tracking-wider">Secondary Head</span>
      </div>

      {/* 2. MIDDLE: NAV */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {[
          { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'promotion', label: 'Promotion', icon: ArrowUpCircle },
          { id: 'staff', label: 'Secondary Staff', icon: Users },
          { id: 'students', label: 'Secondary Students', icon: GraduationCap },
          { id: 'approvals', label: 'Approve Results', icon: FileCheck },
          { id: 'profile', label: 'My Profile', icon: User },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); if(item.id==='staff') fetchStaffList(); if(item.id==='students') fetchStudentList(); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
              activeTab === item.id 
              ? 'bg-white text-[#1e3a8a] shadow-lg translate-x-1' 
              : 'hover:bg-white/10'
            }`}
          >
            <item.icon size={20} /> {item.label}
          </button>
        ))}
      </nav>

      {/* 3. BOTTOM: LOGO & LOGOUT */}
      <div className="p-6 bg-[#0f172a]/30 mt-auto border-t border-blue-800/50">
        <div className="flex items-center gap-3 mb-4 opacity-80">
          <img src={schoolLogo} className="w-8 h-8 invert brightness-0" />
          <div>
            <h4 className="font-bold text-sm leading-none">Citadel</h4>
            <p className="text-[9px] uppercase tracking-wider opacity-70">School Portal</p>
          </div>
        </div>
        <button 
          onClick={() => { localStorage.clear(); navigate('/'); }} 
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-md"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
        <SEO 
        title="Citadel School of Excellence | Best School in Oko Erin, Kwara"
        description="Enroll at Citadel School, the leading primary and secondary school in Oko Erin, Kwara State. We offer world-class education, modern facilities, and a moral foundation for your child."
      />
      <aside className="hidden lg:block w-72 bg-[#1e3a8a] shadow-xl sticky top-0 h-screen z-30">
        <SidebarContent />
      </aside>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-[#1e3a8a] border-none"><SidebarContent /></SheetContent>
      </Sheet>

      <main className="flex-1 h-screen overflow-y-auto">
        {/* Mobile Header */}
        <header className="lg:hidden p-4 bg-white border-b flex justify-between items-center sticky top-0 z-20">
          <button onClick={() => setIsMobileMenuOpen(true)}><Menu className="text-[#1e3a8a]" /></button>
          <span className="font-bold text-[#1e3a8a] text-lg">Principal Portal</span>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in">
              <h1 className="text-2xl font-bold text-gray-800">Overview</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100">
                  <p className="text-gray-500 font-medium">Secondary Students</p>
                  <h3 className="text-4xl font-bold text-[#1e3a8a] mt-2">{stats.students}</h3>
                </div>
                <div className="bg-[#1e3a8a] p-8 rounded-2xl shadow-lg text-white">
                  <p className="text-blue-100 font-medium">Secondary Staff</p>
                  <h3 className="text-4xl font-bold mt-2">{stats.staff}</h3>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROMOTION */}
          {activeTab === 'promotion' && (
             <div className="space-y-6 animate-in fade-in">
               <h1 className="text-2xl font-bold text-gray-800">Promote Students</h1>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
                   <div className="space-y-2"><label className="text-sm font-bold text-gray-600">From Class</label><select className="w-full p-3 bg-gray-50 border rounded-xl" value={promoFromClass} onChange={e => setPromoFromClass(e.target.value)}><option value="">Select</option>{secondaryClasses.map(c => <option key={c}>{c}</option>)}</select></div>
                   <div className="space-y-2"><label className="text-sm font-bold text-gray-600">To Class</label><select className="w-full p-3 bg-gray-50 border rounded-xl" value={promoToClass} onChange={e => setPromoToClass(e.target.value)}><option value="">Select</option>{secondaryClasses.map(c => <option key={c}>{c}</option>)}<option value="Graduated">Graduated</option></select></div>
                   <button onClick={loadPromoStudents} className="p-3 bg-gray-800 text-white rounded-xl font-bold">Load Students</button>
                 </div>
                 {promoStudents.length > 0 && (
                   <div>
                     <div className="p-4 bg-blue-50 text-blue-800 rounded-xl mb-4 flex justify-between items-center"><span>Found <b>{promoStudents.length}</b> students</span><button onClick={handlePromote} disabled={loading} className="px-6 py-2 bg-[#1e3a8a] text-white font-bold rounded-lg hover:bg-blue-800">{loading?'Processing...':'Promote All'}</button></div>
                     <div className="max-h-96 overflow-y-auto border rounded-xl"><table className="w-full text-left"><thead className="bg-gray-100 sticky top-0"><tr><th className="p-3">Name</th><th className="p-3">Admission No</th></tr></thead><tbody>{promoStudents.map(s => (<tr key={s.id} className="border-b"><td className="p-3">{s.full_name}</td><td className="p-3 font-mono text-xs">{s.admission_number}</td></tr>))}</tbody></table></div>
                   </div>
                 )}
               </div>
             </div>
          )}

          {/* TAB 3: STAFF LIST */}
          {activeTab === 'staff' && (
            <div className="space-y-6 animate-in fade-in">
               <h1 className="text-2xl font-bold text-gray-800">Secondary Staff</h1>
               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"><table className="w-full text-left"><thead className="bg-[#1e3a8a] text-white"><tr><th className="p-4">Staff</th><th className="p-4">Role</th><th className="p-4">Contact</th></tr></thead><tbody>{staffList.map(s => (<tr key={s.id} className="border-b hover:bg-gray-50"><td className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">{s.passport_url?<img src={s.passport_url} className="w-full h-full object-cover"/>:<span className="flex items-center justify-center h-full font-bold text-gray-500">{s.full_name[0]}</span>}</div><div><p className="font-bold">{s.full_name}</p><p className="text-xs text-gray-500">{s.email}</p></div></td><td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{s.role}</span></td><td className="p-4 font-mono text-sm">{s.password_text}</td></tr>))}</tbody></table></div>
            </div>
          )}

          {/* TAB 4: STUDENT LIST */}
          {activeTab === 'students' && (
            <div className="space-y-6 animate-in fade-in">
               <h1 className="text-2xl font-bold text-gray-800">Secondary Students</h1>
               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"><table className="w-full text-left"><thead className="bg-[#1e3a8a] text-white"><tr><th className="p-4">Student</th><th className="p-4">Class</th><th className="p-4">Admission</th></tr></thead><tbody>{studentList.map(s => (<tr key={s.id} className="border-b hover:bg-gray-50"><td className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">{s.passport_url?<img src={s.passport_url} className="w-full h-full object-cover"/>:<span className="flex items-center justify-center h-full font-bold text-gray-500">{s.full_name[0]}</span>}</div><span className="font-bold">{s.full_name}</span></td><td className="p-4">{s.current_class}</td><td className="p-4 font-mono text-sm">{s.admission_number}</td></tr>))}</tbody></table></div>
            </div>
          )}

          {/* TAB 5: APPROVALS */}
          {activeTab === 'approvals' && (
            <div className="space-y-6 animate-in fade-in">
               <h1 className="text-2xl font-bold text-gray-800">Result Approvals</h1>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex flex-col md:flex-row gap-4 mb-6"><select className="p-3 border rounded-xl" value={approvalClass} onChange={e => setApprovalClass(e.target.value)}><option value="">Select Class</option>{secondaryClasses.map(c => <option key={c}>{c}</option>)}</select><select className="p-3 border rounded-xl" value={approvalSubject} onChange={e => setApprovalSubject(e.target.value)}><option value="">Select Subject</option>{subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select><button onClick={loadApprovalSheet} className="p-3 bg-[#1e3a8a] text-white font-bold rounded-xl">Fetch</button></div>
                  {pendingResults.length > 0 ? (<div><div className="flex gap-4 mb-4"><button onClick={() => handleApprove('approved')} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Approve Sheet</button><button onClick={() => handleApprove('rejected')} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Reject Sheet</button></div><table className="w-full text-left text-sm"><thead className="bg-gray-100"><tr><th className="p-3">Student</th><th className="p-3">Total Score</th><th className="p-3">Status</th></tr></thead><tbody>{pendingResults.map(r => (<tr key={r.id} className="border-b"><td className="p-3">{r.student_name}</td><td className="p-3 font-bold">{r.total_score}</td><td className="p-3 uppercase text-xs font-bold">{r.status}</td></tr>))}</tbody></table></div>) : <p className="text-gray-400 text-center py-10">Select a Class & Subject.</p>}
               </div>
            </div>
          )}

          {/* TAB 6: PROFILE */}
          {activeTab === 'profile' && adminProfile && (
            <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-lg border border-gray-200 text-center animate-in zoom-in-95">
               <div className="relative inline-block mb-6 group"><div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-[#1e3a8a]">{adminProfile.passport_url ? <img src={adminProfile.passport_url} className="w-full h-full object-cover"/> : <User className="w-full h-full p-6 text-white"/>}</div><label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all text-white font-bold"><Camera size={24} /> Upload<input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} /></label></div><h2 className="text-2xl font-bold text-gray-800">{adminProfile.full_name}</h2><p className="text-blue-600 font-medium mb-6">Principal</p><div className="text-left space-y-4 bg-gray-50 p-6 rounded-2xl"><div><p className="text-xs text-gray-500 uppercase">Email</p><p className="font-bold">{adminProfile.email}</p></div><div><p className="text-xs text-gray-500 uppercase">Password PIN</p><p className="font-bold tracking-widest">{adminProfile.password_text}</p></div></div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PrincipalDashboard;