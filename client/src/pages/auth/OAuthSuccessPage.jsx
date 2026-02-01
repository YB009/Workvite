import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext.jsx";
import Antigravity from "../../components/Antigravity.jsx";

export default function OAuthSuccessPage() {
  const navigate = useNavigate();
  const { firebaseUser, loading, bootstrapped } = useAuthContext();
  const [readyToRedirect, setReadyToRedirect] = useState(false);
  const [showCanvas, setShowCanvas] = useState(true);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });
  const [blink, setBlink] = useState(false);
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const track = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setPointer({ x, y });
    };
    window.addEventListener("mousemove", track);

    const blinkTimer = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 3200);

    const visibilityHandler = () => {
      setShowCanvas(!document.hidden);
    };
    document.addEventListener("visibilitychange", visibilityHandler);

    return () => {
      window.removeEventListener("mousemove", track);
      document.removeEventListener("visibilitychange", visibilityHandler);
      clearInterval(blinkTimer);
    };
  }, []);

  useEffect(() => {
    if (loading || !bootstrapped) return;
    setReadyToRedirect(Boolean(firebaseUser));
  }, [firebaseUser, loading, bootstrapped]);

  const handleContinue = () => {
    if (document.hidden) return;
    if (!readyToRedirect) return;
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="antigravity-bg">
      {showCanvas && !prefersReducedMotion && (
        <div className="antigravity-canvas">
          <Antigravity
            count={250}
            magnetRadius={6}
            ringRadius={8}
            waveSpeed={0.4}
            waveAmplitude={1}
            particleSize={1.6}
            lerpSpeed={0.05}
            color="#918890"
            autoAnimate
            particleVariance={1}
            rotationSpeed={0}
            depthFactor={1}
            pulseSpeed={3}
            particleShape="box"
            fieldStrength={10}
          />
        </div>
      )}
      <div className="oauth-hero" onClick={handleContinue} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && handleContinue()}>
        <Eyes pointer={pointer} blink={blink} />
        <h1
          className="hero-title"
          style={{
            transform: `translate3d(${(pointer.x - 0.5) * 20}px, ${(pointer.y - 0.5) * 12}px, 0)`,
          }}
        >
          Welcome to WorkVite
        </h1>
        <p className="muted hero-sub">Tap, click, or press Enter to continue</p>
      </div>
    </div>
  );
}

const Eyes = ({ pointer, blink }) => {
  const amplitude = 18; // allow more travel, especially to the left
  const pupilX = (pointer.x - 0.5) * amplitude;
  const pupilY = (pointer.y - 0.5) * amplitude;
  return (
    <div className="eye-wrap duo">
      {[0, 1].map((i) => (
        <div key={i} className={`eye ${blink ? "blink" : ""}`}>
          <div className="pupil" style={{ transform: `translate(${pupilX}px, ${pupilY}px)` }} />
        </div>
      ))}
    </div>
  );
};
