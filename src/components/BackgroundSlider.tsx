import { useState, useEffect } from "react";

const backgrounds = [
  {
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center",
    alt: "Mountain landscape with lake",
  },
  {
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop&crop=center",
    alt: "Forest and mountains at sunset",
  },
  {
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop&crop=center",
    alt: "Wild nature with flowers",
  },
];

export default function BackgroundSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % backgrounds.length);
        setIsTransitioning(false);
      }, 1000);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div
        className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
          isTransitioning ? "scale-110 opacity-80" : "scale-100 opacity-100"
        }`}
        style={{
          backgroundImage: `url(${backgrounds[currentIndex].url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-black/50 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/20" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {backgrounds.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-white scale-125" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
