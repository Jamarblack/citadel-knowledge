import { Link } from "react-router-dom";
import schoolLogo from "@/assets/school-logo.png";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={schoolLogo} alt="Citadel of Knowledge" className="h-12 w-12" />
          <div className="hidden sm:block">
            <h1 className="font-heading font-bold text-secondary text-lg leading-tight">
              Citadel of Knowledge
            </h1>
            <p className="text-xs text-muted-foreground">International School</p>
          </div>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link to="/" className="nav-link hidden md:block">Home</Link>
          <Link to="/#about" className="nav-link hidden md:block">About</Link>
          <Link to="/student-login" className="nav-link">Student Portal</Link>
          <Link to="/staff-login" className="nav-link">Staff Portal</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
