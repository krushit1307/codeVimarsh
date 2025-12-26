import { useEffect, useState } from "react";
import { Github, Linkedin, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

const typingTexts = [
  "DSA Hub",
  "Where Logic Meets Code",
  "Problem-Solving Hub",
  "Master the Core of Computer Science",
  "Shaping Thinkers. Building Coders.",
  "Gateway to DSA Mastery",
  "The Home of Algorithms & Logic",
  "Empowering Problem Solvers",
  "Algorithmic Arena",
  "Built for Coders, Driven by Logic",
];

const HeroSection = () => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentFullText = typingTexts[currentTextIndex];
    const typingSpeed = isDeleting ? 50 : 100;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentFullText.length) {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % typingTexts.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentTextIndex]);

  const scrollToAbout = () => {
    document
      .getElementById("about")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToEvents = () => {
    document
      .getElementById("events")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToTeam = () => {
    document
      .getElementById("team")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Clean orbit system - 2 well-defined rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Outer orbit - slower */}
        <div className="w-[650px] h-[650px] border border-primary/20 rounded-full animate-spin-slow" />
        {/* Inner orbit - medium speed */}
        <div className="absolute w-[380px] h-[380px] border border-primary/25 rounded-full animate-spin-medium" />
      </div>

      {/* Single orbiting planet per ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute animate-orbit-xl">
          <div className="w-2 h-2 rounded-full bg-primary/80 shadow-[0_0_8px_hsl(var(--primary)/0.4)]" />
        </div>
        <div className="absolute animate-orbit-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/70 shadow-[0_0_6px_hsl(var(--primary)/0.3)]" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-8">
            Welcome to the Community
          </span>
        </div>

        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-in-up" style={{ animationDelay: "0.4s", opacity: 0 }}>
          <span className="text-gradient-orange">Code</span> Vimarsh
        </h1>

        <div className="h-16 md:h-20 flex items-center justify-center mb-8">
          <p className="text-2xl md:text-4xl text-muted-foreground font-display animate-fade-in-up" style={{ animationDelay: "0.6s", opacity: 0 }}>
            <span className="text-primary font-semibold">
              {displayText}
              <span className="animate-pulse">|</span>
            </span>
          </p>
        </div>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.8s", opacity: 0 }}>
          Join a thriving community of passionate coders, problem solvers, and tech enthusiasts building the future together.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: "1s", opacity: 0 }}>
          <Button variant="hero" size="xl" onClick={scrollToEvents}>
            Explore Events
          </Button>
          <Button variant="outline_orange" size="xl" onClick={scrollToTeam}>
            Meet the Team
          </Button>
        </div>

        {/* Social Links */}
        <div className="flex items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "1.2s", opacity: 0 }}>
          <a
            href="https://github.com/code-vimarsh"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-secondary/50 border border-border hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
          >
            <Github className="w-6 h-6" />
          </a>
          <a
            href="https://www.linkedin.com/company/code-vimarsh/posts/?feedView=all"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-secondary/50 border border-border hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
          >
            <Linkedin className="w-6 h-6" />
          </a>
          <a
            href="https://www.instagram.com/code_vimarsh?igsh=aDcydDEzMnNxbWh5"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-secondary/50 border border-border hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
          >
            <Instagram className="w-6 h-6" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
