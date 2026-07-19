import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Banner } from "../types";

const FALLBACK_BANNER: Banner = {
  id: "fallback",
  badge: "AUTHORIZED HARDWARE DISTRIBUTOR",
  title: "Professional Components for",
  gradientText: "Next-Gen Engineering",
  description: "Power your industrial and research projects with premium electronic components. From certified microcontrollers to precision environmental sensors, we distribute high-fidelity hardware.",
  buttonText: "Explore Components Catalog",
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFGyTjnauOon5pSBmsV1mM7m11QyMZ6bRpz2httNLibNeyO9SWG97qa3gshw3WnmjDeYrQT3k8VMsdag6BxhybG2r_U4DZFO76xk6Q-48gMhaWhpP2zvJRrqdDvYpPNjSrf83iqhuis0DFASv_Prg32AaSpCyd2UdEUfJiZ7zhbuJhWIyuG0-P9RWpYN8JnO-aNcigsCxr-KBcgZPb2fMH3sp28fM7wr017om1Wbhsdtw0VsphQ0Of",
  caption: "Precision Testing Lab"
};

interface HeroProps {
  banners?: Banner[];
}

export default function Hero({ banners = [] }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeBanners = banners.length > 0 ? banners : [FALLBACK_BANNER];

  // Adjust active index if banners are deleted and index becomes out of bounds
  useEffect(() => {
    if (currentIndex >= activeBanners.length) {
      setCurrentIndex(0);
    }
  }, [activeBanners.length, currentIndex]);

  // Auto rotate every 10 seconds
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const handleScrollToProducts = () => {
    const productsSection = document.getElementById("precision-inventory");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const activeBanner = activeBanners[currentIndex] || FALLBACK_BANNER;

  return (
    <section className="mb-8 md:mb-16 relative">
      <div 
        key={currentIndex} 
        className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 animate-in fade-in duration-700"
      >
        
        {/* Hero Text content */}
        <div className="flex-1 space-y-4 md:space-y-6">
          {activeBanner.badge && (
            <span className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-[#1f2a3c] border border-[#00dbe7]/30 rounded-full font-space text-[9px] md:text-[10px] font-bold tracking-widest text-[#00dbe7] uppercase shadow-[0_0_15px_rgba(0,219,231,0.1)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00dbe7]"></span>
              {activeBanner.badge}
            </span>
          )}
          
          <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-white tracking-tight">
            {activeBanner.title} <br />
            {activeBanner.gradientText && (
              <span className="bg-gradient-to-r from-[#00f2ff] to-[#0266ff] bg-clip-text text-transparent">
                {activeBanner.gradientText}
              </span>
            )}
          </h1>
          
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#d8e3fb]/80 max-w-xl leading-relaxed">
            {activeBanner.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 pt-1 md:pt-2">
            <button
              onClick={handleScrollToProducts}
              className="w-full sm:w-auto px-5 py-2 md:px-6 md:py-3 bg-[#0266ff] hover:bg-[#0266ff]/85 text-white font-space text-[11px] md:text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[#0266ff]/20 cursor-pointer"
            >
              {activeBanner.buttonText || "Explore Components Catalog"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            
            <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-[#d8e3fb]/60">
              <span className="text-[#c3f400]">✓</span>
              <span>Same-Day Shipping • 100% Genuine Parts</span>
            </div>
          </div>
        </div>

        {/* Hero Image / Visualization with Hover Glow */}
        <div className="flex-1 w-full h-[200px] sm:h-[260px] md:h-[400px] rounded-lg md:rounded-xl overflow-hidden relative glass-card group shadow-2xl shrink-0">
          <img
            src={activeBanner.image}
            alt={activeBanner.caption || "BD Robotec"}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
          />
          
          {/* Futuristic glowing overlay HUD */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#081425] via-transparent to-transparent opacity-90" />
          
          {activeBanner.caption && (
            <div className="absolute bottom-2 left-2 right-2 md:bottom-4 md:left-4 md:right-4 flex justify-between items-center bg-[#111c2d]/85 backdrop-blur-md border border-white/10 p-2 md:p-3 rounded text-[10px] md:text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00dbe7]" />
                <span className="text-[#d8e3fb]/80 font-mono">{activeBanner.caption}</span>
              </div>
              <span className="text-[#d8e3fb]/60 font-mono hidden sm:inline">Verified Quality Standard</span>
            </div>
          )}
        </div>

      </div>

      {/* Slide Navigation Indicator Dots (Only visible if there are multiple slides) */}
      {activeBanners.length > 1 && (
        <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-2">
          {activeBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex 
                  ? "w-6 bg-[#00dbe7]" 
                  : "w-2 bg-[#1f2a3c] border border-white/10 hover:bg-[#00dbe7]/40"
              }`}
              title={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

    </section>
  );
}
