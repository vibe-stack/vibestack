import { motion } from "motion/react";

const LoadingDots = () => (
  <div className="flex space-x-1 my-1">
    {[0, 1, 2].map((dot) => (
      <motion.div
        key={dot}
        className="h-1.5 w-1.5 bg-foreground rounded-full"
        animate={{ y: [0, -3, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatType: "loop",
          delay: dot * 0.2,
        }}
      />
    ))}
  </div>
);

export default LoadingDots; 