import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { 
  Dog, 
  Utensils, 
  Scale, 
  Heart, 
  Syringe, 
  Stethoscope, 
  Trophy,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: <Dog className="w-16 h-16" />,
    title: "Bem-vindo ao Cãolorias!",
    description: "O diário alimentar inteligente para a saúde do seu cão. Acompanhe tudo em um só lugar!",
    color: "from-primary to-primary/80"
  },
  {
    icon: <Utensils className="w-16 h-16" />,
    title: "Registre as Refeições",
    description: "Controle calorias, gramas e horários de cada refeição. Monte cardápios balanceados com facilidade.",
    color: "from-accent to-accent/80"
  },
  {
    icon: <Scale className="w-16 h-16" />,
    title: "Acompanhe o Peso",
    description: "Gráficos de evolução do peso com alertas inteligentes para manter seu cão no peso ideal.",
    color: "from-info to-info/80"
  },
  {
    icon: <Heart className="w-16 h-16" />,
    title: "Monitore a Saúde Digestiva",
    description: "Registre fezes, energia e sintomas. Identifique padrões e intolerâncias alimentares.",
    color: "from-destructive to-destructive/80"
  },
  {
    icon: <Syringe className="w-16 h-16" />,
    title: "Carteira de Saúde",
    description: "Vacinas e vermífugos organizados com lembretes automáticos. Nunca perca uma data importante!",
    color: "from-success to-success/80"
  },
  {
    icon: <Stethoscope className="w-16 h-16" />,
    title: "Conecte seu Veterinário",
    description: "Compartilhe dados de saúde em tempo real com o veterinário do seu cão.",
    color: "from-primary to-accent"
  },
  {
    icon: <Trophy className="w-16 h-16" />,
    title: "Conquistas & Streaks",
    description: "Gamificação para manter a consistência. Desbloqueie conquistas cuidando do seu pet!",
    color: "from-warning to-warning/80"
  }
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useState(() => {
    if (emblaApi) {
      emblaApi.on("select", onSelect);
      onSelect();
    }
  });

  // Update current index when emblaApi changes
  if (emblaApi && !emblaApi.internalEngine().eventHandler) {
    emblaApi.on("select", onSelect);
  }

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col safe-top safe-bottom">
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onComplete}
          className="text-muted-foreground hover:text-foreground"
        >
          Pular
        </Button>
      </div>

      {/* Carousel */}
      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className="flex-[0_0_100%] min-w-0 flex flex-col items-center justify-center px-8"
            >
              <AnimatePresence mode="wait">
                {currentIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center text-center max-w-sm"
                  >
                    {/* Icon with gradient background */}
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                      className={`w-32 h-32 rounded-full bg-gradient-to-br ${slide.color} flex items-center justify-center text-white mb-8 shadow-lg`}
                    >
                      {slide.icon}
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-bold text-foreground mb-4"
                    >
                      {slide.title}
                    </motion.h2>

                    {/* Description */}
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-muted-foreground text-base leading-relaxed"
                    >
                      {slide.description}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 py-6">
        {slides.map((_, index) => (
          <motion.div
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-8 bg-primary"
                : "w-2 bg-muted-foreground/30"
            }`}
            animate={{
              scale: index === currentIndex ? 1 : 0.8
            }}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between px-6 pb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollPrev}
          disabled={currentIndex === 0}
          className="w-12 h-12 rounded-full"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        {isLastSlide ? (
          <Button
            onClick={onComplete}
            size="lg"
            className="bg-gradient-hero text-white font-semibold px-8 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            Começar!
          </Button>
        ) : (
          <Button
            onClick={scrollNext}
            size="lg"
            className="bg-gradient-hero text-white font-semibold px-8 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            Próximo
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        )}

        <div className="w-12 h-12" /> {/* Spacer for alignment */}
      </div>
    </div>
  );
}
