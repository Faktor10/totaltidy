import type { Transition, Variants } from "framer-motion";

export const springBouncy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 15,
};

export const springGentle: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 20,
};

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 25,
};

export const tapScale = { scale: 0.92 };
export const tapScaleSubtle = { scale: 0.96 };

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1 },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};
