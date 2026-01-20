import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext.jsx";
import Antigravity from "../../components/Antigravity.jsx";

export default function OAuthSuccessPage() {
  const navigate = useNavigate();
  const { firebaseUser, loading } = useAuthContext();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const trigger = () => setHasInteracted(true);
    const track = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setPointer({ x, y });
    };
    window.addEventListener("click", trigger, { once: true });
    window.addEventListener("scroll", trigger, { once: true });
    window.addEventListener("touchstart", trigger, { once: true });
    window.addEventListener("keydown", trigger, { once: true });
    window.addEventListener("mousemove", track);

    const blinkTimer = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 3200);

    return () => {
      window.removeEventListener("click", trigger);
      window.removeEventListener("scroll", trigger);
      window.removeEventListener("touchstart", trigger);
      window.removeEventListener("keydown", trigger);
      window.removeEventListener("mousemove", track);
      clearInterval(blinkTimer);
    };
  }, []);

  useEffect(() => {
    if (!loading && firebaseUser && hasInteracted) {
      navigate("/dashboard", { replace: true });
    }
  }, [firebaseUser, loading, hasInteracted, navigate]);

  return (
    <div className="antigravity-bg">
      <div className="antigravity-canvas">
        <Antigravity color="#656567" particleShape="box" autoAnimate fieldStrength={10} />
      </div>
      <div className="oauth-hero">
        <Eyes pointer={pointer} blink={blink} />
        <h1
          className="hero-title"
          style={{
            transform: `translate3d(${(pointer.x - 0.5) * 20}px, ${(pointer.y - 0.5) * 12}px, 0)`,
          }}
        >
          Welcome to WorkVite
        </h1>
        <p className="muted hero-sub">Click, scroll, or tap to continue</p>
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
