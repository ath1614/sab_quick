"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/constants";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

const ROLE_ROUTES: Record<Role, string> = {
  customer: "/home",
  delivery: "/delivery",
  staff: "/staff",
  manager: "/manager",
  owner: "/owner",
  admin: "/admin",
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace(ROLE_ROUTES[user.role] ?? "/home");
  }, [user, router]);

  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: errorsLogin } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { register: registerReg, handleSubmit: handleSubmitReg, formState: { errors: errorsReg } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      // Small delay to allow PostgREST schema cache to stabilize if just created
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user?.id) // Use ID instead of email for better performance/reliability
        .single();

      if (profileError || !profile) {
        console.error("Profile fetch error:", profileError);
        throw new Error("User profile not found. Please try logging in again in a moment.");
      }

      setUser({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role as Role
      }, authData.session);

      router.push(ROLE_ROUTES[profile.role as Role] ?? "/home");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid credentials";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: "customer"
          },
          emailRedirectTo: `${appUrl}/auth`
        }
      });

      if (authError) throw authError;

      if (authData.session && authData.user) {
        const userData = {
          id: authData.user.id,
          name: data.name,
          email: data.email,
          role: "customer" as Role
        };
        setUser(userData, authData.session);
        router.push(ROLE_ROUTES["customer"]);
      } else {
        setError("Please check your email to confirm your account.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-surface flex flex-col safe-bottom">
      <div className="relative bg-brand-black overflow-hidden safe-top" style={{ minHeight: 220 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 390 220" preserveAspectRatio="xMidYMid slice">
          <polygon points="220,0 390,0 390,180 160,220" fill="#2CA01C" opacity="0.1" />
          <polygon points="310,0 390,0 390,90" fill="#2CA01C" opacity="0.16" />
          <polygon points="0,180 100,220 0,220" fill="#ffffff" opacity="0.03" />
          <polygon points="340,20 358,8 376,20 376,44 358,56 340,44" fill="none" stroke="#2CA01C" strokeWidth="1" opacity="0.45" />
          <polygon points="18,0 36,18 18,36 0,18" fill="#2CA01C" opacity="0.18" />
          <line x1="0" y1="160" x2="200" y2="20" stroke="#2CA01C" strokeWidth="0.5" opacity="0.15" />
          {[0,1,2,3].map((c) => [0,1,2].map((r) => (
            <circle key={`${c}-${r}`} cx={300+c*16} cy={110+r*16} r="1.4" fill="#2CA01C" opacity="0.28" />
          )))}
        </svg>
        <div className="relative z-10 flex flex-col items-center justify-center h-full pt-12 pb-8 px-6">
          <img src="/logo.png" alt="SAB QUICK" className="w-20 h-auto mb-4 drop-shadow-2xl" />
          <h1 className="text-2xl font-black text-white">{isLogin ? "Welcome back" : "Create account"}</h1>
          <p className="text-white/40 text-sm mt-1">{isLogin ? "Sign in to continue" : "Sign up to get started"}</p>
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 390 24" preserveAspectRatio="none">
          <polygon points="0,24 390,0 390,24" fill="#F7F8F9" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex-1 px-6 pt-6 pb-4 w-full max-w-sm mx-auto"
      >
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-4">
                <div>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...registerLogin("email")}
                      type="email"
                      placeholder="Email address"
                      className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white border border-gray-200 text-brand-black placeholder-gray-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                    />
                  </div>
                  {errorsLogin.email && <p className="text-red-500 text-xs mt-1 ml-1">{errorsLogin.email.message}</p>}
                </div>

                <div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...registerLogin("password")}
                      type={showPass ? "text" : "password"}
                      placeholder="Password"
                      className="w-full pl-11 pr-12 py-4 rounded-2xl bg-white border border-gray-200 text-brand-black placeholder-gray-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errorsLogin.password && <p className="text-red-500 text-xs mt-1 ml-1">{errorsLogin.password.message}</p>}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-red-50 border border-red-100 rounded-xl p-3"
                  >
                    <p className="text-red-500 text-xs font-medium text-center">{error}</p>
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.97 }}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-brand-green text-white font-bold text-base shadow-green disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : "Sign In"}
                </motion.button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSubmitReg(onRegisterSubmit)} className="space-y-4">
                <div>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...registerReg("name")}
                      type="text"
                      placeholder="Full name"
                      className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white border border-gray-200 text-brand-black placeholder-gray-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                    />
                  </div>
                  {errorsReg.name && <p className="text-red-500 text-xs mt-1 ml-1">{errorsReg.name.message}</p>}
                </div>

                <div>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...registerReg("email")}
                      type="email"
                      placeholder="Email address"
                      className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white border border-gray-200 text-brand-black placeholder-gray-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                    />
                  </div>
                  {errorsReg.email && <p className="text-red-500 text-xs mt-1 ml-1">{errorsReg.email.message}</p>}
                </div>

                <div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...registerReg("password")}
                      type={showPass ? "text" : "password"}
                      placeholder="Password"
                      className="w-full pl-11 pr-12 py-4 rounded-2xl bg-white border border-gray-200 text-brand-black placeholder-gray-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errorsReg.password && <p className="text-red-500 text-xs mt-1 ml-1">{errorsReg.password.message}</p>}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-red-50 border border-red-100 rounded-xl p-3"
                  >
                    <p className="text-red-500 text-xs font-medium text-center">{error}</p>
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.97 }}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-brand-green text-white font-bold text-base shadow-green disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : "Create Account"}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-brand-green text-sm font-bold"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
