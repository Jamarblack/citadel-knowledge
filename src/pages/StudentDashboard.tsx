import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, FileText, CheckCircle, Menu, Printer } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SEO from "@/components/SEO";
import logo from "/school-logo.png";

const PSYCHOMOTOR_KEYS = ["Handwriting", "Sports", "Fluency", "Drawing", "Handling Tools"];
const AFFECTIVE_KEYS = ["Punctuality", "Neatness", "Politeness", "Honesty", "Leadership", "Attentiveness"];

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("result");
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(""); 
  const [selectedSession, setSelectedSession] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [reportDetails, setReportDetails] = useState<any>(null);
  const [nextTermBegins, setNextTermBegins] = useState("");
  const [classPosition, setClassPosition] = useState({ rank: 0, outOf: 0 });

  const isSecondary = studentProfile?.current_class?.includes("JSS") || studentProfile?.current_class?.includes("SS");

  useEffect(() => { const id = localStorage.getItem('studentId'); if (!id) navigate('/'); fetchInitialData(id!); }, []);

  const fetchInitialData = async (id: string) => { 
    const { data: settings } = await supabase.from('school_settings').select('*').single(); 
    let currentSession = "2025/2026"; let currentTerm = "2nd Term"; 
    if (settings) { currentSession = settings.current_session; currentTerm = settings.current_term; setSelectedSession(currentSession); setSelectedTerm(currentTerm); } 
    const { data: config } = await supabase.from('school_config').select('*').limit(1).maybeSingle(); 
    if (config) setNextTermBegins(config.next_term_begins); 
    const { data: profile } = await supabase.from('students').select('*').eq('id', id).single(); 
    if (profile) { setStudentProfile(profile); fetchResults(profile.id, currentTerm, currentSession, profile.current_class); } 
  };

  const fetchResults = async (studentId: string, term: string, session: string, studentClass: string) => {
    setLoading(true);
    const { data: resData } = await supabase.from('results').select('*').eq('student_id', studentId).eq('term', term).eq('session', session).eq('status', 'approved');
    const validResults = (resData || []).filter(r => !(r.ca1_score === 0 && r.ca2_score === 0 && r.exam_score === 0 && r.class_quiz === 0 && r.home_quiz === 0));
    setResults(validResults);
    
    // FIX: Using limit(1) safely grabs the remark without crashing from duplicates
    const { data: repData } = await supabase.from('term_reports').select('*').eq('student_id', studentId).eq('term', term).eq('session', session).limit(1);
    setReportDetails(repData?.[0] || null);

    if (studentClass) {
       const { data: allClassData } = await supabase.from('results').select('student_id, total_score')
         .eq('class_level', studentClass).eq('term', term).eq('session', session).eq('status', 'approved');
       
       if (allClassData) {
         const studentStats: Record<string, { total: number, count: number }> = {};
         allClassData.forEach(r => {
            if ((r.total_score || 0) > 0) { 
                if (!studentStats[r.student_id]) studentStats[r.student_id] = { total: 0, count: 0 };
                studentStats[r.student_id].total += r.total_score;
                studentStats[r.student_id].count += 1;
            }
         });
         const ranked = Object.entries(studentStats).map(([id, stats]) => ({
             id, avg: stats.count > 0 ? Number((stats.total / stats.count).toFixed(1)) : 0
         })).sort((a, b) => b.avg - a.avg);
         
         const myRankIndex = ranked.findIndex(r => r.id === studentId);
         setClassPosition({ rank: myRankIndex !== -1 ? myRankIndex + 1 : 0, outOf: ranked.length });
       }
    }
    setLoading(false);
  };

  const getGradeAndRemark = (totalScore: number, studentClass: string = '') => {
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

  const totalScore = results.reduce((acc, curr) => acc + curr.total_score, 0);
  const averageScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;

  const SidebarContent = () => ( <div className="h-full flex flex-col bg-[#FFD700] border-r-4 border-black"> <div className="p-8 text-center bg-[#FFD700]"> <div className="w-28 h-28 mx-auto rounded-full bg-white border-4 border-red-600 shadow-xl overflow-hidden flex items-center justify-center"> {studentProfile?.passport_url ? <img src={studentProfile.passport_url} className="w-full h-full object-cover"/> : <span className="text-5xl font-black text-red-600">{studentProfile?.full_name?.[0]}</span>} </div> <h3 className="font-black text-black text-xl mt-4 leading-tight">{studentProfile?.full_name}</h3> <span className="text-xs font-bold bg-black text-[#FFD700] px-4 py-1 rounded-full mt-2 inline-block uppercase tracking-widest shadow-sm"> {studentProfile?.current_class} </span> </div> <nav className="flex-1 p-4 space-y-3 mt-4"> <button onClick={() => { setActiveTab('result'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold transition-all ${activeTab === 'result' ? 'bg-black text-[#FFD700] shadow-lg translate-x-2' : 'text-gray-900 hover:bg-yellow-300'}`}> <FileText size={20} /> Check Result </button> <button onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-black text-[#FFD700] shadow-lg translate-x-2' : 'text-gray-900 hover:bg-yellow-300'}`}> <User size={20} /> My Profile </button> </nav> <div className="p-6"> <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full py-4 bg-red-600 text-white hover:bg-red-700 rounded-xl flex items-center justify-center gap-2 font-black shadow-lg transition-all uppercase tracking-wider"> <LogOut size={18} /> Logout </button> </div> </div> );

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col md:flex-row selection:bg-yellow-300">
      <SEO title="Student Portal | Citadel" description="Student Area" noindex={true} />
      <header className="md:hidden p-4 bg-[#FFD700] border-b-4 border-black flex justify-between items-center sticky top-0 z-20 shadow-md"> <div className="flex items-center gap-2"> <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 border-2 border-red-600"> <img src={logo} alt="Logo" className="w-full h-full object-contain" /> </div> <span className="font-black text-black tracking-wide uppercase">Student Portal</span> </div> <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-black hover:bg-yellow-300 rounded-lg"><Menu size={24} /></button> </header>
      <aside className="hidden md:flex w-72 shadow-2xl flex-col sticky top-0 h-screen z-30 shrink-0"><SidebarContent /></aside>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}><SheetContent side="left" className="p-0 w-72 border-none"><SidebarContent /></SheetContent></Sheet>

      <main className="flex-1 h-[calc(100vh-76px)] md:h-screen overflow-y-auto">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
           {activeTab === 'result' && (
             <div className="animate-in fade-in space-y-6">
                <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 print-hide"> <div> <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Result Checker</h1> <p className="text-gray-500 font-medium mt-1">View and print your official termly report card.</p> </div> </div>
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border-l-4 border-[#FFD700] flex flex-col md:flex-row gap-4 items-end print-hide"> <div className="w-full md:flex-1"><label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Session</label><select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none"><option>2025/2026</option><option>2024/2025</option></select></div> <div className="w-full md:flex-1"><label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Term</label><select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none"><option>1st Term</option><option>2nd Term</option><option>3rd Term</option></select></div> <button onClick={() => fetchResults(studentProfile.id, selectedTerm, selectedSession, studentProfile.current_class)} disabled={loading} className="w-full md:w-auto px-8 py-3 bg-red-600 text-white font-black rounded-xl shadow-lg hover:bg-red-700 transition-all uppercase tracking-wider">{loading ? 'Checking...' : 'Check Result'}</button> </div>

                {results.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-end print-hide"> <button onClick={() => window.print()} className="px-6 py-3 bg-black text-[#FFD700] font-black rounded-xl shadow-lg hover:bg-gray-900 transition-all flex items-center gap-2 uppercase tracking-wider"><Printer size={18}/> Print A4 Report</button> </div>
                    <div id="result-print-area" className="bg-white rounded-xl md:rounded-2xl shadow-xl border border-gray-200 mx-auto w-full max-w-[210mm] relative overflow-hidden md:overflow-visible print:border-none print:shadow-none">
                        
                        <style>{`
                          @media print { 
                            body * { visibility: hidden; } 
                            #result-print-area, #result-print-area * { visibility: visible; } 
                            #result-print-area { position: absolute; left: 0; top: 0; width: 100%; max-width: 100%; margin: 0; padding: 0; box-shadow: none; border: none; background: white; color: black !important; } 
                            @page { size: A4 portrait; margin: 5mm; } 
                            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } 
                            .print-hide { display: none !important; } 
                            .page-break-avoid { page-break-inside: avoid; } 
                          }
                        `}</style>

                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none z-0 overflow-hidden"><img src={logo} alt="Watermark" className="w-[80%] max-w-[400px] aspect-square object-contain" /></div>
                        
                        <div className="relative z-10 p-4 sm:p-6 print:p-2">
                            <div className="flex flex-col sm:flex-row items-center justify-between border-b-[3px] border-black pb-4 mb-4 print:pb-2 print:mb-2 gap-4"> 
                                <img src={logo} alt="Logo" className="w-20 h-20 sm:w-24 sm:h-24 print:w-16 print:h-16 object-contain shrink-0" /> 
                                <div className="text-center flex-1 px-2 sm:px-4"><h1 className="text-xl sm:text-2xl md:text-3xl print:text-xl font-black text-red-700 uppercase tracking-wide">Citadel of Knowledge</h1><h2 className="text-base sm:text-lg md:text-xl print:text-base font-bold text-gray-800 uppercase tracking-widest">International School</h2><p className="text-[10px] sm:text-xs md:text-sm print:text-[9px] font-medium text-gray-600 print:mt-0 mt-1">Adjacent First Bank, Saw-Mill Area, Lagos Road, Ilorin, Kwara State.</p></div> 
                                <div className="w-16 h-20 sm:w-20 sm:h-24 print:w-14 print:h-16 border-2 border-gray-300 flex items-center justify-center bg-gray-50 shrink-0">{studentProfile?.passport_url ? <img src={studentProfile.passport_url} className="w-full h-full object-cover"/> : <span className="text-[8px] sm:text-[10px] print:text-[7px] text-gray-400 uppercase font-bold text-center px-1">Passport Photo</span>}</div> 
                            </div>
                            
                            <div className="text-center bg-[#FFD700] text-black border-2 border-black py-1.5 print:py-1 mb-4 print:mb-2 font-black uppercase text-xs sm:text-sm md:text-base print:text-xs shadow-sm"> TERMLY REPORT SHEET - {selectedTerm} {selectedSession} </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs md:text-sm print:text-[10px] border-2 border-black p-3 print:p-1.5 mb-4 print:mb-2 font-medium"> 
                                <div className="sm:col-span-2 flex"><span className="w-24 sm:w-28 print:w-20 font-bold text-gray-700 uppercase shrink-0">Name:</span> <span className="font-black border-b border-gray-400 flex-1 truncate">{studentProfile?.full_name}</span></div> 
                                <div className="sm:col-span-2 flex"><span className="w-28 print:w-24 font-bold text-gray-700 uppercase shrink-0">Admission No:</span> <span className="font-black border-b border-gray-400 flex-1 truncate">{studentProfile?.admission_number}</span></div> 
                                <div className="flex"><span className="w-16 print:w-12 font-bold text-gray-700 uppercase shrink-0">Class:</span> <span className="font-black border-b border-gray-400 flex-1 truncate">{studentProfile?.current_class}</span></div> 
                                <div className="flex"><span className="w-16 print:w-12 font-bold text-gray-700 uppercase shrink-0">Gender:</span> <span className="font-black border-b border-gray-400 flex-1 truncate">{studentProfile?.gender || '-'}</span></div> 
                                <div className="sm:col-span-2 flex"><span className="w-32 print:w-28 font-bold text-gray-700 uppercase shrink-0">Next Term Begins:</span> <span className="font-black border-b border-gray-400 flex-1 truncate">{nextTermBegins || 'TBD'}</span></div> 
                            </div>
                            
                            <div className="overflow-x-auto border-2 border-black mb-4 print:mb-2">
                              <table className="w-full text-left border-collapse min-w-[500px]">
                                <thead className="bg-red-700 text-white font-bold text-[8px] sm:text-[9px] md:text-[11px] print:text-[8px]">
                                  <tr>
                                    <th className="p-1 print:py-0.5 border border-black uppercase text-center w-6">S/N</th> <th className="p-1 print:py-0.5 border border-black uppercase w-32">SUBJECT</th>
                                    {!isSecondary && <th className="p-1 print:py-0.5 text-center border border-black leading-tight">CLASS<br/>QUIZ</th>}
                                    {!isSecondary && <th className="p-1 print:py-0.5 text-center border border-black leading-tight">HOME<br/>QUIZ</th>}
                                    <th className="p-1 print:py-0.5 text-center border border-black leading-tight">1ST CA</th> <th className="p-1 print:py-0.5 text-center border border-black leading-tight">2ND CA</th> <th className="p-1 print:py-0.5 text-center border border-black leading-tight">EXAM</th> <th className="p-1 print:py-0.5 text-center border border-black text-[#FFD700]">TOTAL</th> <th className="p-1 print:py-0.5 text-center border border-black">GRADE</th> <th className="p-1 print:py-0.5 text-center border border-black text-[#FFD700]">POS</th> <th className="p-1 print:py-0.5 text-center border border-black">REMARK</th>
                                  </tr>
                                </thead>
                                <tbody className="text-[9px] sm:text-[10px] md:text-xs print:text-[9px]">
                                   {results.map((res, i) => {
                                     const { grade, remark } = getGradeAndRemark(res.total_score, studentProfile?.current_class);
                                     const gradeColor = (grade === 'A' || grade === 'B') ? 'text-green-700' : (grade === 'C' || grade === 'D') ? 'text-yellow-600' : 'text-red-600';
                                     return (
                                       <tr key={i} className="even:bg-gray-50 border-b border-gray-300">
                                         <td className="p-1 print:py-0.5 text-center border-r border-gray-300 font-bold text-gray-500">{i + 1}</td> <td className="p-1 print:py-0.5 font-bold text-gray-900 border-r border-gray-300 uppercase truncate max-w-[120px]">{res.subject}</td>
                                         {!isSecondary && <td className="p-1 print:py-0.5 text-center font-medium border-r border-gray-300">{res.class_quiz || '-'}</td>} {!isSecondary && <td className="p-1 print:py-0.5 text-center font-medium border-r border-gray-300">{res.home_quiz || '-'}</td>}
                                         <td className="p-1 print:py-0.5 text-center font-medium border-r border-gray-300">{res.ca1_score || '-'}</td> <td className="p-1 print:py-0.5 text-center font-medium border-r border-gray-300">{res.ca2_score || '-'}</td> <td className="p-1 print:py-0.5 text-center font-medium border-r border-gray-300">{res.exam_score || '-'}</td> <td className="p-1 print:py-0.5 text-center font-black border-r border-black bg-yellow-50">{res.total_score}</td> <td className={`p-1 print:py-0.5 text-center font-black border-r border-gray-300 ${gradeColor}`}>{grade}</td> <td className="p-1 print:py-0.5 text-center font-black border-r border-gray-300 text-green-700">{res.position || '-'}</td> <td className="p-1 print:py-0.5 text-center font-bold text-gray-600 uppercase tracking-wider truncate max-w-[80px]">{remark}</td>
                                       </tr>
                                     );
                                   })}
                                </tbody>
                              </table>
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-4 print:gap-2 mb-4 print:mb-2 page-break-avoid text-xs md:text-sm print:text-[10px]"> 
                               <div className="flex-1 space-y-4 print:space-y-1.5"> 
                                  <div className="border-2 border-black flex"><div className="bg-red-700 text-white font-bold p-2 print:p-1 w-1/2 flex items-center uppercase text-[10px] sm:text-xs print:text-[9px]">Total Score</div><div className="p-2 print:p-1 font-black text-center flex-1">{totalScore}</div></div> 
                                  <div className="border-2 border-black flex"><div className="bg-red-700 text-white font-bold p-2 print:p-1 w-1/2 flex items-center uppercase text-[10px] sm:text-xs print:text-[9px]">Overall Average</div><div className="p-2 print:p-1 font-black text-center flex-1 text-red-600 text-base sm:text-lg print:text-sm">{averageScore}%</div></div> 
                                  <div className="border-2 border-black flex"><div className="bg-red-700 text-white font-bold p-2 print:p-1 w-1/2 flex items-center uppercase text-[10px] sm:text-xs print:text-[9px]">Position</div><div className="p-2 print:p-1 font-black text-center flex-1 text-blue-800 text-base sm:text-lg print:text-sm">{classPosition.rank ? `${classPosition.rank}${getOrdinal(classPosition.rank)} out of ${classPosition.outOf}` : '-'}</div></div> 
                                  
                                  <div className="border-2 border-black"><div className="bg-gray-200 text-black font-bold p-1 print:py-0.5 text-center border-b-2 border-black uppercase text-[10px] sm:text-xs print:text-[9px]">Attendance</div><div className="p-2 print:p-1 space-y-1 print:space-y-0.5 text-[10px] sm:text-xs print:text-[9px]"><div className="flex justify-between font-medium"><span>Days School Opened:</span> <span className="font-bold">{reportDetails?.days_school_open || '-'}</span></div><div className="flex justify-between font-medium"><span>Days Present:</span> <span className="font-bold">{reportDetails?.days_present || '-'}</span></div><div className="flex justify-between font-medium"><span>Days Absent:</span> <span className="font-bold">{reportDetails?.days_absent || '-'}</span></div></div></div> 
                               </div> 
                               <div className="flex-1 border-2 border-black"><div className="bg-gray-200 text-black font-bold p-1 print:py-0.5 text-center border-b-2 border-black uppercase text-[9px] sm:text-[10px] md:text-xs print:text-[9px] tracking-wider">Psychomotor Domain</div><div className="p-1">{PSYCHOMOTOR_KEYS.map(k => (<div key={k} className="flex justify-between text-[9px] sm:text-[11px] md:text-xs print:text-[9px] border-b border-gray-200 last:border-0 px-1 py-0.5 print:py-[1px]"><span className="uppercase text-gray-700">{k}</span> <span className="font-black">{reportDetails?.psychomotor_skills?.[k] || '-'}</span></div>))}</div><div className="p-1 text-[8px] sm:text-[9px] print:text-[7px] text-center border-t border-gray-300 text-gray-500 mt-1">Scale: 5-Excellent, 4-Very Good, 3-Good, 2-Fair, 1-Poor</div></div> <div className="flex-1 border-2 border-black"><div className="bg-gray-200 text-black font-bold p-1 print:py-0.5 text-center border-b-2 border-black uppercase text-[9px] sm:text-[10px] md:text-xs print:text-[9px] tracking-wider">Affective Domain</div><div className="p-1">{AFFECTIVE_KEYS.map(k => (<div key={k} className="flex justify-between text-[9px] sm:text-[11px] md:text-xs print:text-[9px] border-b border-gray-200 last:border-0 px-1 py-0.5 print:py-[1px]"><span className="uppercase text-gray-700">{k}</span> <span className="font-black">{reportDetails?.affective_skills?.[k] || '-'}</span></div>))}</div></div> 
                            </div>
                            
                            {/* FIX: REMARK FALLBACK UPDATED SO YOU KNOW IF IT FAILED TO SAVE */}
                            <div className="space-y-4 print:space-y-2 page-break-avoid border-2 border-black p-3 sm:p-4 print:p-2 text-xs sm:text-sm print:text-[10px] bg-yellow-50/50"> <div><span className="font-bold uppercase underline text-red-800">Class Teacher's Remark:</span><span className="ml-2 font-serif italic font-medium">"{reportDetails?.class_teacher_remark || 'No remark provided.'}"</span></div> <div className="pt-6 mt-4 print:pt-4 print:mt-2 flex justify-between items-end"><div className="text-center w-1/2 pr-2"><div className="w-full max-w-[160px] mx-auto border-b border-black mb-1"></div><span className="text-[8px] sm:text-[10px] print:text-[8px] font-bold uppercase tracking-widest text-gray-600 line-clamp-1">Class Teacher's Signature</span></div><div className="text-center w-1/2 pl-2"><div className="w-full max-w-[160px] mx-auto border-b border-black mb-1"></div><span className="text-[8px] sm:text-[10px] print:text-[8px] font-bold uppercase tracking-widest text-gray-600 line-clamp-1">Principal's Signature & Date</span></div></div> </div>
                        </div>
                    </div>
                  </div>
                )}
             </div>
           )}
           {activeTab === 'profile' && ( <div className="bg-white p-6 sm:p-8 md:p-12 text-center rounded-3xl shadow-lg border-t-8 border-[#FFD700] max-w-xl mx-auto animate-in fade-in print-hide mt-4 md:mt-0"> <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-[#FFD700] rounded-full flex items-center justify-center mb-6 border-4 border-black overflow-hidden"> {studentProfile?.passport_url ? <img src={studentProfile.passport_url} className="w-full h-full object-cover"/> : <span className="text-4xl sm:text-5xl text-black font-black">{studentProfile?.full_name?.[0]}</span>} </div> <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{studentProfile?.full_name}</h2> <p className="text-[#FFD700] font-black text-xs sm:text-sm uppercase tracking-widest mt-3 bg-black py-1.5 px-6 rounded-full inline-block shadow-md">{studentProfile?.current_class}</p> <div className="mt-8 sm:mt-10 text-left space-y-4"> <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200 border-l-4 border-l-black"> <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Admission Number</p> <p className="font-black text-red-600 text-lg sm:text-xl font-mono truncate">{studentProfile?.admission_number}</p> </div> <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200 border-l-4 border-l-black grid grid-cols-2 gap-4"> <div> <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Gender</p> <p className="font-black text-gray-900 truncate">{studentProfile?.gender || 'N/A'}</p> </div> <div> <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Date of Birth</p> <p className="font-black text-gray-900 truncate">{studentProfile?.dob || 'N/A'}</p> </div> </div> <div className="bg-[#FFD700]/10 p-4 sm:p-5 rounded-xl border border-[#FFD700] border-l-4 border-l-red-600"> <p className="text-[10px] sm:text-xs font-black text-red-600 uppercase tracking-widest mb-1">Parent Phone / Emergency</p> <p className="font-black text-gray-900 text-lg sm:text-xl truncate">{studentProfile?.parent_phone}</p> </div> </div> </div> )}
        </div>
      </main>
    </div>
  );
};
export default StudentDashboard;