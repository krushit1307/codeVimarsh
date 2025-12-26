import { Github, Linkedin, Instagram, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative py-12 border-t border-border bg-card/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Code Vimarsh" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-display font-semibold">
                <span className="text-gradient-orange">Code</span> Vimarsh
              </p>
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} All rights reserved
              </p>
            </div>
          </div>

          {/* Made with love */}
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            Made By Team @Code-Vimarsh
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/code-vimarsh"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-secondary/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://www.linkedin.com/company/code-vimarsh/posts/?feedView=all"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-secondary/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="https://www.instagram.com/code_vimarsh?igsh=aDcydDEzMnNxbWh5"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-secondary/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
