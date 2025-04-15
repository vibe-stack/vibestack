import { motion } from "motion/react";

const LoadingDots = () => (
  <div className="flex space-x-0.5 my-0.5">
    {[0, 1, 2].map((dot) => (
      <motion.div
        key={dot}
        className="h-1 w-1 bg-muted-foreground rounded-full"
        animate={{ y: [0, -2, 0] }}
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