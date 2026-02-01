import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Ballpit from "../Ballpit.jsx";

const EXCLUDED_PATHS = [
  "/login",
  "/register",
  "/oauth/success",
  "/onboarding/organization",
  "/organizations",
];

const shouldDisable = (pathname) => EXCLUDED_PATHS.some((path) => pathname.startsWith(path));

export default function AppBackground() {
  const location = useLocation();
  const [count, setCount] = useState(120);

  useEffect(() => {
    const updateCount = () => setCount(window.innerWidth < 768 ? 70 : 120);
    updateCount();
    window.addEventListener("resize", updateCount);
    return () => window.removeEventListener("resize", updateCount);
  }, []);

  if (shouldDisable(location.pathname)) return null;

  return (
    <div className="app-background" aria-hidden="true">
      <div className="app-background-inner">
        <Ballpit
          className="ballpit-canvas"
          count={Math.max(count, 90)}
          gravity={0.01}
          friction={0.9975}
          wallBounce={0.95}
          followCursor={false}
          colors={["#ffffff", "#000000", "#3532b8"]}
          ambientIntensity={2.2}
          lightIntensity={700}
          materialParams={{
            metalness: 0.35,
            roughness: 0.35,
            clearcoat: 1,
            clearcoatRoughness: 0.1,
          }}
          minSize={0.45}
          maxSize={0.9}
        />
      </div>
      <div className="app-background-wash" />
    </div>
  );
}
