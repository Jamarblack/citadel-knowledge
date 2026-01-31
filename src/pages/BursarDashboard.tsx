import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, LayoutDashboard, Wallet, Users, History, 
  Search, Menu, Camera, CheckCircle, Filter, 
  Key, FileText, X, CreditCard, User
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SEO from "@/components/SEO";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "/school-logo.png";

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
  const [paidPins, setPaidPins] = useState<Set<string>>(new Set());

  // Filters
  const [filterSection, setFilterSection] = useState("All");
  const [filterClass, setFilterClass] = useState("All");

  // Payment Form
  const [searchQuery, setSearchQuery] = useState("");
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '', purpose: 'Tuition Fee', method: 'Cash', session: '2025/2026', term: '1st Term'
  });

  // Modal States
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinStudent, setPinStudent] = useState<any>(null);
  const [pinPaymentMethod, setPinPaymentMethod] = useState("Cash");

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
    
    const { data: pins } = await supabase.from('payments')
      .select('student_id')
      .eq('purpose', 'PIN Purchase')
      .eq('session', '2025/2026') 
      .eq('term', '1st Term');

    if (pins) {
      const paidSet = new Set(pins.map(p => p.student_id));
      setPaidPins(paidSet);
    }
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
    if (section === 'Primary') return ['Creche', 'KG 1', 'KG 2', 'KG 3', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5'];
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

  // --- ACTIONS ---
  const openSellPinModal = (student: any) => {
    setPinStudent(student);
    setPinPaymentMethod("Cash");
    setIsPinModalOpen(true);
  };

  const confirmSellPin = async () => {
    if (!pinStudent) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('payments').insert([{
        student_id: pinStudent.id,
        student_name: pinStudent.full_name,
        admission_number: pinStudent.admission_number,
        amount_paid: 1000,
        purpose: 'PIN Purchase',
        payment_method: pinPaymentMethod,
        session: '2025/2026',
        term: '1st Term',
        recorded_by: bursarProfile?.full_name || 'Bursar'
      }]);
      if (error) throw error;
      toast.success(`PIN Sold to ${pinStudent.full_name}`);
      setPaidPins(prev => new Set(prev).add(pinStudent.id));
      fetchDailyStats(); fetchRecentPayments();
      setIsPinModalOpen(false);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

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
    <div className="h-full flex flex-col text-white">
      <div className="p-8 text-center bg-purple-950 border-b border-purple-800">
         <div className="relative inline-block group">
            <div className="w-24 h-24 mx-auto rounded-full border-[3px] border-purple-200 shadow-xl overflow-hidden bg-[#4a148c]">
                {bursarProfile?.passport_url ? <img src={bursarProfile.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-2xl font-bold">B</span>}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
            </label>
         </div>
         <h3 className="font-bold text-lg mt-3 truncate">{bursarProfile?.full_name || 'Bursar'}</h3>
         <span className="text-[10px] bg-purple-500/30 px-3 py-0.5 rounded-full uppercase tracking-wider">Financial Officer</span>
      </div>
      <nav className="flex-1 bg-purple-950 px-4 py-6 space-y-2">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'sell-pins', label: 'Sell PINs', icon: Key },
          { id: 'new-payment', label: 'Record Payment', icon: Wallet },
          { id: 'students', label: 'Manage Access', icon: Users },
          { id: 'history', label: 'History', icon: History },
          { id: 'profile', label: 'My Profile', icon: User },
        ].map(item => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${activeTab === item.id ? 'bg-white text-[#4a148c] shadow-lg translate-x-1' : 'hover:bg-white/10'}`}>
            <item.icon size={20} /> {item.label}
          </button>
        ))}
      </nav>
      <div className="p-6 bg-[#210e66]/30 mt-auto border-t border-purple-800/50">
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-md"><LogOut size={18} /> Logout</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-purple-50 flex font-sans">
      <SEO title="Bursar Portal | Citadel" description="Financial Management" noindex={true} />
      
      {/* PIN MODAL */}
      {isPinModalOpen && pinStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#4a148c] p-6 text-white flex justify-between items-center">
              <h3 className="font-serif font-bold text-xl flex items-center gap-2"><Key size={20} className="text-[#d1c4e9]" /> Sell Result PIN</h3>
              <button onClick={() => setIsPinModalOpen(false)} className="text-purple-200 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                <div className="h-12 w-12 bg-[#4a148c] rounded-full flex items-center justify-center text-white font-bold text-lg">{pinStudent.full_name[0]}</div>
                <div><p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Student</p><h4 className="font-bold text-[#2c0a0e] text-lg leading-tight">{pinStudent.full_name}</h4><p className="text-sm text-gray-600">{pinStudent.admission_number}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Item</label><div className="p-3 bg-gray-50 rounded-lg font-bold text-[#2c0a0e] border border-gray-200">Result PIN</div></div>
                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Price</label><div className="p-3 bg-green-50 rounded-lg font-bold text-green-700 border border-green-200">₦1,000</div></div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#4a148c]">Payment Method</label>
                <div className="grid grid-cols-3 gap-3">{['Cash', 'Transfer', 'POS'].map((m) => (<button key={m} onClick={() => setPinPaymentMethod(m)} className={`py-3 px-2 rounded-xl text-sm font-bold border transition-all ${pinPaymentMethod === m ? 'bg-[#4a148c] text-white border-[#4a148c] shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{m}</button>))}</div>
              </div>
              <button onClick={confirmSellPin} disabled={loading} className="w-full py-4 bg-[#4a148c] text-white font-bold rounded-xl shadow-lg hover:bg-[#311b92] transition-all flex items-center justify-center gap-2">{loading ? 'Processing...' : 'Confirm Sale'}</button>
            </div>
          </div>
        </div>
      )}

      <aside className="hidden lg:block w-72 bg-[#4a148c] shadow-xl sticky top-0 h-screen z-30"><SidebarContent /></aside>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}><SheetContent side="left" className="p-0 w-72 bg-[#4a148c] border-none"><SidebarContent /></SheetContent></Sheet>

      <main className="flex-1 h-screen overflow-y-auto">
        <header className="lg:hidden p-4 bg-white border-b flex justify-between items-center sticky top-0 z-20">
          <button onClick={() => setIsMobileMenuOpen(true)}><Menu className="text-[#4a148c]" /></button>
          <span className="font-bold text-[#4a148c] text-lg"> <img src={logo} alt="Logo" className="w-8 h-8 inline rounded-full mr-2" /> Bursary</span>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in">
              <h1 className="text-2xl font-bold text-gray-800">Financial Overview</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-purple-100">
                  <p className="text-gray-500 font-medium">Income Today</p>
                  <h3 className="text-4xl font-bold text-[#4a148c] mt-2">₦{totalDaily.toLocaleString()}</h3>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sell-pins' && (
             <div className="space-y-6 animate-in fade-in">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                 <h1 className="text-2xl font-bold text-gray-800">Sell Result PINs</h1>
                 <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <select value={filterSection} onChange={e => { setFilterSection(e.target.value); setFilterClass("All"); }} className="p-2 bg-white border border-purple-200 rounded-lg text-sm font-bold"><option value="All">All Sections</option><option value="Primary">Primary</option><option value="Secondary">Secondary</option></select>
                    <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-2 bg-white border border-purple-200 rounded-lg text-sm font-bold"><option value="All">All Classes</option>{filterSection === "All" && [...getClassOptions("Primary"), ...getClassOptions("Secondary")].map(c => <option key={c}>{c}</option>)}{filterSection === "Primary" && getClassOptions("Primary").map(c => <option key={c}>{c}</option>)}{filterSection === "Secondary" && getClassOptions("Secondary").map(c => <option key={c}>{c}</option>)}</select>
                 </div>
               </div>
               
               {/* RESPONSIVE TABLE CONTAINER (The Fix) */}
               <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left min-w-[600px]">
                     <thead className="bg-[#4a148c] text-white"><tr><th className="p-4">Student</th><th className="p-4">Class</th><th className="p-4">PIN</th><th className="p-4 text-center">Status</th></tr></thead>
                     <tbody>
                       {filteredStudents.length > 0 ? filteredStudents.map(s => {
                         const isPaid = paidPins.has(s.id);
                         return (
                           <tr key={s.id} className="border-b hover:bg-purple-50">
                             <td className="p-4 font-bold">{s.full_name} <br/> <span className="text-xs font-normal text-gray-500">{s.admission_number}</span></td>
                             <td className="p-4">{s.current_class}</td>
                             <td className="p-4 font-mono text-gray-600">{isPaid ? s.password_text : '****'}</td>
                             <td className="p-4 text-center">
                               {isPaid ? (<div className="inline-flex items-center gap-1 text-green-700 font-bold bg-green-100 px-3 py-1 rounded-full text-xs"><CheckCircle size={14} /> Paid</div>) : (<button onClick={() => openSellPinModal(s)} className="bg-[#4a148c] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#311b92] shadow-sm flex items-center gap-1 mx-auto"><CreditCard size={14}/> Sell PIN</button>)}
                             </td>
                           </tr>
                         );
                       }) : (<tr><td colSpan={4} className="p-8 text-center text-gray-400">No students found.</td></tr>)}
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'new-payment' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
               <h1 className="text-2xl font-bold text-gray-800">Record Payment</h1>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 space-y-4">
                 <div className="flex gap-2"><input type="text" className="flex-1 p-3 bg-gray-50 border rounded-xl" placeholder="Admission No or Name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /><button onClick={handleSearchStudent} disabled={loading} className="p-2 bg-[#4a148c] text-white rounded-xl"><Search size={14} /></button></div>
                 {foundStudent && (<div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold">{foundStudent.full_name[0]}</div><div><h3 className="font-bold text-green-900">{foundStudent.full_name}</h3><p className="text-xs text-green-700">{foundStudent.current_class} | {foundStudent.admission_number}</p></div><CheckCircle className="ml-auto text-green-600" /></div>)}
               </div>
               {foundStudent && (
                 <form onSubmit={handleRecordPayment} className="bg-white p-6 rounded-2xl shadow-lg border border-[#4a148c]/20 space-y-4 animate-in slide-in-from-bottom">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Session</label><select className="w-full p-3 bg-gray-50 border rounded-xl" value={paymentForm.session} onChange={e => setPaymentForm({...paymentForm, session: e.target.value})}><option>2025/2026</option><option>2026/2027</option></select></div>
                      <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Term</label><select className="w-full p-3 bg-gray-50 border rounded-xl" value={paymentForm.term} onChange={e => setPaymentForm({...paymentForm, term: e.target.value})}><option>1st Term</option><option>2nd Term</option></select></div>
                    </div>
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Purpose</label><select className="w-full p-3 bg-gray-50 border rounded-xl" value={paymentForm.purpose} onChange={e => setPaymentForm({...paymentForm, purpose: e.target.value})}><option>Tuition Fee</option><option>Uniform</option><option>Textbooks</option><option>Bus Fee</option></select></div>
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Amount (₦)</label><input required type="number" className="w-full p-4 text-2xl font-bold text-[#4a148c] bg-purple-50 border border-purple-200 rounded-xl" placeholder="0.00" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} /></div>
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Method</label><div className="flex gap-4">{['Cash', 'Transfer', 'POS'].map(m => (<label key={m} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="method" value={m} checked={paymentForm.method === m} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} /><span className="font-medium">{m}</span></label>))}</div></div>
                    <button disabled={loading} className="w-full py-4 bg-[#4a148c] text-white font-bold rounded-xl shadow-lg hover:bg-[#311b92]">{loading ? 'Processing...' : 'Confirm Payment'}</button>
                 </form>
               )}
            </div>
          )}

          {activeTab === 'students' && (
             <div className="space-y-6 animate-in fade-in">
               <h1 className="text-2xl font-bold text-gray-800">Manage Student Access</h1>
               <div className="flex flex-wrap gap-4 bg-white p-4 rounded-2xl shadow-sm border border-purple-100">
                 <div className="flex items-center gap-2"><Filter size={18} className="text-[#4a148c]" /><span className="text-sm font-bold text-gray-600">Filter By:</span></div>
                 <select value={filterSection} onChange={e => { setFilterSection(e.target.value); setFilterClass("All"); }} className="p-2 bg-purple-50 border border-purple-100 rounded-lg text-sm font-bold text-[#4a148c] outline-none"><option value="All">All Sections</option><option value="Primary">Primary</option><option value="Secondary">Secondary</option></select>
                 <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-2 bg-purple-50 border border-purple-100 rounded-lg text-sm font-bold text-[#4a148c] outline-none"><option value="All">All Classes</option>{filterSection === "All" && [...getClassOptions("Primary"), ...getClassOptions("Secondary")].map(c => <option key={c}>{c}</option>)}{filterSection === "Primary" && getClassOptions("Primary").map(c => <option key={c}>{c}</option>)}{filterSection === "Secondary" && getClassOptions("Secondary").map(c => <option key={c}>{c}</option>)}</select>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                 {filteredStudents.length > 0 ? filteredStudents.map(s => (
                   <div key={s.id} className="bg-white border border-purple-100 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                      <div className="flex gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-purple-50 border-2 border-[#4a148c] overflow-hidden flex-shrink-0">{s.passport_url ? <img src={s.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full font-bold text-2xl text-[#4a148c]">{s.full_name[0]}</span>}</div>
                        <div className="overflow-hidden"><h3 className="font-bold text-[#2c0a0e] truncate text-lg">{s.full_name}</h3><div className="flex gap-2 mt-1"><span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-xs font-bold rounded text-gray-600">{s.current_class}</span><span className={`px-2 py-0.5 text-xs font-bold rounded border ${s.gender === 'Male' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-pink-50 border-pink-100 text-pink-600'}`}>{s.gender || 'N/A'}</span></div></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 bg-purple-50/50 p-3 rounded-xl mb-4 text-sm"><div><p className="text-[10px] uppercase text-gray-400 font-bold">ID & PIN</p><p className="font-bold text-[#2c0a0e] truncate">{s.admission_number}</p><p className="font-mono text-gray-500">{s.password_text}</p></div><div><p className="text-[10px] uppercase text-gray-400 font-bold">Parent</p><p className="font-bold text-[#2c0a0e]">{s.parent_phone}</p></div></div>
                      <div className="flex items-center justify-between border-t border-gray-100 pt-3"><label className="flex items-center gap-2 cursor-pointer select-none"><div className={`w-10 h-5 rounded-full p-1 transition-colors ${s.is_active ? 'bg-green-600' : 'bg-gray-300'}`} onClick={() => toggleStudentStatus(s.id, s.is_active)}><div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${s.is_active ? 'translate-x-5' : 'translate-x-0'}`}></div></div><span className={`text-xs font-bold ${s.is_active ? 'text-green-700' : 'text-gray-500'}`}>{s.is_active ? 'Active' : 'Locked'}</span></label></div>
                   </div>
                 )) : (<div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-purple-200"><p>No students found for this class.</p></div>)}
               </div>
             </div>
          )}

          {activeTab === 'history' && (
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-in fade-in">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-lg text-[#4a148c]">Transaction History</h3>
                 <button onClick={downloadHistoryPDF} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700"><FileText size={16}/> Download PDF</button>
               </div>
               <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-purple-50 text-[#4a148c]"><tr><th className="p-3">Date/Time</th><th className="p-3">Student</th><th className="p-3">Purpose</th><th className="p-3">Amount</th><th className="p-3">Method</th></tr></thead><tbody>{recentPayments.map(p => (<tr key={p.id} className="border-b hover:bg-gray-50"><td className="p-3 text-gray-500">{new Date(p.created_at).toLocaleString()}</td><td className="p-3 font-medium">{p.student_name}</td><td className="p-3">{p.purpose}</td><td className="p-3 font-bold text-green-600">₦{Number(p.amount_paid).toLocaleString()}</td><td className="p-3">{p.payment_method}</td></tr>))}</tbody></table></div>
             </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white p-8 md:p-12 text-center rounded-3xl shadow-lg border border-purple-100 max-w-xl mx-auto animate-in fade-in">
               <div className="w-32 h-32 mx-auto bg-[#4a148c] rounded-full flex items-center justify-center mb-6 border-4 border-purple-200 overflow-hidden relative group">
                 {bursarProfile?.passport_url ? <img src={bursarProfile.passport_url} className="w-full h-full object-cover"/> : <span className="text-4xl text-white font-bold">B</span>}
                 
                 <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                   <Camera size={32} />
                   <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                 </label>
               </div>

               <h2 className="text-2xl font-bold text-[#2c0a0e]">{bursarProfile?.full_name || 'Bursar'}</h2>
               <p className="text-[#4a148c] font-bold text-sm uppercase tracking-widest mt-1">Financial Officer</p>

               <div className="mt-8 text-left space-y-3 bg-purple-50 p-6 rounded-xl border border-purple-100">
                 <div><p className="text-xs font-bold text-gray-500 uppercase">Email / Login ID</p><p className="font-medium text-[#2c0a0e]">{bursarProfile?.email}</p></div>
                 <div><p className="text-xs font-bold text-gray-500 uppercase">Access PIN</p><p className="font-medium font-mono text-[#2c0a0e]">{bursarProfile?.password_text}</p></div>
                 <div><p className="text-xs font-bold text-gray-500 uppercase">Role</p><p className="font-medium text-[#2c0a0e]">Bursar</p></div>
               </div>

               <div className="mt-6 text-xs text-gray-400">
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