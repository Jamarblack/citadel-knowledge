import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, User, GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import SEO from "@/components/SEO";
import logo from "/school-logo.png";

const StudentLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    admissionNumber: "",
    password: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Authenticate Student
      // Note: We force admission number to uppercase here too for the query
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('admission_number', formData.admissionNumber.toUpperCase()) 
        .eq('password_text', formData.password)
        .single();

      if (error || !data) {
        throw new Error("Invalid Admission Number or Password");
      }

      // 2. Save Session
      localStorage.setItem('studentId', data.id);
      
      toast.success("Login Successful!");
      navigate('/student-dashboard');

    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <SEO title="Student Login | Citadel" description="Student Portal Access" />
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-green-100">
        {/* Header */}
        <div className="bg-yellow-300 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="w-20 h-20  rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm ">
            <img src={logo} alt="School Logo" className="w-20 h-20 rounded-full" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Student Portal</h1>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Admission Number Input (UPPERCASE FORCED) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Admission Number</label>
              <div className="relative group">
                <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-[#064e3b] transition-colors" size={20} />
                <input 
                  required
                  type="text" 
                  placeholder="CKIS/***/****"
                  className="w-full pl-12 r-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#064e3b] focus:ring-4 focus:ring-[#064e3b]/5 outline-none transition-all font-medium font-mono uppercase placeholder:normal-case"
                  value={formData.admissionNumber}
                  onChange={(e) => setFormData({...formData, admissionNumber: e.target.value.toUpperCase()})}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-[#064e3b] transition-colors" size={20} />
                <input 
                  required
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#064e3b] focus:ring-4 focus:ring-[#064e3b]/5 outline-none transition-all font-medium"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-red-600 hover:bg-red-800 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Login <ArrowRight size={20} /></>}
            </button>

          </form>
          
          <div className="mt-8 text-center">
            <a href="/" className="text-sm font-bold text-gray-400 hover:text-[#064e3b] transition-colors">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;