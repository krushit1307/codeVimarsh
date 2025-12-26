import { useEffect, useRef, useState } from "react";
import { Target, Users, Rocket, Code } from "lucide-react";

const features = [
  {
    icon: Code,
    title: "Master DSA",
    description:
      "Strengthen your core problem-solving skills through curated DSA contests, quizzes, and practice sessions. We help students bridge the gap between academic theory and competitive programming, building confidence in algorithms, data structures, and optimization techniques.",
  },
  {
    icon: Target,
    title: "Expert Insights",
    description:
      "Gain real-world perspectives through seminars by industry experts and fireside chats with big tech professionals. These sessions offer career guidance, interview preparation tips, and a deep understanding of how software is built and scaled in top tech companies.",
  },
  {
    icon: Rocket,
    title: "Hands-on Tools",
    description:
      "Learn by doing. Our workshops cover a wide range of developer tools and technologies including version control, containers, cloud platforms, and modern tech stacks. These sessions ensure students gain practical exposure beyond coding problems.",
  },
  {
    icon: Users,
    title: "Community First",
    description:
      "At Code Vimarsh, growth happens together. Join a collaborative and supportive student community where members mentor each other, share resources, work on projects, and build lasting connections within MSU’s tech ecosystem.",
  },
];

const AboutSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-30">
        <div className="absolute top-20 right-20 w-72 h-72 border border-primary/20 rounded-full animate-spin-slow" />
        <div className="absolute top-40 right-40 w-48 h-48 border border-primary/10 rounded-full animate-spin-slow" style={{ animationDirection: "reverse" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}>
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-6">
              About Us
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Empowering the Next Generation of{" "}
              <span className="text-gradient-orange">Developers</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Code Vimarsh is the premier DSA-focused coding community of the CSE Department at MSU Baroda. We bring together students who are passionate about logic, problem-solving, and building strong computer science fundamentals.
            </p>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Our focus goes beyond classrooms. Through DSA-driven learning, competitive programming, industry exposure, and hands-on technical training, we prepare students to confidently face real-world software challenges and global tech opportunities.
            </p>
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-xl">What We Do</h3>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <p className="text-muted-foreground">Weekly DSA Sprints: Focused sessions on algorithms, problem-solving patterns, and logical thinking.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <p className="text-muted-foreground">Coding Quizzes &amp; Contests: Competitive events inspired by platforms like LeetCode and Codeforces.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <p className="text-muted-foreground">Industry Seminars &amp; Fireside Chats: Interactive sessions with industry veterans and big-tech professionals.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <p className="text-muted-foreground">Tech Workshops: Practical workshops on modern tools, frameworks, and developer technologies.</p>
              </div>
            </div>
          </div>

          {/* Right Content - Feature Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group p-6 rounded-2xl bg-card/50 border border-border hover:border-primary/50 hover:bg-card transition-all duration-500 hover:shadow-lg hover:shadow-primary/10 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100 + 200}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;