import Dashboard from "./Dashboard.jsx";
import { FadeIn } from "../utils/animations.jsx";

export default function DashboardAnimated() {
  return (
    <FadeIn>
      <Dashboard />
    </FadeIn>
  );
}
