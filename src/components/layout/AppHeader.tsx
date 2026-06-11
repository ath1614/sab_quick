"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  backHref?: string;
  right?: React.ReactNode;
  dark?: boolean;
}

export default function AppHeader({ title, subtitle, back = false, backHref, right, dark = false }: Props) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) router.push(backHref);
    else router.back();
  };

  return (
    <div className={`px-4 pt-12 pb-4 safe-top flex items-center gap-3 ${dark ? "bg-brand-black" : "bg-white border-b border-gray-100"}`}>
      {back && (
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleBack}
          className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${dark ? "bg-white/10" : "bg-brand-surface"}`}
        >
          <ArrowLeft size={18} className={dark ? "text-white" : "text-brand-black"} />
        </motion.button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className={`font-black text-xl leading-tight truncate ${dark ? "text-white" : "text-brand-black"}`}>{title}</h1>
        {subtitle && <p className={`text-xs mt-0.5 truncate ${dark ? "text-white/40" : "text-gray-400"}`}>{subtitle}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}
