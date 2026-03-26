import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, LogOut, Menu, Camera, 
  FileEdit, BookOpen, CheckCircle, AlertCircle, Save
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SEO from "@/components/SEO";
import logo from "/school-logo.png";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upload");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [myUploadedResults, setMyUploadedResults] = useState<any[]>([]);

  // Score Inputs
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [ca1, setCa1] = useState("");
  const [ca2, setCa2] = useState("");
  const [exam, setExam] = useState("");

  useEffect(() => {
    const id = localStorage.getItem('staffId');
    if (!id) {
      navigate('/');
      return;
    }
    fetchProfile(id);
    fetchMyResults(id);
  }, []);

  const fetchProfile = async (id: string) => {
    const { data } = await supabase.from('staff').select('*').eq('id', id).single();
    if (data) {
      setTeacherProfile(data);
      if (data.assigned_class) {
        setSelectedClass(data.assigned_class);
        fetchStudentsForClass(data.assigned_class);
      }
    }
  };

  const fetchStudentsForClass = async (className: string) => {
    const { data } = await supabase.from('students').select('*').eq('current_class', className).order('full_name');
    if (data) setStudents(data);
  };

  const fetchMyResults = async (teacherId: string) => {
    const { data } = await supabase.from('results').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false });
    if (data) setMyUploadedResults(data);
  };

  // --- AUTOMATIC GRADING SYSTEM ---
  const calculateGradeAndRemark = (totalScore: number, studentClass: string) => {
    const isSecondary = studentClass.includes("JSS") || studentClass.includes("SS");

    if (isSecondary) {
      // SECONDARY GRADING SYSTEM
      if (totalScore >= 80) return { grade: 'A', remark: 'Excellent' };
      if (totalScore >= 70) return { grade: 'B', remark: 'Very Good' };
      if (totalScore >= 60) return { grade: 'C', remark: 'Good' };
      if (totalScore >= 50) return { grade: 'D', remark: 'Average' };
      if (totalScore >= 45) return { grade: 'E', remark: 'Pass' };
      return { grade: 'F', remark: 'Fail' };
    } else {
      // PRIMARY GRADING SYSTEM (Standardized)
      if (totalScore >= 70) return { grade: 'A', remark: 'Excellent' };
      if (totalScore >= 60) return { grade: 'B', remark: 'Very Good' };
      if (totalScore >= 50) return { grade: 'C', remark: 'Good' };
      if (totalScore >= 40) return { grade: 'D', remark: 'Fair' };
      return { grade: 'F', remark: 'Fail' };
    }
  };

  const handleUploadResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedSubject) return toast.error("Please select a student and subject");
    
    setLoading(true);
    
    const ca1Score = Number(ca1) || 0;
    const ca2Score = Number(ca2) || 0;
    const examScore = Number(exam) || 0;
    const totalScore = ca1Score + ca2Score + examScore;

    if (totalScore > 100) {
      setLoading(false);
      return toast.error("Total score cannot exceed 100!");
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    // Run the Auto-Grader!
    const { grade, remark } = calculateGradeAndRemark(totalScore, student.current_class);

    try {
      // Check if result already exists for this student + subject + term (Simplified check)
      const { data: existing } = await supabase.from('results')
        .select('id')
        .eq('student_id', selectedStudentId)
        .eq('subject', selectedSubject)
        .maybeSingle();

      if (existing) {
        toast.error("Result already exists for this student and subject!");
        setLoading(false);
        return;
      }

      await supabase.from('results').insert([{
        student_id: student.id,
        student_name: student.full_name,
        admission_number: student.admission_number,
        class_level: student.current_class,
        teacher_id: teacherProfile.id,
        teacher_name: teacherProfile.full_name,
        subject: selectedSubject,
        ca1_score: ca1Score,
        ca2_score: ca2Score,
        exam_score: examScore,
        total_score: totalScore,
        grade: grade,
        remark: remark,
        status: 'pending' // Goes to Principal/Head Teacher for approval
      }]);

      toast.success(`Result submitted for ${student.full_name}! Total: ${totalScore} (${grade})`);
      
      // Reset form
      setCa1(""); setCa2(""); setExam(""); setSelectedStudentId("");
      fetchMyResults(teacherProfile.id);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length || !teacherProfile) return;
    setUploading(true);
    try {
        const file = event.target.files[0];
        const filePath = `staff_${teacherProfile.id}_${Math.random()}.${file.name.split('.').pop()}`;
        await supabase.storage.from('passports').upload(filePath, file);
        const { data: { publicUrl } } = supabase.storage.from('passports').getPublicUrl(filePath);
        await supabase.from('staff').update({ passport_url: publicUrl }).eq('id', teacherProfile.id);
        setTeacherProfile({ ...teacherProfile, passport_url: publicUrl }); 
        toast.success("Profile Photo Updated");
    } catch (e: any) { 
        toast.error("Upload failed"); 
    } finally { 
        setUploading(false); 
    }
  };

  const subjects = [
    "Mathematics", "English Language", "Basic Science", "Basic Technology", 
    "Civic Education", "Agricultural Science", "Business Studies", "Social Studies",
    "Computer Science", "C.R.S", "I.R.S", "P.H.E", "Economics", "Biology",
    "Physics", "Chemistry", "Government", "Literature in English", "Further Math"
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col text-white">
      <div className="p-8 text-center bg-[#312e81] border-b border-[#1e1b4b]">
         <div className="w-24 h-24 mx-auto rounded-full border-[3px] border-indigo-400 shadow-xl overflow-hidden bg-[#1e1b4b] relative group">
             {teacherProfile?.passport_url ? <img src={teacherProfile.passport_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-2xl font-bold text-indigo-300">T</span>}
             <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Camera className="text-white" size={24} /><input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} /></label>
         </div>
         <h3 className="font-bold text-lg mt-3 truncate">{teacherProfile?.full_name || 'Teacher'}</h3>
         <span className="text-[10px] bg-indigo-500/50 text-indigo-100 px-3 py-0.5 rounded-full uppercase tracking-wider">
           {teacherProfile?.assigned_class || 'Subject Teacher'}
         </span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {[
          { id: 'upload', label: 'Upload Results', icon: FileEdit }, 
          { id: 'history', label: 'My Uploads', icon: BookOpen }
        ].map(item => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${activeTab === item.id ? 'bg-indigo-500 text-white shadow-lg translate-x-1' : 'hover:bg-[#312e81] text-indigo-200'}`}>
            <item.icon size={20} /> {item.label}
          </button>
        ))}
      </nav>
      <div className="p-6 bg-[#1e1b4b] mt-auto">
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="w-full py-3 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded-xl flex items-center justify-center gap-2 font-bold transition-all">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-indigo-50/30 flex font-sans">
      <SEO title="Teacher Portal | Citadel" description="Teacher Area" noindex={true} />
      
      <aside className="hidden lg:block w-72 bg-[#3730a3] shadow-xl sticky top-0 h-screen z-30"><SidebarContent /></aside>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}><SheetContent side="left" className="p-0 w-72 bg-[#3730a3] border-none"><SidebarContent /></SheetContent></Sheet>

      <main className="flex-1 h-screen overflow-y-auto">
        <header className="lg:hidden p-4 bg-white border-b flex justify-between items-center sticky top-0 z-20">
          <button onClick={() => setIsMobileMenuOpen(true)}><Menu className="text-indigo-900" /></button>
          <span className="font-bold text-indigo-900 text-lg"> <img src={logo} alt="School Logo" className="w-8 h-8 inline-block mr-2" /> Teacher Portal</span>
        </header>

        <div className="p-6 md:p-10 max-w-5xl mx-auto">
          
          {activeTab === 'upload' && (
            <div className="animate-in fade-in space-y-6">
              <h1 className="text-2xl font-bold text-gray-800">Upload Student Results</h1>
              <p className="text-gray-500 text-sm">Scores are automatically graded upon submission and sent to the Admin for approval.</p>

              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-indigo-100">
                <form onSubmit={handleUploadResult} className="space-y-6">
                  
                  {/* Selection Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-50">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-indigo-900 uppercase">1. Select Class</label>
                      <select required value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); fetchStudentsForClass(e.target.value); }} className="w-full p-3 bg-white border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700">
                        <option value="">Choose Class</option>
                        {["Creche", "KG 1", "KG 2", "KG 3", "Pry 1", "Pry 2", "Pry 3", "Pry 4", "Pry 5", "JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-indigo-900 uppercase">2. Select Subject</label>
                      <select required value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full p-3 bg-white border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700">
                        <option value="">Choose Subject</option>
                        {subjects.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-indigo-900 uppercase">3. Select Student</label>
                      <select required value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} disabled={!selectedClass} className="w-full p-3 bg-white border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 disabled:opacity-50">
                        <option value="">Choose Student</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Score Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">First CA Score <span className="text-gray-400 font-normal">(Max 20)</span></label>
                      <input type="number" min="0" max="20" required value={ca1} onChange={e => setCa1(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-center" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Second CA Score <span className="text-gray-400 font-normal">(Max 20)</span></label>
                      <input type="number" min="0" max="20" required value={ca2} onChange={e => setCa2(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-center" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Exam Score <span className="text-gray-400 font-normal">(Max 60)</span></label>
                      <input type="number" min="0" max="60" required value={exam} onChange={e => setExam(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-center" placeholder="0" />
                    </div>
                  </div>

                  {/* Auto Total Display */}
                  <div className="p-4 bg-indigo-900 text-white rounded-2xl flex justify-between items-center shadow-inner">
                     <span className="font-bold uppercase tracking-wider text-indigo-200 text-sm">Calculated Total</span>
                     <span className="text-3xl font-bold">{(Number(ca1) || 0) + (Number(ca2) || 0) + (Number(exam) || 0)} <span className="text-lg text-indigo-300">/ 100</span></span>
                  </div>

                  <button disabled={loading} type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex justify-center items-center gap-2">
                    {loading ? 'Submitting...' : <><Save size={20} /> Submit Final Result</>}
                  </button>

                </form>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6 animate-in fade-in">
               <h1 className="text-2xl font-bold text-gray-800">My Upload History</h1>
               <div className="bg-white rounded-3xl shadow-sm border border-indigo-100 overflow-hidden">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-indigo-50 text-indigo-900 border-b border-indigo-100">
                       <tr>
                         <th className="p-4">Student</th>
                         <th className="p-4">Subject</th>
                         <th className="p-4 text-center">Score</th>
                         <th className="p-4 text-center">Grade</th>
                         <th className="p-4">Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                       {myUploadedResults.map(r => (
                         <tr key={r.id} className="hover:bg-indigo-50/30 transition-colors">
                           <td className="p-4 font-bold text-gray-800">
                             {r.student_name}
                             <span className="block text-xs text-gray-400 font-normal">{r.class_level}</span>
                           </td>
                           <td className="p-4 text-gray-600">{r.subject}</td>
                           <td className="p-4 text-center font-bold text-indigo-900">{r.total_score}</td>
                           <td className="p-4 text-center font-bold">{r.grade}</td>
                           <td className="p-4">
                             {r.status === 'approved' ? (
                               <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold w-fit"><CheckCircle size={14}/> Approved</span>
                             ) : r.status === 'rejected' ? (
                               <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold w-fit"><AlertCircle size={14}/> Rejected</span>
                             ) : (
                               <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-full text-xs font-bold w-fit">Pending</span>
                             )}
                           </td>
                         </tr>
                       ))}
                       {myUploadedResults.length === 0 && (
                         <tr><td colSpan={5} className="p-8 text-center text-gray-400">You haven't uploaded any results yet.</td></tr>
                       )}
                     </tbody>
                   </table>
                 </div>
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;