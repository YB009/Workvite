import "./AuthLayout.css";

export default function AuthLayout({ children, title = "Welcome back" }) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1>{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
