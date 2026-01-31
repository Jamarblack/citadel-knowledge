import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, School, ArrowRight, Loader2 } from "lucide-react";
import SEO from "@/components/SEO";
import logo from "/school-logo.png";

const StaffLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Check if staff exists with these credentials
      // Note: We force email to lowercase here too just to be safe
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('email', formData.email.toLowerCase())
        .eq('password_text', formData.password) // Using plain text for simple auth, or swap for proper auth
        .single();

      if (error || !data) {
        throw new Error("Invalid email or password");
      }

      // 2. Save Session
      localStorage.setItem('staffId', data.id);
      localStorage.setItem('role', data.role); // 'Principal', 'Teacher', 'Bursar', etc.

      toast.success(`Welcome back, ${data.full_name}!`);

      // 3. Redirect based on Role
      if (data.role === 'Proprietor') navigate('/proprietor-dashboard');
      else if (data.role === 'Principal') navigate('/principal-dashboard');
      else if (data.role === 'Head Teacher') navigate('/head-teacher-dashboard');
      else if (data.role === 'Bursar') navigate('/bursar-dashboard');
      else navigate('/teacher-dashboard'); // Default to Teacher Dashboard

    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f5f2] flex items-center justify-center p-4 font-sans">
      <SEO title="Staff Login | Citadel" description="Secure Staff Access" />
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-amber-100">
        {/* Header */}
        <div className="bg-[#2c0a0e] p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="w-20 h-22 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
            <img src={logo} alt="School Logo" className="w-20 h-20 rounded-full" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Staff Portal</h1>
          <p className="text-amber-200/80 text-sm">Secure access for school administration</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Email Input (LOWERCASE FORCED) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-[#2c0a0e] transition-colors" size={20} />
                <input 
                  required
                  type="email" 
                  placeholder="name@school.com"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#2c0a0e] focus:ring-4 focus:ring-[#2c0a0e]/5 outline-none transition-all font-medium lowercase"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Access PIN / Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-[#2c0a0e] transition-colors" size={20} />
                <input 
                  required
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#2c0a0e] focus:ring-4 focus:ring-[#2c0a0e]/5 outline-none transition-all font-medium"
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
              className="w-full py-4 bg-[#2c0a0e] hover:bg-[#3d0e14] text-[#fcf6ba] rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={20} /></>}
            </button>

          </form>
          
          <div className="mt-8 text-center">
            <a href="/" className="text-sm font-bold text-gray-400 hover:text-[#2c0a0e] transition-colors">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;