import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, LayoutDashboard, Wallet, Users, History, 
  Search, Menu, Camera, CheckCircle, Filter, 
  Key, FileText, X, User
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SEO from "@/components/SEO";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "/school-logo.png";

const CLASS_ARMS: Record<string, string[]> = {
  "Pre-KG": [],
  "KG 1": ["Gold", "Diamond", "Silver"],
  "KG 2": ["Candy", "Chocolate", "Strawberry"],
  "KG 3": ["Rose", "Vanilla", "Sweet"],
  "Pry 1": ["Greatness", "Glorious", "Progress"],
  "Pry 2": ["Mars", "Jupiter", "Mercury"],
  "Pry 3": ["Pluto", "Neptune", "Uranus"],
  "Pry 4": ["South America", "North America", "Africa", "Europe"],
  "Pry 5": ["Asia", "Antarctica"]
};

const BursarDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [bursarProfile, setBursarProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Data
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [totalDaily, setTotalDaily] = useState(0);

  // Filters
  const [filterSection, setFilterSection] = useState("All");
  const [filterClass, setFilterClass] = useState("All");

  // Payment Form
  const [searchQuery, setSearchQuery] = useState("");
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '', purpose: 'Tuition Fee', method: 'Cash', session: '2025/2026', term: '1st Term'
  });

  useEffect(() => {
    const id = localStorage.getItem('staffId');
    if (!id) navigate('/');
    fetchProfile(id!);
    fetchDailyStats();
    fetchRecentPayments();
    fetchStudentList();
  }, []);

  const fetchProfile = async (id: string) => {
    const { data } = await supabase.from('staff').select('*').eq('id', id).single();
    if (data) setBursarProfile(data);
  };

  const fetchDailyStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('payments').select('amount_paid').gte('created_at', `${today}T00:00:00`);
    const total = data?.reduce((acc, curr) => acc + Number(curr.amount_paid), 0) || 0;
    setTotalDaily(total);
  };

  const fetchRecentPayments = async () => {
    const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(50);
    setRecentPayments(data || []);
  };

  const fetchStudentList = async () => {
    const { data } = await supabase.from('students').select('*').order('created_at', { ascending: false });
    setStudentList(data || []);
  };

  const toggleStudentStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('students').update({ is_active: !currentStatus }).eq('id', id);
    if (error) toast.error("Failed to update status");
    else {
      toast.success(currentStatus ? "Access Restricted" : "Access Granted");
      fetchStudentList();
    }
  };

  const getClassOptions = (section: string) => {
    if (section === 'Primary') {
      const allPrimaryClasses: string[] = ['Creche', 'Pre-KG'];
      Object.entries(CLASS_ARMS).forEach(([base, arms]) => {
        if(base !== "Pre-KG") {
          arms.forEach(arm => {
            allPrimaryClasses.push(`${base} ${arm}`);
          });
        }
      });
      return allPrimaryClasses;
    }
    if (section === 'Secondary') return ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];
    return [];
  };

  const filteredStudents = studentList.filter(student => {
    if (filterSection !== "All") {
      const isPrimary = student.current_class.includes("Creche") || student.current_class.includes("KG") || student.current_class.includes("Primary") || student.current_class.includes("Pry");
      const isSecondary = student.current_class.includes("JSS") || student.current_class.includes("SS");
      if (filterSection === "Primary" && !isPrimary) return false;
      if (filterSection === "Secondary" && !isSecondary) return false;
    }
    if (filterClass !== "All" && student.current_class !== filterClass) return false;
    return true;
  });

  const handleSearchStudent = async () => {
    if (!searchQuery) return;
    setLoading(true);
    const { data, error } = await supabase.from('students').select('*').or(`admission_number.eq.${searchQuery},full_name.ilike.%${searchQuery}%`).limit(1);
    if (error || !data || data.length === 0) { toast.error("Student not found"); setFoundStudent(null); }
    else { setFoundStudent(data[0]); toast.success(`Found: ${data[0].full_name}`); }
    setLoading(false);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundStudent) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('payments').insert([{
        student_id: foundStudent.id,
        student_name: foundStudent.full_name,
        admission_number: foundStudent.admission_number,
        amount_paid: paymentForm.amount,
        purpose: paymentForm.purpose,
        payment_method: paymentForm.method,
        session: paymentForm.session,
        term: paymentForm.term,
        recorded_by: bursarProfile?.full_name || 'Bursar'
      }]);
      if (error) throw error;
      toast.success("Payment Recorded!");
      setPaymentForm({ ...paymentForm, amount: '' });
      setFoundStudent(null); setSearchQuery('');
      fetchDailyStats(); fetchRecentPayments();
    } catch (e: any) { toast.error("Error: " + e.message); } finally { setLoading(false); }
  };

  const downloadHistoryPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Citadel School - Payment History", 14, 22);
    doc.setFontSize(11); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Student', 'Purpose', 'Amount', 'Method']],
      body: recentPayments.map(p => [new Date(p.created_at).toLocaleDateString(), p.student_name, p.purpose, `N${Number(p.amount_paid).toLocaleString()}`, p.payment_method]),
    });
    doc.save(`citadel_transactions_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    setUploading(true);
    try {
        const file = event.target.files[0];
        const filePath = `bursar-${Math.random()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('passports').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('passports').getPublicUrl(filePath);
        const { error: updateError } = await supabase.from('staff').update({ passport_url: publicUrl }).eq('id', bursarProfile.id);
        if (updateError) throw updateError;
        setBursarProfile({ ...bursarProfile, passport_url: publicUrl });
        toast.success("Profile Photo Updated");
    } catch (e: any) { toast.error("Upload failed: " + e.message); } finally { setUploading(false); }
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col text-white bg-black">
      <div className="p-8 text-center border-b border-gray-800">
         <div className="relative inline-block group">
            <div className="w-24 h-24 mx-auto rounded-full border-4 border-[#FFD700] shadow-xl overflow-hidden bg-white">
                {bursarProfile?.passport_url ? <img src={bursarProfile.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-4xl font-black text-red-600">B</span>}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                <Camera size={20} className="text-[#FFD700]" />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
            </label>
         </div>
         <h3 className="font-black text-lg mt-4 truncate text-white">{bursarProfile?.full_name || 'Bursar'}</h3>
         <span className="text-[10px] bg-red-600 text-white font-bold px-3 py-1 rounded-full uppercase tracking-widest mt-2 inline-block">Financial Officer</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'view-pins', label: 'View PINs', icon: Key },
          { id: 'new-payment', label: 'Record Payment', icon: Wallet },
          { id: 'students', label: 'Manage Access', icon: Users },
          { id: 'history', label: 'History', icon: History },
          { id: 'profile', label: 'My Profile', icon: User },
        ].map(item => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold transition-all ${activeTab === item.id ? 'bg-[#FFD700] text-black shadow-lg translate-x-2' : 'text-gray-400 hover:bg-gray-900 hover:text-white'}`}>
            <item.icon size={20} /> {item.label}
          </button>
        ))}
      </nav>
      <div className="p-6 bg-gray-900 mt-auto border-t border-gray-800">
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2 font-black transition-all shadow-md uppercase tracking-wider"><LogOut size={18} /> Logout</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans selection:bg-yellow-300 selection:text-black">
      <SEO title="Bursar Portal | Citadel" description="Financial Management" noindex={true} />
      
      <aside className="hidden lg:block w-72 bg-black shadow-2xl sticky top-0 h-screen z-30"><SidebarContent /></aside>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}><SheetContent side="left" className="p-0 w-72 bg-black border-none"><SidebarContent /></SheetContent></Sheet>

      <main className="flex-1 h-[calc(100vh-76px)] lg:h-screen overflow-y-auto">
        <header className="lg:hidden p-4 bg-[#FFD700] border-b-4 border-black flex justify-between items-center sticky top-0 z-20 shadow-md">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-black hover:bg-yellow-300 rounded-lg"><Menu size={24} /></button>
          <span className="font-black text-black tracking-wide uppercase flex items-center"> <img src={logo} alt="Logo" className="w-8 h-8 inline rounded-full mr-2 border-2 border-red-600" /> Bursary</span>
        </header>

        <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Financial Overview</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border-l-4 border-red-600">
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Income Today</p>
                  <h3 className="text-4xl font-black text-black mt-2">₦{totalDaily.toLocaleString()}</h3>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'view-pins' && (
             <div className="space-y-6 animate-in fade-in">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <h1 className="text-3xl font-black text-gray-900 tracking-tight">Student Access PINs</h1>
                 <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <select value={filterSection} onChange={e => { setFilterSection(e.target.value); setFilterClass("All"); }} className="p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#FFD700]"><option value="All">All Sections</option><option value="Primary">Primary</option><option value="Secondary">Secondary</option></select>
                    <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#FFD700]"><option value="All">All Classes</option>{filterSection === "All" && [...getClassOptions("Primary"), ...getClassOptions("Secondary")].map(c => <option key={c}>{c}</option>)}{filterSection === "Primary" && getClassOptions("Primary").map(c => <option key={c}>{c}</option>)}{filterSection === "Secondary" && getClassOptions("Secondary").map(c => <option key={c}>{c}</option>)}</select>
                 </div>
               </div>
               
               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left min-w-[600px]">
                     <thead className="bg-black text-[#FFD700]"><tr><th className="p-4 font-black uppercase tracking-wider text-xs">Student</th><th className="p-4 font-black uppercase tracking-wider text-xs">Class</th><th className="p-4 font-black uppercase tracking-wider text-xs text-center">Access PIN</th></tr></thead>
                     <tbody className="divide-y divide-gray-100">
                       {filteredStudents.length > 0 ? filteredStudents.map(s => {
                         return (
                           <tr key={s.id} className="hover:bg-yellow-50 transition-colors">
                             <td className="p-4 font-bold text-gray-900">{s.full_name} <br/> <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">{s.admission_number}</span></td>
                             <td className="p-4 font-medium text-gray-700">{s.current_class}</td>
                             <td className="p-4 font-mono font-black text-xl text-center text-red-600 tracking-widest bg-gray-50">{s.password_text || 'N/A'}</td>
                           </tr>
                         );
                       }) : (<tr><td colSpan={3} className="p-8 text-center text-gray-400 font-medium">No students found.</td></tr>)}
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'new-payment' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
               <h1 className="text-3xl font-black text-gray-900 tracking-tight">Record Payment</h1>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                 <div className="flex gap-2">
                    <input type="text" className="flex-1 p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FFD700] font-medium" placeholder="Admission No or Name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    <button onClick={handleSearchStudent} disabled={loading} className="px-6 bg-black text-[#FFD700] rounded-xl hover:bg-gray-800 transition-colors shadow-md"><Search size={18} /></button>
                 </div>
                 {foundStudent && (<div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold">{foundStudent.full_name[0]}</div><div><h3 className="font-bold text-green-900">{foundStudent.full_name}</h3><p className="text-xs text-green-700 font-bold uppercase tracking-wider">{foundStudent.current_class} | {foundStudent.admission_number}</p></div><CheckCircle className="ml-auto text-green-600" /></div>)}
               </div>
               {foundStudent && (
                 <form onSubmit={handleRecordPayment} className="bg-white p-6 rounded-2xl shadow-lg border-t-8 border-black space-y-4 animate-in slide-in-from-bottom">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Session</label><select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#FFD700]" value={paymentForm.session} onChange={e => setPaymentForm({...paymentForm, session: e.target.value})}><option>2025/2026</option><option>2026/2027</option></select></div>
                      <div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Term</label><select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#FFD700]" value={paymentForm.term} onChange={e => setPaymentForm({...paymentForm, term: e.target.value})}><option>1st Term</option><option>2nd Term</option><option>3rd Term</option></select></div>
                    </div>
                    <div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Purpose</label><select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#FFD700]" value={paymentForm.purpose} onChange={e => setPaymentForm({...paymentForm, purpose: e.target.value})}><option>Tuition Fee</option><option>Uniform</option><option>Textbooks</option><option>Bus Fee</option></select></div>
                    <div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Amount (₦)</label><input required type="number" className="w-full p-4 text-2xl font-black text-red-600 bg-yellow-50 border border-yellow-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" placeholder="0.00" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} /></div>
                    <div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Method</label><div className="flex gap-4">{['Cash', 'Transfer', 'POS'].map(m => (<label key={m} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 border border-gray-200 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors"><input type="radio" name="method" value={m} checked={paymentForm.method === m} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} className="accent-red-600" /><span>{m}</span></label>))}</div></div>
                    <button disabled={loading} className="w-full py-4 mt-2 bg-red-600 text-white font-black rounded-xl shadow-lg hover:bg-red-700 uppercase tracking-widest transition-all">{loading ? 'Processing...' : 'Confirm Payment'}</button>
                 </form>
               )}
            </div>
          )}

          {activeTab === 'students' && (
             <div className="space-y-6 animate-in fade-in">
               <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manage Student Access</h1>
               <div className="flex flex-wrap gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                 <div className="flex items-center gap-2"><Filter size={18} className="text-red-600" /><span className="text-sm font-black text-gray-800 uppercase tracking-widest">Filter:</span></div>
                 <select value={filterSection} onChange={e => { setFilterSection(e.target.value); setFilterClass("All"); }} className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#FFD700]"><option value="All">All Sections</option><option value="Primary">Primary</option><option value="Secondary">Secondary</option></select>
                 <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#FFD700]"><option value="All">All Classes</option>{filterSection === "All" && [...getClassOptions("Primary"), ...getClassOptions("Secondary")].map(c => <option key={c}>{c}</option>)}{filterSection === "Primary" && getClassOptions("Primary").map(c => <option key={c}>{c}</option>)}{filterSection === "Secondary" && getClassOptions("Secondary").map(c => <option key={c}>{c}</option>)}</select>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {filteredStudents.length > 0 ? filteredStudents.map(s => (
                   <div key={s.id} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md hover:border-[#FFD700] transition-all">
                      <div className="flex gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-yellow-100 border-2 border-red-600 overflow-hidden flex-shrink-0">{s.passport_url ? <img src={s.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full font-black text-2xl text-red-600">{s.full_name[0]}</span>}</div>
                        <div className="overflow-hidden"><h3 className="font-bold text-gray-900 truncate text-lg">{s.full_name}</h3><div className="flex gap-2 mt-1"><span className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-xs font-bold rounded text-gray-600">{s.current_class}</span><span className={`px-2 py-0.5 text-xs font-bold rounded border ${s.gender === 'Male' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-pink-50 border-pink-100 text-pink-600'}`}>{s.gender || 'N/A'}</span></div></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 bg-gray-50 border border-gray-100 p-3 rounded-xl mb-4 text-sm"><div><p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">ID & PIN</p><p className="font-bold text-gray-900 truncate">{s.admission_number}</p><p className="font-mono font-black text-red-600">{s.password_text}</p></div><div><p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Parent</p><p className="font-bold text-gray-900">{s.parent_phone}</p></div></div>
                      <div className="flex items-center justify-between border-t border-gray-100 pt-3"><label className="flex items-center gap-2 cursor-pointer select-none"><div className={`w-10 h-5 rounded-full p-1 transition-colors ${s.is_active ? 'bg-green-600' : 'bg-gray-300'}`} onClick={() => toggleStudentStatus(s.id, s.is_active)}><div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${s.is_active ? 'translate-x-5' : 'translate-x-0'}`}></div></div><span className={`text-xs font-black uppercase tracking-wider ${s.is_active ? 'text-green-700' : 'text-gray-500'}`}>{s.is_active ? 'Active' : 'Locked'}</span></label></div>
                   </div>
                 )) : (<div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300"><p className="font-medium">No students found for this class.</p></div>)}
               </div>
             </div>
          )}

          {activeTab === 'history' && (
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-in fade-in">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-black text-xl text-black">Transaction History</h3>
                 <button onClick={downloadHistoryPDF} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-700 shadow-md transition-all"><FileText size={16}/> Download PDF</button>
               </div>
               <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-black text-[#FFD700]"><tr><th className="p-4 font-black uppercase tracking-wider text-xs">Date/Time</th><th className="p-4 font-black uppercase tracking-wider text-xs">Student</th><th className="p-4 font-black uppercase tracking-wider text-xs">Purpose</th><th className="p-4 font-black uppercase tracking-wider text-xs">Amount</th><th className="p-4 font-black uppercase tracking-wider text-xs">Method</th></tr></thead><tbody className="divide-y divide-gray-100">{recentPayments.map(p => (<tr key={p.id} className="hover:bg-gray-50 transition-colors"><td className="p-4 text-gray-500 font-medium">{new Date(p.created_at).toLocaleString()}</td><td className="p-4 font-bold text-gray-900">{p.student_name}</td><td className="p-4 font-medium text-gray-700">{p.purpose}</td><td className="p-4 font-black text-green-600">₦{Number(p.amount_paid).toLocaleString()}</td><td className="p-4"><span className="bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1 rounded-lg text-xs font-bold">{p.payment_method}</span></td></tr>))}</tbody></table></div>
             </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white p-8 md:p-12 text-center rounded-3xl shadow-lg border-t-8 border-[#FFD700] max-w-xl mx-auto animate-in fade-in">
               <div className="w-32 h-32 mx-auto bg-black rounded-full flex items-center justify-center mb-6 border-4 border-red-600 overflow-hidden relative group">
                 {bursarProfile?.passport_url ? <img src={bursarProfile.passport_url} className="w-full h-full object-cover"/> : <span className="text-5xl text-[#FFD700] font-black">B</span>}
                 
                 <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[#FFD700]">
                   <Camera size={32} />
                   <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                 </label>
               </div>

               <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{bursarProfile?.full_name || 'Bursar'}</h2>
               <p className="bg-red-600 text-white font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-widest mt-3 inline-block shadow-sm">Financial Officer</p>

               <div className="mt-8 text-left space-y-4 bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-200">
                 <div className="bg-white p-4 border border-gray-100 rounded-xl shadow-sm"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email / Login ID</p><p className="font-bold text-gray-900 text-lg truncate">{bursarProfile?.email}</p></div>
                 <div className="bg-white p-4 border border-gray-100 rounded-xl shadow-sm"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Access PIN</p><p className="font-black font-mono text-red-600 text-xl tracking-widest">{bursarProfile?.password_text}</p></div>
               </div>

               <div className="mt-6 text-xs text-gray-400 font-medium">
                 Tap the profile picture to update your photo.
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default BursarDashboard;