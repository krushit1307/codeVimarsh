import { useEffect, useRef, useState } from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type ResourceLink = {
  label: string;
  href: string;
};

type OEmbedData = {
  title: string;
  thumbnail_url?: string;
};

type ResourceCategory = {
  title: string;
  description: string;
  thumbnailUrl: string;
  links: ResourceLink[];
};

const resources: ResourceCategory[] = [
  {
    title: "C Language",
    description: "Start from fundamentals and build strong C programming basics with structured playlists and tutorials.",
    thumbnailUrl: "https://i.ytimg.com/vi/irqbmMNs2Bo/hqdefault.jpg",
    links: [
      { label: "Link 1", href: "https://youtu.be/irqbmMNs2Bo?si=1eoGIDhM7iuox6jQ" },
      { label: "Link 2", href: "https://youtu.be/aZb0iu4uGwA?si=IhK_AUZoDVH5OBxO" },
      {
        label: "Link 3",
        href: "https://youtube.com/playlist?list=PLxgZQoSe9cg1drBnejUaDD9GEJBGQ5hMt&si=FUXqxnQyYgILsmfn",
      },
      {
        label: "Link 4",
        href: "https://youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR&si=BLJd6hFh6w_e0VMg",
      },
      {
        label: "Link 5",
        href: "https://youtube.com/playlist?list=PLBlnK6fEyqRggZZgYpPMUxdY1CYkZtARR&si=I-hpuBrxn1gYO-DL",
      },
      {
        label: "Link 6",
        href: "https://youtube.com/playlist?list=PLdo5W4Nhv31a8UcMN9-35ghv8qyFWD9_S&si=XjaxH6LEKUCXP_DI",
      },
      { label: "Link 7", href: "https://youtu.be/ZSPZob_1TOk?si=ES2JI0XmzzTIANC8" },
    ],
  },
  {
    title: "C++ Language",
    description: "Learn modern C++ concepts and build problem-solving skills with popular playlists and crash courses.",
    thumbnailUrl: "https://i.ytimg.com/vi/8jLOx1hD3_o/hqdefault.jpg",
    links: [
      {
        label: "Link 1",
        href: "https://youtube.com/playlist?list=PLfqMhTWNBTe0b2nM6JHVCnAkhQRGiZMSJ&si=Z2vb4T_t1PVHe-u0",
      },
      {
        label: "Link 2",
        href: "https://youtube.com/playlist?list=PLlrATfBNZ98dudnM48yfGUldqGD0S4FFb&si=jIGRwyBgNRKhijkH",
      },
      {
        label: "Link 3",
        href: "https://youtube.com/playlist?list=PLDoPjvoNmBAwy-rS6WKudwVeb_x63EzgS&si=AV58sgDa817JLiDF",
      },
      { label: "Link 4", href: "https://youtu.be/8jLOx1hD3_o?si=migFGyg9_vCl5Pd9" },
    ],
  },
  {
    title: "Java Language",
    description: "Strengthen Java fundamentals and OOP with curated playlists and topic-wise video lessons.",
    thumbnailUrl: "https://i.ytimg.com/vi/PymbRTMb4hY/hqdefault.jpg",
    links: [
      {
        label: "Link 1",
        href: "https://youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q&si=32O13gWlDZw_rWep",
      },
      {
        label: "Link 2",
        href: "https://youtube.com/playlist?list=PLfqMhTWNBTe3LtFWcvwpqTkUSlB32kJop&si=j41124fcwA2WWq6d",
      },
      {
        label: "Link 3",
        href: "https://youtube.com/playlist?list=PLsyeobzWxl7pe_IiTfNyr55kwJPWbgxB5&si=_79kP0Y4B9BIIT68",
      },
      { label: "Link 4", href: "https://youtu.be/PymbRTMb4hY?si=KadpclfTia7K0fFD" },
      { label: "Link 5", href: "https://youtu.be/32DLasxoOiM?si=44cyvZoBbflJO28s" },
      { label: "Link 6", href: "https://youtu.be/grEKMHGYyns?si=wg6ccsVB7oxAll5Y" },
    ],
  },
  {
    title: "DSA Playlists",
    description: "Deep dive into DSA patterns and problem sets with structured playlists from multiple creators.",
    thumbnailUrl: "https://placehold.co/800x450/0f172a/f97316?text=DSA+Playlists",
    links: [
      {
        label: "Link 1",
        href: "https://youtube.com/playlist?list=PLfqMhTWNBTe137I_EPQd34TsgV6IO55pt&si=62JwJMQb-N1TIa5P",
      },
      {
        label: "Link 2",
        href: "https://youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz&si=LosOLaz3slqRcYWO",
      },
      {
        label: "Link 3",
        href: "https://youtube.com/playlist?list=PLDzeHZWIZsTryvtXdMr6rPh4IDexB5NIA&si=17rFLQ1SffsfEggp",
      },
      {
        label: "Link 4",
        href: "https://youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi&si=5BE5aue2S_JQLKyO",
      },
      {
        label: "Link 5",
        href: "https://youtube.com/playlist?list=PLdo5W4Nhv31bbKJzrsKfMpo_grxuLl8LU&si=o3lXpK6LQ6s3MDc0",
      },
      {
        label: "Link 6",
        href: "https://youtube.com/playlist?list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&si=klimpSPzZMX2PQmR",
      },
      {
        label: "Link 7",
        href: "https://youtube.com/playlist?list=PLQEaRBV9gAFu4ovJ41PywklqI7IyXwr01&si=F5gU3Y2GSirMNZqb",
      },
      {
        label: "Link 8",
        href: "https://youtube.com/playlist?list=PLfqMhTWNBTe3LtFWcvwpqTkUSlB32kJop&si=w_fkE0zICcyXXllp",
      },
      {
        label: "Link 9",
        href: "https://youtube.com/playlist?list=PLxgZQoSe9cg00xyG5gzb5BMkOClkch7Gr&si=NSws-_be9NIpz9KR",
      },
      {
        label: "Link 10",
        href: "https://youtube.com/playlist?list=PLBlnK6fEyqRj9lld8sWIUNwlKfdUoPd1Y&si=dV3CUxQYAkWd61_g",
      },
      {
        label: "Link 11",
        href: "https://youtube.com/playlist?list=PLC36xJgs4dxFCQVvjMrrjcY3XrcMm2GHy&si=T-ydHqKNE0bFXQgf",
      },
    ],
  },
  {
    title: "DSA Sheets",
    description: "Practice efficiently with curated DSA sheets and structured problem lists.",
    thumbnailUrl: "https://placehold.co/800x450/0f172a/60a5fa?text=DSA+Sheets",
    links: [
      {
        label: "Love Babbar",
        href: "https://www.geeksforgeeks.org/dsa/dsa-sheet-by-love-babbar/",
      },
      {
        label: "Striver's A2Z",
        href: "https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z",
      },
      {
        label: "NeetCode 150",
        href: "https://leetcode.com/problem-list/plakya4j/",
      },
      {
        label: "AlgoPrep's 151",
        href: "https://docs.google.com/spreadsheets/d/1kyHfGGaLTzWspcqMUUS5Httmip7t8LJB0P-uPrRLGos/edit?gid=0#gid=0",
      },
      {
        label: "All DSA Sheet",
        href: "https://sdesheets.bio.link/",
      },
      {
        label: "DSA Pattern Sheet",
        href: "https://docs.google.com/spreadsheets/d/1T5-nGsJ9WNwna44e9WWRD0jlZIT5KxVOGvylcvvVrY8/edit?gid=0#gid=0",
      },
    ],
  },
  {
    title: "Web Development Playlists",
    description: "Learn frontend + backend development with structured playlists and full tutorials.",
    thumbnailUrl: "https://i.ytimg.com/vi/HVjjoMvutj4/hqdefault.jpg",
    links: [
      {
        label: "Link 1",
        href: "https://youtube.com/playlist?list=PLu0W_9lII9agq5TrH9XLIKQvv0iaF2X3w&si=1YLU9wvDvtsj6P7b",
      },
      {
        label: "Link 2",
        href: "https://youtube.com/playlist?list=PLDzeHZWIZsTo0wSBcg4-NMIbC0L8evLrD&si=3nnmqw0vBnAI9Asv",
      },
      {
        label: "Link 3",
        href: "https://youtube.com/playlist?list=PLfqMhTWNBTe3H6c9OGXb5_6wcc1Mca52n&si=4cWKqs1mK2yNdTgv",
      },
      {
        label: "Link 4",
        href: "https://youtube.com/playlist?list=PLfqMhTWNBTe0PY9xunOzsP5kmYIz2Hu7i&si=Jbgz590k1j_kz3PK",
      },
      {
        label: "Link 5",
        href: "https://youtube.com/playlist?list=PLbtI3_MArDOkxh7XzixN2G4NAGIVqTFon&si=-_XIcVc1832pBnuz",
      },
      { label: "Link 6", href: "https://youtu.be/HVjjoMvutj4?si=O_H1DArtKS-UvjY2" },
    ],
  },
];

const ResourcesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState<string | null>(null);
  const [oembedByHref, setOembedByHref] = useState<Record<string, OEmbedData | null>>({});

  const selectedCategory = selectedCategoryTitle
    ? resources.find((c) => c.title === selectedCategoryTitle) ?? null
    : null;

  const isDialogOpen = selectedCategoryTitle !== null;

  const YOUTUBE_FALLBACK_THUMBNAIL = "https://www.youtube.com/img/desktop/yt_1200.png";

  const getYoutubeVideoId = (urlString: string) => {
    try {
      const url = new URL(urlString);

      if (url.hostname === "youtu.be") {
        const id = url.pathname.replace("/", "").trim();
        return id || null;
      }

      if (url.hostname.includes("youtube.com")) {
        const v = url.searchParams.get("v");
        if (v) return v;
        if (url.pathname.startsWith("/shorts/")) {
          const id = url.pathname.replace("/shorts/", "").split("/")[0];
          return id || null;
        }
      }

      return null;
    } catch {
      return null;
    }
  };

  const getLinkThumbnailUrl = (href: string, fallback?: string) => {
    const youtubeId = getYoutubeVideoId(href);
    if (youtubeId) {
      return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
    }

    try {
      const url = new URL(href);
      const domain = url.hostname;
      if (domain.includes("youtube.com") || domain.includes("youtu.be")) {
        return YOUTUBE_FALLBACK_THUMBNAIL;
      }
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
      return fallback ?? "https://placehold.co/800x450/0f172a/60a5fa?text=Resource";
    }
  };

  const isYoutubeUrl = (href: string) => {
    try {
      const url = new URL(href);
      const host = url.hostname;
      return host.includes("youtube.com") || host.includes("youtu.be");
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!isDialogOpen || !selectedCategory) return;

    const controller = new AbortController();

    const fetchOEmbed = async (href: string) => {
      if (!isYoutubeUrl(href)) return;
      if (oembedByHref[href] !== undefined) return;

      try {
        const oembedUrl = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(href)}`;
        const res = await fetch(oembedUrl, { signal: controller.signal });
        if (!res.ok) {
          setOembedByHref((prev) => ({ ...prev, [href]: null }));
          return;
        }
        const data = (await res.json()) as { title?: string; thumbnail_url?: string };
        if (!data?.title) {
          setOembedByHref((prev) => ({ ...prev, [href]: null }));
          return;
        }
        setOembedByHref((prev) => ({
          ...prev,
          [href]: { title: data.title, thumbnail_url: data.thumbnail_url },
        }));
      } catch {
        setOembedByHref((prev) => ({ ...prev, [href]: null }));
      }
    };

    selectedCategory.links.forEach((l) => {
      void fetchOEmbed(l.href);
    });

    return () => controller.abort();
  }, [isDialogOpen, selectedCategoryTitle]);

  const getLinkMeta = (href: string) => {
    try {
      const url = new URL(href);
      const hostname = url.hostname.replace(/^www\./, "");
      return { hostname, pathname: url.pathname };
    } catch {
      return { hostname: "", pathname: "" };
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="resources" ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[720px] h-[320px] bg-primary/5 rounded-full blur-[110px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-6">
              Resources
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Learn with <span className="text-gradient-orange">Curated</span> Playlists &amp; Sheets
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-3xl">
              Explore structured learning paths for languages, DSA, and web development. Each card contains the exact links shared by the community.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((category, index) => (
              <Card
                key={category.title}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedCategoryTitle(category.title)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedCategoryTitle(category.title);
                  }
                }}
                className={`group relative overflow-hidden border-border/60 bg-card/40 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:scale-[1.01] hover:border-primary/40 hover:shadow-xl hover:shadow-orange-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 90 + 150}ms` }}
              >
                <div className="pointer-events-none absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/25 via-transparent to-primary/20 blur-xl" />
                </div>

                <div className="relative h-36 w-full overflow-hidden">
                  <img
                    src={category.thumbnailUrl}
                    alt={category.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
                  <div className="absolute left-4 bottom-3 flex items-center gap-2 text-sm font-medium">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 border border-primary/30">
                      <BookOpen className="w-4 h-4 text-primary" />
                    </span>
                    <span className="text-foreground/95">{category.title}</span>
                  </div>
                </div>

                <CardHeader className="relative pb-2">
                  <CardTitle className="text-lg font-display">{category.title}</CardTitle>
                </CardHeader>

                <CardContent className="relative">
                  <p className="text-sm text-muted-foreground mb-4">{category.description}</p>

                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/30 px-3 py-2">
                    <span className="text-sm text-muted-foreground">Open to view all links</span>
                    <span className="inline-flex items-center gap-2 text-sm text-foreground/90">
                      {category.links.length} links
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => (!open ? setSelectedCategoryTitle(null) : undefined)}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-background text-foreground p-0">
              {selectedCategory ? (
                <div className="grid md:grid-cols-[360px_1fr]">
                  <div className="relative border-b md:border-b-0 md:border-r border-border/60">
                    <div className="relative h-44 md:h-full md:min-h-[520px]">
                      <img
                        src={selectedCategory.thumbnailUrl}
                        alt={selectedCategory.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                      <div className="absolute left-6 bottom-6 right-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/30">
                            <BookOpen className="w-5 h-5 text-primary" />
                          </span>
                          <DialogHeader className="space-y-1 text-left">
                            <DialogTitle className="font-display text-2xl">{selectedCategory.title}</DialogTitle>
                            <DialogDescription className="text-sm">{selectedCategory.description}</DialogDescription>
                          </DialogHeader>
                        </div>
                        <div className="text-sm text-muted-foreground">{selectedCategory.links.length} resources</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <ScrollArea className="h-[65vh] md:h-[520px] pr-3">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {selectedCategory.links.map((link) => {
                          const meta = getLinkMeta(link.href);
                          const oembed = oembedByHref[link.href];
                          const title = oembed?.title ?? link.label;
                          const thumb =
                            oembed?.thumbnail_url ??
                            (isYoutubeUrl(link.href)
                              ? YOUTUBE_FALLBACK_THUMBNAIL
                              : getLinkThumbnailUrl(link.href, selectedCategory.thumbnailUrl));

                          return (
                            <a
                              key={link.href}
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block rounded-xl border border-border/60 bg-card/40 overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-orange-500/10"
                            >
                              <div className="relative h-28 w-full overflow-hidden">
                                <img
                                  src={thumb}
                                  alt={link.label}
                                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/25 to-transparent" />
                              </div>

                              <div className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="font-medium text-foreground/95 line-clamp-2">{title}</div>
                                    {meta.hostname ? (
                                      <div className="text-xs text-muted-foreground truncate mt-1">{meta.hostname}</div>
                                    ) : null}
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5" />
                                </div>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <DialogHeader className="space-y-1 text-left">
                    <DialogTitle className="font-display text-2xl">Resources</DialogTitle>
                    <DialogDescription className="text-sm">
                      Something went wrong while opening this topic. Please close and try again.
                    </DialogDescription>
                  </DialogHeader>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
};

export default ResourcesSection;
