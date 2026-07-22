import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserCircle, Lock, ArrowRight, CreditCard, X, Search, ShieldCheck, GraduationCap, Copy, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import logo from "/school-logo.png";

const StudentLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  
  const [studentId, setStudentId] = useState("");
  const [studentPin, setStudentPin] = useState("");

  const [isBuyPinModalOpen, setIsBuyPinModalOpen] = useState(false);
  const [buyPinAdmissionNo, setBuyPinAdmissionNo] = useState("");
  const [foundStudentForPin, setFoundStudentForPin] = useState<any>(null);
  const [findingStudent, setFindingStudent] = useState(false);
  
  const [virtualAccount, setVirtualAccount] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isWaitingForBank, setIsWaitingForBank] = useState(false);
  const [revealedPin, setRevealedPin] = useState<string | null>(null);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('students').select('*')
        .eq('admission_number', studentId).eq('password_text', studentPin).single();
      
      if (error || !data) throw new Error("Invalid Admission Number or PIN");
      if (!data.is_active) throw new Error("Account locked. Please visit the Bursary.");

      localStorage.setItem('studentId', data.id);
      localStorage.setItem('studentClass', data.current_class);
      toast.success(`Welcome back, ${data.full_name}!`);
      navigate('/student-dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyStudentForPin = async () => {
    if (!buyPinAdmissionNo) return toast.error("Please enter an admission number");
    setFindingStudent(true);
    try {
      const { data, error } = await supabase.from('students').select('id, full_name, current_class, admission_number').eq('admission_number', buyPinAdmissionNo).single();
      if (error || !data) throw new Error("Student not found. Check the admission number.");
      setFoundStudentForPin(data);
      setVirtualAccount(null);
      setIsWaitingForBank(false);
      setRevealedPin(null);
    } catch (err: any) {
      toast.error(err.message);
      setFoundStudentForPin(null);
    } finally {
      setFindingStudent(false);
    }
  };

  const proceedToEmbedlyPayment = async () => {
    if (!foundStudentForPin) return;
    setLoading(true);
    toast.loading("Generating Secure Account...");
    
    try {
      const { data, error } = await supabase.functions.invoke('embedly-checkout', {
         body: {
            studentId: foundStudentForPin.id,
            studentName: foundStudentForPin.full_name,
            amount: 1000,
            purpose: 'PIN Purchase',
            email: 'bursary@citadelschool.edu.ng' 
         }
      });
      
      if (error) throw error;
      
      const responseData = data.embedlyData?.data || data.embedlyData;
      
      if (responseData?.walletNumber) {
         toast.dismiss();
         toast.success("Account generated successfully!");
         setVirtualAccount({
             accountNumber: responseData.walletNumber,
             accountName: responseData.walletName || "Citadel Int. School",
             bankName: "Sterling Bank",
             amount: responseData.expectedAmount || 1000
         });
      } else {
         throw new Error(`Failed to generate account.`);
      }
    } catch (e: any) { 
      toast.dismiss(); 
      toast.error(e.message); 
    } finally {
      setLoading(false); 
    }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!isWaitingForBank || !foundStudentForPin) return;

    const channel = supabase
      .channel('payment-listener')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'payments',
          filter: `student_name=eq.${foundStudentForPin.full_name}` 
        },
        async (payload) => {
          console.log("Webhook fired! Database updated:", payload);
     
          const { data } = await supabase.from('students')
              .select('password_text')
              .eq('id', foundStudentForPin.id)
              .single();

          if (data) {
             setRevealedPin(data.password_text);
             setIsWaitingForBank(false); 
             toast.success("Payment Received Successfully!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isWaitingForBank, foundStudentForPin]);


  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <SEO title="Student Login | Citadel" description="Access your academic portal" />
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-400/10 rounded-full blur-3xl"></div>

      {isBuyPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl flex items-center gap-2"><CreditCard size={20} className="text-yellow-400" /> Purchase Result PIN</h3>
                <p className="text-xs text-gray-400 mt-1">Powered securely by Sterling Bank</p>
              </div>
              <button onClick={() => {setIsBuyPinModalOpen(false); setFoundStudentForPin(null); setVirtualAccount(null); setIsWaitingForBank(false); setRevealedPin(null);}} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-6 space-y-6 min-h-[300px]">
              
              {/* STEP 1: VERIFY STUDENT */}
              {!foundStudentForPin ? (
                <div className="space-y-4">
                   <p className="text-sm text-gray-600">Enter your child's Admission Number to proceed.</p>
                   <div className="flex gap-2">
                     <input type="text" value={buyPinAdmissionNo} onChange={e => setBuyPinAdmissionNo(e.target.value)} placeholder="e.g. CIS/24/1234" className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 font-bold" />
                     <button onClick={verifyStudentForPin} disabled={findingStudent} className="p-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors">{findingStudent ? '...' : <Search size={20}/>}</button>
                   </div>
                </div>

              /* STEP 2: CONFIRM ACCOUNT GENERATION */
              ) : !virtualAccount && !isWaitingForBank && !revealedPin ? (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-gray-900 font-bold text-xl">{foundStudentForPin.full_name[0]}</div>
                    <div><p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Student Verified</p><h4 className="font-bold text-gray-900 leading-tight text-lg">{foundStudentForPin.full_name}</h4></div>
                  </div>
                  <button onClick={proceedToEmbedlyPayment} disabled={loading} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all">
                      {loading ? 'Generating...' : 'Generate Payment Account'}
                  </button>
                </div>

              /* STEP 3: SHOW BANK ACCOUNT TO PARENT */
              ) : virtualAccount && !isWaitingForBank && !revealedPin ? (
                <div className="space-y-6 animate-in zoom-in-95">
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                        <div className="flex justify-between items-center border-b pb-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Number</span>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-2xl text-red-600">{virtualAccount.accountNumber}</span>
                                <button onClick={() => copyToClipboard(virtualAccount.accountNumber)} className="p-1.5 bg-gray-200 rounded-lg text-gray-600 hover:bg-gray-300">
                                    {copied ? <CheckCircle size={16} className="text-green-600" /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center border-b pb-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bank</span>
                            <span className="font-bold text-gray-900">{virtualAccount.bankName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</span>
                            <span className="font-black text-xl text-green-700">₦{virtualAccount.amount.toLocaleString()}</span>
                        </div>
                    </div>
                    <button onClick={() => setIsWaitingForBank(true)} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-all">
                        I Have Sent The Money
                    </button>
                </div>

              /* STEP 4: REALTIME WAITING SPINNER */
              ) : isWaitingForBank ? (
                 <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in">
                    <Loader2 size={48} className="text-yellow-500 animate-spin" />
                    <h3 className="font-bold text-xl text-gray-900">Waiting for Bank...</h3>
                    <p className="text-sm text-gray-500 text-center max-w-[250px]">Please do not close this page. Your PIN will appear automatically once Sterling Bank confirms the transfer.</p>
                 </div>

              /* STEP 5: THE GRAND REVEAL! */
              ) : revealedPin ? (
                 <div className="flex flex-col items-center justify-center space-y-6 animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-500">
                        <CheckCircle size={40} className="text-green-600" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-black text-2xl text-gray-900">Payment Confirmed!</h3>
                        <p className="text-sm text-gray-500 mt-1">Here is your student's login PIN.</p>
                    </div>
                    
                    <div className="bg-gray-900 w-full py-6 rounded-2xl flex flex-col items-center border border-gray-700 shadow-inner">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Secret PIN</span>
                        <span className="font-black text-4xl text-yellow-400 tracking-[0.3em]">{revealedPin}</span>
                    </div>

                    <button onClick={() => {
                        setStudentId(foundStudentForPin.admission_number);
                        setStudentPin(revealedPin);
                        setIsBuyPinModalOpen(false);
                    }} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all">
                        Auto-Fill Login & Continue
                    </button>
                 </div>
              ) : null}

            </div>
          </div>
        </div>
      )}

      {/* LEFT & RIGHT SIDE DESKTOP LAYOUT (Unchanged) */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 relative z-10 min-h-[600px]">
        {/* Branding Side */}
        <div className="md:w-5/12 bg-gray-900 p-10 md:p-12 flex flex-col justify-between relative overflow-hidden text-white">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10">
            <Link to="/"><div className="w-20 h-20 bg-white rounded-2xl p-2 mb-8 shadow-xl flex items-center justify-center"><img src={logo} alt="Citadel Logo" className="w-full h-full object-contain" /></div></Link>
            <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">Student <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-400">Portal</span></h1>
            <p className="text-gray-300 font-medium">Access your academic records and check your termly results.</p>
          </div>
        </div>

        {/* Form Side */}
        <div className="md:w-7/12 p-8 md:p-12 lg:p-16 flex flex-col bg-white justify-center">
          <div className="animate-in slide-in-from-right-8 duration-500">
            <div className="mb-8 text-center">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">Welcome Back</h2>
              <p className="text-gray-500 text-sm mt-2">Enter your admission number and PIN to continue.</p>
            </div>

            <form onSubmit={handleStudentLogin} className="space-y-5 max-w-sm mx-auto">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Admission Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><UserCircle size={18} /></div>
                  <input required type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-medium text-gray-900" placeholder="e.g. CIS/24/1234" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">4-Digit PIN</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Lock size={18} /></div>
                  <input required type="password" value={studentPin} onChange={(e) => setStudentPin(e.target.value)} maxLength={4} className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-black text-gray-900 tracking-[0.3em]" placeholder="••••" />
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full py-4 mt-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/30">
                {loading ? 'Authenticating...' : 'Access Result'} <ArrowRight size={18} />
              </button>
              
            
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;