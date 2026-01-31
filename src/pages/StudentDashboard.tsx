import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, User, FileText, Download, Menu, 
  CheckCircle, Lock, GraduationCap, School, Camera
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SEO from "@/components/SEO";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "/school-logo.png";

// REPLACE WITH YOUR ACTUAL LOGO URL
const SCHOOL_LOGO_URL = "https://www.citadelofknowledgeinternationalschool-college.com/school-logo.png"; 

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // NEW: Dynamic Resumption Date
  const [resumptionDate, setResumptionDate] = useState("Loading...");

  // Result Checker States
  const [selectedSession, setSelectedSession] = useState("2025/2026");
  const [selectedTerm, setSelectedTerm] = useState("1st Term");
  const [resultData, setResultData] = useState<any[]>([]);
  const [reportDetails, setReportDetails] = useState<any>(null); // Holds Skills/Attendance
  const [accessGranted, setAccessGranted] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  
  // Computed Result Stats
  const [average, setAverage] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [gradeBreakdown, setGradeBreakdown] = useState({ A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 });

  useEffect(() => {
    const id = localStorage.getItem('studentId');
    if (!id) navigate('/');
    fetchProfile(id!);
  }, []);

  const fetchProfile = async (id: string) => {
    // 1. Get Student Data
    const { data: student } = await supabase.from('students').select('*').eq('id', id).single();
    
    if (student) {
      setStudentProfile(student);

      // 2. Determine Section (Primary or Secondary)
      const isSecondary = student.current_class.includes('JSS') || student.current_class.includes('SS');
      const sectionType = isSecondary ? 'Secondary' : 'Primary';

      // 3. Fetch the specific resumption date for their section
      const { data: config } = await supabase.from('school_config')
        .select('next_term_begins')
        .eq('section_type', sectionType)
        .maybeSingle();

      if (config) {
        setResumptionDate(config.next_term_begins);
      } else {
        setResumptionDate("TBA");
      }
    }
  };

  // --- PROFILE UPLOAD ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length || !studentProfile) return;
    setUploading(true);
    try {
        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `student_${studentProfile.id}_${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('passports').upload(filePath, file);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('passports').getPublicUrl(filePath);
        
        const { error: updateError } = await supabase.from('students').update({ passport_url: publicUrl }).eq('id', studentProfile.id);
        if (updateError) throw updateError;
        
        setStudentProfile({ ...studentProfile, passport_url: publicUrl });
        toast.success("Profile Photo Updated");
    } catch (e: any) {
        toast.error("Upload failed: " + e.message);
    } finally {
        setUploading(false);
    }
  };

  const handleCheckResult = async () => {
    setLoading(true);
    setHasChecked(true);
    setAccessGranted(false);

    try {
      // 1. CHECK PAYMENT
      const { data: payment } = await supabase.from('payments')
        .select('*')
        .eq('student_id', studentProfile.id)
        .eq('purpose', 'PIN Purchase')
        .eq('session', selectedSession)
        .eq('term', selectedTerm)
        .maybeSingle();

      if (!payment) {
        setLoading(false);
        return;
      }

      setAccessGranted(true);

      // 2. FETCH ACADEMIC RESULTS
      const { data: results } = await supabase.from('results')
        .select('*')
        .eq('student_id', studentProfile.id)
        .eq('session', selectedSession)
        .eq('term', selectedTerm)
        .eq('status', 'approved');

      if (results) {
        setResultData(results);
        calculateStats(results);
      }

      // 3. FETCH REPORT DETAILS (Skills, Attendance, Remarks)
      const { data: details } = await supabase.from('term_reports')
        .select('*')
        .eq('student_id', studentProfile.id)
        .eq('session', selectedSession)
        .eq('term', selectedTerm)
        .maybeSingle();
      
      setReportDetails(details);

    } catch (e: any) {
      toast.error("Error checking result");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (results: any[]) => {
    let total = 0;
    let counts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    results.forEach(r => {
      total += Number(r.total_score) || 0;
      const g = r.grade as keyof typeof counts;
      if (counts[g] !== undefined) counts[g]++;
    });
    setTotalScore(total);
    setAverage(results.length > 0 ? Math.round(total / results.length) : 0);
    setGradeBreakdown(counts);
  };

  const getBase64ImageFromURL = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      };
      img.onerror = () => resolve(""); 
      img.src = url;
    });
  };

  // --- PDF GENERATOR ---
  const downloadResult = async () => {
    if (!studentProfile) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const logoBase64 = await getBase64ImageFromURL(SCHOOL_LOGO_URL);

    // -- WATERMARK --
    if (logoBase64) {
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.1 }));
        const wmSize = 100;
        doc.addImage(logoBase64, 'PNG', (pageWidth - wmSize)/2, (pageHeight - wmSize)/2, wmSize, wmSize);
        doc.restoreGraphicsState();
        doc.addImage(logoBase64, 'PNG', 10, 10, 25, 25); // Header Logo
    }

    // -- HEADER --
    doc.setTextColor(153, 0, 0); 
    doc.setFontSize(22); doc.setFont("helvetica", "bold");
    doc.text("CITADEL OF KNOWLEDGE", pageWidth / 2 + 10, 20, { align: "center" });
    doc.setFontSize(14); doc.setFont("helvetica", "normal");
    doc.text("INTERNATIONAL SCHOOL", pageWidth / 2 + 10, 27, { align: "center" });
    doc.setFontSize(9); doc.setTextColor(80, 80, 80);
    doc.text("Adjacent First Bank, Saw-Mill Area, Lagos Road, Ilorin, Kwara State.", pageWidth / 2 + 10, 33, { align: "center" });

    // Title
    doc.setFillColor(153, 0, 0); 
    doc.rect(0, 42, pageWidth, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text(`TERMLY REPORT SHEET - ${selectedTerm.toUpperCase()} ${selectedSession}`, pageWidth / 2, 47, { align: "center" });

    // -- STUDENT INFO --
    doc.setFillColor(255, 250, 240); 
    doc.rect(14, 55, 182, 30, 'F'); 
    doc.setDrawColor(220, 220, 220); doc.rect(14, 55, 182, 30);
    
    doc.setTextColor(0, 0, 0); doc.setFontSize(10);
    const col1X = 18, col2X = 110;
    let rowY = 62;
    const drawRow = (l1: string, v1: string, l2: string, v2: string) => {
        doc.setFont("helvetica", "bold"); doc.text(l1, col1X, rowY);
        doc.setFont("helvetica", "normal"); doc.text(v1, col1X + 35, rowY);
        doc.setFont("helvetica", "bold"); doc.text(l2, col2X, rowY);
        doc.setFont("helvetica", "normal"); doc.text(v2, col2X + 35, rowY);
        rowY += 6;
    };
    drawRow("Student Name:", studentProfile.full_name, "Class:", studentProfile.current_class);
    drawRow("Admission No:", studentProfile.admission_number, "Session:", selectedSession);
    drawRow("Total Score:", `${totalScore}`, "Next Term:", resumptionDate); // UPDATED: Use dynamic date
    drawRow("Average:", `${average}%`, "Position:", "___");

    // -- ACADEMIC TABLE --
    const isPrimary = !studentProfile.current_class.toUpperCase().includes("JSS") && !studentProfile.current_class.toUpperCase().includes("SS");
    const tableHead = isPrimary ? [['SUBJECT', 'CLASS\nACTIVITY', 'HOME\nQUIZ', 'EXAM', 'TOTAL', 'GRADE', 'REMARK']] : [['SUBJECT', '1st CA', '2nd CA', 'EXAM', 'TOTAL', 'GRADE', 'REMARK']];
    
    autoTable(doc, {
      startY: 90,
      head: tableHead,
      body: resultData.map(r => [r.subject, r.ca1_score||'-', r.ca2_score||'-', r.exam_score, r.total_score, r.grade, r.remarks||'']),
      theme: 'grid',
      headStyles: { fillColor: [153, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      bodyStyles: { textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [200, 200, 200] },
      columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' }, 6: { fontSize: 8 } },
      alternateRowStyles: { fillColor: [255, 250, 240] }
    });

    // -- BOTTOM SECTION: SKILLS & ATTENDANCE --
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Check if we have room, else add page
    if (finalY > 220) { doc.addPage(); finalY = 20; }

    // 1. Attendance Box
    doc.setDrawColor(0, 0, 0); doc.setFillColor(255, 255, 255);
    doc.rect(14, finalY, 50, 25);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(153,0,0);
    doc.text("ATTENDANCE", 16, finalY + 5);
    doc.setFont("helvetica", "normal"); doc.setTextColor(0,0,0);
    doc.text(`School Opened: ${reportDetails?.days_school_open || '-'}`, 16, finalY + 12);
    doc.text(`Days Present: ${reportDetails?.days_present || '-'}`, 16, finalY + 17);
    doc.text(`Days Absent: ${reportDetails?.days_absent || '-'}`, 16, finalY + 22);

    // 2. Skills Grid (Psychomotor)
    if (reportDetails?.psychomotor_skills) {
        const skills = reportDetails.psychomotor_skills;
        const skillKeys = Object.keys(skills);
        if (skillKeys.length > 0) {
            autoTable(doc, {
                startY: finalY,
                margin: { left: 70 },
                head: [['PSYCHOMOTOR SKILLS', 'RATING']],
                body: skillKeys.map(k => [k, skills[k]]),
                theme: 'grid',
                tableWidth: 60,
                headStyles: { fillColor: [50, 50, 50], fontSize: 8 },
                bodyStyles: { fontSize: 8, cellPadding: 1 }
            });
        }
    }

    // 3. Affective Grid
    if (reportDetails?.affective_skills) {
        const skills = reportDetails.affective_skills;
        const skillKeys = Object.keys(skills);
        if (skillKeys.length > 0) {
            autoTable(doc, {
                startY: finalY,
                margin: { left: 135 },
                head: [['AFFECTIVE DOMAIN', 'RATING']],
                body: skillKeys.map(k => [k, skills[k]]),
                theme: 'grid',
                tableWidth: 60,
                headStyles: { fillColor: [50, 50, 50], fontSize: 8 },
                bodyStyles: { fontSize: 8, cellPadding: 1 }
            });
        }
    }

    // -- REMARKS --
    finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY > 260) { doc.addPage(); finalY = 20; }

    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("CLASS TEACHER'S REMARK:", 14, finalY);
    doc.setFont("helvetica", "normal");
    doc.text(reportDetails?.class_teacher_remark || "No remark entered.", 70, finalY);
    doc.line(70, finalY+1, 190, finalY+1);

    finalY += 10;
    doc.setFont("helvetica", "bold");
    doc.text("PRINCIPAL'S REMARK:", 14, finalY);
    doc.setFont("helvetica", "normal");
    doc.text("A good result. Keep it up!", 70, finalY);
    doc.line(70, finalY+1, 190, finalY+1);

    // Dynamic School Resumes line in PDF footer
    finalY += 10;
    doc.setFontSize(9);
    doc.text(`School Resumes: ${resumptionDate}`, 14, finalY);

    doc.save(`${studentProfile.full_name}_Result.pdf`);
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-white text-white">
      <div className="p-8 text-center bg-yellow-300 border-b border-red-800">
         <div className="w-24 h-24 mx-auto rounded-full bg-white border-4 border-yellow-400 relative group overflow-hidden">
             {studentProfile?.passport_url ? <img src={studentProfile.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-3xl font-bold text-yellow-300">{studentProfile?.full_name?.[0]}</span>}
             <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                 <Camera className="text-white" size={24} />
                 <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
             </label>
         </div>
         <h3 className="font-bold text-lg mt-3 truncate">{studentProfile?.full_name || 'Student'}</h3>
         <span className="text-[10px] bg-white text-yellow-700 px-3 py-0.5 rounded-full uppercase tracking-wider">{studentProfile?.current_class || 'Student'}</span>
      </div>
      <nav className="flex-1 text-yellow-300 px-4 py-6 space-y-2">
        <button onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center text-yellow-400 gap-3 px-4 py-3 rounded-lg font-medium ${activeTab === 'overview' ? 'bg-black text-yellow-300 shadow-lg' : 'hover:bg-gray-800 text-green-100'}`}><User size={20} /> My Profile</button>
        <button onClick={() => { setActiveTab('results'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-yellow-400 rounded-lg font-medium ${activeTab === 'results' ? 'bg-black text-yellow-300 shadow-lg' : 'hover:bg-gray-800 text-green-100'}`}><FileText size={20} /> Check Result</button>
      </nav>
      <div className="p-6 bg-black mt-auto"><button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full py-3 bg-red-600 hover:bg-red-900 text-white hover:text-white/25 rounded-xl flex items-center justify-center gap-2 font-bold transition-all"><LogOut size={18} /> Logout</button></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col md:flex-row">
      <SEO title="Student Portal" description="Check results" noindex={true} />
      <header className="md:hidden p-4 bg-yellow-300 text-black border-b flex justify-between items-center sticky top-0 z-20">
         <div className="font-bold text-black"> <img src={logo} className="h-8 w-8 inline rounded-full mr-2" /> Student Portal</div>
         <button onClick={() => setIsMobileMenuOpen(true)}><Menu className="text-black" /></button>
      </header>
      <aside className="hidden md:flex w-72 bg-white shadow-xl sticky top-0 h-screen z-30 flex-col"><SidebarContent /></aside>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}><SheetContent side="left" className="p-0 w-72 bg-white border-none"><SidebarContent /></SheetContent></Sheet>

      <main className="flex-1 h-screen overflow-y-auto">
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in">
              <h1 className="text-3xl font-bold text-black">Welcome, {studentProfile?.full_name?.split(' ')[0]}! </h1>
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-yellow-100 grid md:grid-cols-2 gap-8 items-center">
                 <div className="space-y-4">
                    <div className="flex items-center gap-4"><div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600"><User /></div><div><p className="text-xs text-gray-400 uppercase font-bold">Full Name</p><p className="font-bold text-gray-800 text-lg">{studentProfile?.full_name}</p></div></div>
                    <div className="flex items-center gap-4"><div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600"><School /></div><div><p className="text-xs text-gray-400 uppercase font-bold">Class</p><p className="font-bold text-gray-800 text-lg">{studentProfile?.current_class}</p></div></div>
                 </div>
                 {/* UPDATED: Dynamic Resumption Date Display */}
                 <div className="bg-black rounded-2xl p-6 text-white text-center">
                    <GraduationCap size={48} className="mx-auto mb-4 text-yellow-300" />
                    <h3 className="font-bold text-xl">Next Term Begins</h3>
                    <p className="text-yellow-200 mt-2">{resumptionDate}</p>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
             <div className="space-y-6 animate-in fade-in">
               <h1 className="text-2xl font-bold text-[#064e3b]">Result Checker</h1>
               {/* ... (Rest of Result Checker logic remains same) ... */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex flex-col md:flex-row gap-4 items-end">
                  <div className="w-full"><label className="text-xs font-bold text-gray-500 uppercase">Session</label><select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl font-bold"><option>2025/2026</option></select></div>
                  <div className="w-full"><label className="text-xs font-bold text-gray-500 uppercase">Term</label><select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl font-bold"><option>1st Term</option></select></div>
                  <button onClick={handleCheckResult} disabled={loading} className="w-full md:w-auto px-8 py-3 bg-[#064e3b] text-white font-bold rounded-xl hover:bg-green-900">{loading ? 'Checking...' : 'Check Result'}</button>
               </div>

               {hasChecked && !accessGranted && !loading && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center"><Lock size={32} className="mx-auto text-red-600 mb-2"/><h3 className="text-xl font-bold text-red-900">Locked</h3><p className="text-red-700">Please purchase a PIN.</p></div>
               )}

               {accessGranted && (
                  <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                     <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
                        <div className="p-4 bg-[#064e3b] text-white flex justify-between items-center">
                           <h3 className="font-bold flex items-center gap-2"><CheckCircle size={20}/> Result Sheet</h3>
                           <button onClick={downloadResult} className="bg-white text-[#064e3b] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-green-50"><Download size={14}/> Download PDF</button>
                        </div>
                        <div className="p-6">
                            {/* NEW: REPORT SUMMARY SECTION */}
                            {reportDetails && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-green-50 p-4 rounded-xl border border-green-100">
                                    <div>
                                        <h4 className="font-bold text-[#064e3b] mb-2 uppercase text-xs">Attendance</h4>
                                        <div className="text-sm">
                                            <p>Opened: <b>{reportDetails.days_school_open}</b></p>
                                            <p>Present: <b>{reportDetails.days_present}</b></p>
                                            <p>Absent: <b>{reportDetails.days_absent}</b></p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#064e3b] mb-2 uppercase text-xs">Remarks</h4>
                                        <p className="text-sm italic text-gray-700">"{reportDetails.class_teacher_remark || 'No remark'}"</p>
                                        <p className="text-xs text-gray-500 mt-1">- Class Teacher</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#064e3b] mb-2 uppercase text-xs">Summary</h4>
                                        <div className="text-sm">
                                            <p>Total Score: <b>{totalScore}</b></p>
                                            <p>Average: <b>{average}%</b></p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ACADEMIC TABLE */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-green-100 text-[#064e3b]"><tr><th className="p-3">Subject</th><th className="p-3 text-center">CA</th><th className="p-3 text-center">Exam</th><th className="p-3 text-center">Total</th><th className="p-3 text-center">Grade</th><th className="p-3">Remark</th></tr></thead>
                                    <tbody className="divide-y divide-green-50">
                                        {resultData.map((res) => (
                                            <tr key={res.id} className="hover:bg-green-50/30">
                                                <td className="p-3 font-bold">{res.subject}</td>
                                                <td className="p-3 text-center text-gray-500">{(res.ca1_score||0)+(res.ca2_score||0)}</td>
                                                <td className="p-3 text-center text-gray-500">{res.exam_score}</td>
                                                <td className="p-3 text-center font-bold text-[#064e3b]">{res.total_score}</td>
                                                <td className={`p-3 text-center font-bold ${res.total_score < 40 ? 'text-red-500' : 'text-green-600'}`}>{res.grade}</td>
                                                <td className="p-3 text-xs italic text-gray-500">{res.remarks}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                     </div>
                  </div>
               )}
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;