import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-styles";

interface LinkButtonProps extends HTMLMotionProps<"a"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    return (
      <motion.a
        ref={ref}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className={buttonClasses(variant, size, className)}
        {...props}
      >
        {children}
      </motion.a>
    );
  }
);
LinkButton.displayName = "LinkButton";
