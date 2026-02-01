import { useMemo } from "react";

const baseStyle = {
  display: "block",
  willChange: "transform, opacity",
};

const animationStyle = {
  fadeIn: { animation: "fadeInUp 420ms ease forwards" },
  scaleIn: { animation: "scaleIn 420ms ease forwards" },
  slideLeft: { animation: "slideInLeft 420ms ease forwards" },
  hoverLift: {
    transition: "transform 180ms ease, box-shadow 180ms ease",
  },
};

const wrap = (style, delay = 0) => ({
  ...baseStyle,
  ...style,
  animationDelay: delay ? `${delay}ms` : undefined,
});

export const FadeIn = ({ delay = 0, children, style = {} }) => {
  const merged = useMemo(() => ({ ...wrap(animationStyle.fadeIn, delay), ...style }), [delay, style]);
  return <div style={merged}>{children}</div>;
};

export const ScaleIn = ({ delay = 0, children, style = {} }) => {
  const merged = useMemo(() => ({ ...wrap(animationStyle.scaleIn, delay), ...style }), [delay, style]);
  return <div style={merged}>{children}</div>;
};

export const SlideInLeft = ({ delay = 0, children, style = {} }) => {
  const merged = useMemo(() => ({ ...wrap(animationStyle.slideLeft, delay), ...style }), [delay, style]);
  return <div style={merged}>{children}</div>;
};

export const HoverLift = ({ children, style = {} }) => {
  return (
    <div
      style={{ ...baseStyle, ...animationStyle.hoverLift, ...style }}
      className="hover-lift"
    >
      {children}
    </div>
  );
};
