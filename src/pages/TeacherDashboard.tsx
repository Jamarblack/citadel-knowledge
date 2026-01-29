import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Layers, Users, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import schoolLogo from "/school-logo.png";
import SEO from "@/components/SEO";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Result Input States
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, { ca: number, exam: number }>>({});

  useEffect(() => {
    const id = localStorage.getItem('staffId');
    if (!id) navigate('/');
    fetchTeacher(id!);
    fetchSubjects();
  }, []);

  const fetchTeacher = async (id: string) => {
    const { data } = await supabase.from('staff').select('*').eq('id', id).single();
    if (data) setTeacher(data);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').order('name');
    if (data) setSubjects(data || []);
  };

  const loadStudents = async () => {
    if (!selectedClass || !selectedSubject) return;
    setLoading(true);
    try {
      // 1. Fetch Students
      const { data: classStudents } = await supabase.from('students').select('*').eq('current_class', selectedClass).order('full_name');
      
      // 2. Fetch Existing Scores
      const { data: results } = await supabase.from('results')
        .select('*')
        .eq('class_name', selectedClass)
        .eq('subject', selectedSubject);

      const scoreMap: any = {};
      results?.forEach((r: any) => { scoreMap[r.student_id] = { ca: r.ca_score, exam: r.exam_score }; });

      setStudents(classStudents || []);
      setScores(scoreMap);
    } catch (e) { toast.error("Error loading data"); } 
    finally { setLoading(false); }
  };

  const saveScore = async (student: any) => {
    const s = scores[student.id] || { ca: 0, exam: 0 };
    const { error } = await supabase.from('results').upsert({
      student_id: student.id,
      student_name: student.full_name,
      admission_number: student.admission_number,
      subject: selectedSubject,
      class_name: selectedClass,
      term: '1st Term', session: '2025/2026', // Ideally from Settings
      ca_score: s.ca, exam_score: s.exam,
      status: 'pending', // IMPORTANT: Needs approval
      uploader_name: teacher.full_name,
      uploader_id: teacher.id
    }, { onConflict: 'student_id, subject, term, session' });

    if (error) toast.error("Failed");
    else toast.success("Saved & Sent for Approval");
  };

  // Helper to filter allowed classes based on Section
  const getClasses = () => {
    if (teacher?.section === 'Primary') return ['Creche', 'KG 1', 'KG 2', 'KG 3', 'Pry 1', 'Pry 2', 'Pry 3', 'Pry 4', 'Pry 5'];
    if (teacher?.section === 'Secondary') return ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];
    return [];
  };

  // Helper to filter subjects (Simplified for brevity)
  const getSubjects = () => {
    if (!selectedClass) return [];
    const isJunior = ['JSS 1', 'JSS 2', 'JSS 3'].includes(selectedClass);
    const isSenior = ['SS 1', 'SS 2', 'SS 3'].includes(selectedClass);
    // Add detailed filtering logic here similar to previous dashboard
    return subjects; 
  };

  return (
    <div className="min-h-screen bg-[#f8f5f2] font-sans">
        <SEO 
        title="Citadel School of Excellence | Best School in Oko Erin, Kwara"
        description="Enroll at Citadel School, the leading primary and secondary school in Oko Erin, Kwara State. We offer world-class education, modern facilities, and a moral foundation for your child."
      />
      <header className="bg-white border-b border-[#2c0a0e]/10 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
           <img src={schoolLogo} className="w-10 h-10" />
           <div><h1 className="font-bold text-xl text-[#2c0a0e]">Teacher Portal</h1><p className="text-xs text-gray-500">{teacher?.full_name}</p></div>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-sm font-bold text-[#540b0e] flex items-center gap-2">
          <LogOut size={16} /> Sign Out
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-6 mt-6">
        <div className="bg-white p-2 rounded-xl inline-flex gap-2 shadow-sm">
          {['profile', 'input'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 rounded-lg text-sm font-bold ${activeTab === t ? 'bg-[#2c0a0e] text-[#fcf6ba]' : 'text-gray-500'}`}>
              {t === 'profile' ? 'My Profile' : 'Input Results'}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-6">
        {activeTab === 'profile' && teacher && (
           <div className="bg-white p-8 rounded-3xl shadow-lg border border-[#d4af37]/20 max-w-xl">
             <h2 className="text-2xl font-bold mb-4">Welcome, {teacher.full_name}</h2>
             <div className="grid grid-cols-2 gap-4">
               <div className="p-3 bg-gray-50 rounded">
                 <p className="text-xs text-gray-500">Class Assigned</p>
                 <p className="font-bold">{teacher.assigned_class || "None"}</p>
               </div>
               <div className="p-3 bg-gray-50 rounded">
                 <p className="text-xs text-gray-500">Section</p>
                 <p className="font-bold">{teacher.section}</p>
               </div>
             </div>
           </div>
        )}

        {activeTab === 'input' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#d4af37]/20">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
               <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="p-3 border rounded-xl bg-gray-50">
                 <option value="">Select Class</option>
                 {getClasses().map(c => <option key={c}>{c}</option>)}
               </select>
               <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="p-3 border rounded-xl bg-gray-50">
                 <option value="">Select Subject</option>
                 {getSubjects().map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
               </select>
               <button onClick={loadStudents} className="bg-[#2c0a0e] text-[#fcf6ba] font-bold rounded-xl p-3">Load Sheet</button>
             </div>

             {students.length > 0 && (
               <table className="w-full">
                 <thead>
                   <tr className="text-left text-sm text-gray-500 border-b">
                     <th className="p-3">Student</th><th className="p-3">CA (40)</th><th className="p-3">Exam (60)</th><th className="p-3">Action</th>
                   </tr>
                 </thead>
                 <tbody>
                   {students.map(s => (
                     <tr key={s.id} className="border-b">
                       <td className="p-3 font-medium">{s.full_name}</td>
                       <td className="p-3"><input type="number" className="w-16 p-2 border rounded text-center" value={scores[s.id]?.ca || ''} onChange={e => setScores({...scores, [s.id]: {...scores[s.id], ca: +e.target.value}})} /></td>
                       <td className="p-3"><input type="number" className="w-16 p-2 border rounded text-center" value={scores[s.id]?.exam || ''} onChange={e => setScores({...scores, [s.id]: {...scores[s.id], exam: +e.target.value}})} /></td>
                       <td className="p-3"><button onClick={() => saveScore(s)} className="p-2 bg-[#2c0a0e] text-white rounded"><Save size={16} /></button></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;