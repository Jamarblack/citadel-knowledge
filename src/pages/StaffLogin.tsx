import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCog, Mail, Lock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import schoolLogo from "@/assets/school-logo.png";

const StaffLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication - accept any input
    if (email && password) {
      navigate("/staff-dashboard");
    } else {
      setError("Please enter your Email and Password");
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--gradient-hero)' }}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 text-secondary-foreground">
        <img src={schoolLogo} alt="School Logo" className="w-32 h-32 mb-8 animate-scale-in" />
        <h1 className="font-heading text-4xl font-bold mb-4 text-center">Staff Portal</h1>
        <p className="text-xl text-secondary-foreground/80 text-center max-w-md">
          Manage student records, enter grades, and access administrative resources.
        </p>
        <div className="mt-12 p-6 rounded-xl bg-secondary-foreground/10 backdrop-blur-sm border border-secondary-foreground/20 max-w-sm">
          <p className="italic text-secondary-foreground/90 text-center">
            "Education for Future Excellence"
          </p>
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft size={18} />
            Back to Home
          </Link>
          
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img src={schoolLogo} alt="School Logo" className="w-20 h-20 mb-4" />
          </div>
          
          <div className="card-elegant p-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-crimson-dark mx-auto mb-6">
              <UserCog size={32} className="text-primary-foreground" />
            </div>
            
            <h2 className="font-heading text-2xl font-bold text-secondary text-center mb-2">
              Staff Login
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Enter your credentials to access the admin portal
            </p>
            
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-6 text-center">
                {error}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="input-field pl-11"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-field pl-11"
                  />
                </div>
              </div>
              
              <button type="submit" className="btn-hero w-full">
                Login to Portal
              </button>
            </form>
            
            <p className="text-muted-foreground text-sm text-center mt-6">
              Having trouble?{" "}
              <a href="#" className="text-primary hover:underline">Contact IT Support</a>
            </p>
          </div>
          
          <p className="text-muted-foreground text-xs text-center mt-6">
            Demo: Enter any Email and Password to login
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
