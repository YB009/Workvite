import { Link } from "react-router-dom";
import SmoothScroll from "../../components/SmoothScroll.jsx";
import HeroSection from "../../components/landing/HeroSection.jsx";
import ThreeDTextReveal from "../../components/landing/ThreeDTextReveal.jsx";
import PillNav from "../../components/landing/PillNav.jsx";
import ProblemSection from "../../components/landing/ProblemSection.jsx";
import FeaturesSection from "../../components/landing/FeaturesSection.jsx";
import HowItWorksSection from "../../components/landing/HowItWorksSection.jsx";
import ProductShowcaseSection from "../../components/landing/ProductShowcaseSection.jsx";
import FinalCTASection from "../../components/landing/FinalCTASection.jsx";
import logo from "../../assets/workvite-icon.svg";

function LandingPage() {
  const navItems = [
    { label: "Hero", href: "#hero" },
    { label: "Problem", href: "#problem" },
    { label: "Features", href: "#features" },
    { label: "Workflow", href: "#how-it-works" },
    { label: "Showcase", href: "#showcase" },
    { label: "CTA", href: "#final-cta" },
  ];

  return (
    <main className="relative overflow-hidden bg-transparent scroll-smooth">
      <SmoothScroll />
      <div className="fixed left-1/2 top-4 z-[1200] flex w-[calc(100%-1rem)] -translate-x-1/2 items-center justify-center gap-2 md:w-auto">
        <PillNav
          logo={logo}
          logoAlt="Workvite Logo"
          items={navItems}
          activeHref="#hero"
          className="custom-nav"
          ease="power2.easeOut"
          baseColor="#0f172a"
          pillColor="#f8fafc"
          hoveredPillTextColor="#f8fafc"
          pillTextColor="#0f172a"
          initialLoadAnimation
        />
        <Link
          to="/login"
          className="hidden rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 shadow-md md:inline-flex"
        >
          Sign In
        </Link>
      </div>

      <HeroSection />
      <ThreeDTextReveal
        items={["WORKVITE","THE", "BEST", "PROJECT", "MANAGER"]}
        perspective={1000}
        radius={180}
        gap={24}
        startRotation={-80}
        endRotation={270}
        scrollDistance="150vh"
        scrollSmoothing={1}
      />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ProductShowcaseSection />
      <FinalCTASection />
    </main>
  );
}

export default LandingPage;
