import { useEffect, useRef, useState } from "react";
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { fetchEvents, registerForEvent, type EventDto } from "@/lib/eventsApi";
import { useToast } from "@/hooks/use-toast";

const EventsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events, isLoading, isError } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  const registerMutation = useMutation({
    mutationFn: (eventId: string) => registerForEvent(eventId),
    onSuccess: (updatedEvent) => {
      queryClient.setQueryData<EventDto[]>(["events"], (prev) => {
        if (!prev) return prev;
        return prev.map((e) => (e._id === updatedEvent._id ? updatedEvent : e));
      });
      toast({
        title: "Registered",
        description: "Your registration has been recorded.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Registration failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleRegister = async (event: EventDto) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to register for an event.",
        variant: "destructive",
      });
      return;
    }
    if (event.hasRegistered) return;
    registerMutation.mutate(event._id);
  };

  return (
    <section
      id="events"
      ref={sectionRef}
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-6">
            Upcoming Events
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Level Up Your <span className="text-gradient-orange">Skills</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Join our exciting events designed to enhance your coding abilities and expand your network.
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {isLoading && (
            <div className="col-span-full text-center text-muted-foreground">Loading events...</div>
          )}
          {isError && (
            <div className="col-span-full text-center text-destructive">Failed to load events.</div>
          )}
          {(events || []).slice(0, 3).map((event, index) => (
            <Card
              key={event._id}
              variant="glow"
              className={`group hover:scale-[1.02] transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
            >
            {/* Event Image */}
            <div className="relative overflow-hidden rounded-t-xl">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                event.mode === "Online"
                  ? "bg-green-500/30 text-green-400 border border-green-500/30"
                  : event.mode === "Offline"
                  ? "bg-blue-500/30 text-blue-400 border border-blue-500/30"
                  : "bg-purple-500/30 text-purple-400 border border-purple-500/30"
              }`}>
                {event.mode}
              </span>
            </div>
            <CardHeader className="pt-4">
              <CardTitle className="group-hover:text-primary transition-colors">
                {event.title}
              </CardTitle>
            </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{event.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{event.location}</span>
                  </div>
                  <div className="text-muted-foreground">
                    Students applied: <span className="text-foreground font-medium">{event.registeredCount}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="hero"
                  className="w-full"
                  disabled={event.hasRegistered || registerMutation.isPending}
                  onClick={() => handleRegister(event)}
                >
                  {event.hasRegistered ? "Applied" : "Register Now"}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className={`text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`} style={{ transitionDelay: "600ms" }}>
          <Link to="/events">
            <Button variant="hero" size="lg">
              View All Events
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
