import { motion } from "framer-motion";

const AILogo = () => {
  return (
    <div
      className="relative h-12 w-12 flex items-center justify-center"
      aria-label="Resumora"
    >
      <motion.div
        className="absolute -inset-1 rounded-[20px]"
        style={{
          background:
            "radial-gradient(circle, var(--accent) 0%, transparent 65%)",
          filter: "blur(10px)",
        }}
        animate={{ opacity: [0.45, 0.9, 0.45], scale: [0.85, 1.08, 0.85] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <img
        src="/assets/resumora-logo.svg"
        alt="Resumora"
        className="relative h-[44px] w-[44px] object-contain"
      />
    </div>
  );
};

export default AILogo;
