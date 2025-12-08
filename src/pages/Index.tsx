import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Benefits } from "@/components/landing/Benefits";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Cãolorias - O diário alimentar do seu cão</title>
        <meta name="description" content="Registre as refeições, acompanhe o peso e cuide melhor da alimentação natural do seu amigo de quatro patas. Simples, sem complicação." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <HowItWorks />
          <Benefits />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
