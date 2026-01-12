import { Link } from "react-router-dom";
import { GraduationCap, UserCog, ArrowRight } from "lucide-react";

const LoginPortals = () => {
  return (
    <section className="py-20 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            Access Your Portal
          </span>
          <h2 className="section-heading">School Management Portals</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Access grades, resources, and administrative tools through our secure portals.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Student Portal */}
          <Link 
            to="/student-login" 
            className="group card-elegant hover:shadow-elegant transition-all duration-300 flex flex-col items-center text-center p-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-navy-light flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <GraduationCap size={40} className="text-secondary-foreground" />
            </div>
            <h3 className="font-heading text-2xl font-semibold text-secondary mb-3">Student Portal</h3>
            <p className="text-muted-foreground mb-6">
              Access your academic records, view results, and track your educational progress.
            </p>
            <span className="inline-flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all duration-300">
              Login to Portal <ArrowRight size={18} />
            </span>
          </Link>
          
          {/* Staff Portal */}
          <Link 
            to="/staff-login" 
            className="group card-elegant hover:shadow-elegant transition-all duration-300 flex flex-col items-center text-center p-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-crimson-dark flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <UserCog size={40} className="text-primary-foreground" />
            </div>
            <h3 className="font-heading text-2xl font-semibold text-secondary mb-3">Staff Portal</h3>
            <p className="text-muted-foreground mb-6">
              Manage student records, enter grades, and access administrative resources.
            </p>
            <span className="inline-flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all duration-300">
              Login to Portal <ArrowRight size={18} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LoginPortals;
