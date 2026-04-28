"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Something went wrong");
      
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4F0] flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E5DDD5]"
      >
        <div className="bg-[#1A0F0A] p-8 text-center text-white">
          <div className="h-16 w-16 bg-[#C9A84C] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#E8C97A]">Owner Registration</h1>
          <p className="text-sm opacity-60 mt-1">Setup your Diamond Home ERP account</p>
        </div>

        <div className="p-8">
          {success ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-xl font-bold text-[#1A1210]">Account Created!</h2>
              <p className="text-[#7A6055] mt-2">Redirecting you to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7A6055] uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89080]" size={18} />
                  <Input 
                    {...register("name")}
                    placeholder="John Doe" 
                    className="pl-10 border-[#E5DDD5] h-12 focus:ring-[#C9A84C]"
                  />
                </div>
                {errors.name && <p className="text-xs text-rose-500 font-medium">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7A6055] uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89080]" size={18} />
                  <Input 
                    {...register("email")}
                    type="email"
                    placeholder="owner@diamondhome.com" 
                    className="pl-10 border-[#E5DDD5] h-12 focus:ring-[#C9A84C]"
                  />
                </div>
                {errors.email && <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7A6055] uppercase tracking-wider">Secure Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89080]" size={18} />
                  <Input 
                    {...register("password")}
                    type="password"
                    placeholder="••••••••" 
                    className="pl-10 border-[#E5DDD5] h-12 focus:ring-[#C9A84C]"
                  />
                </div>
                {errors.password && <p className="text-xs text-rose-500 font-medium">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-medium">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-12 bg-[#2C1810] hover:bg-[#1A0F0A] text-white font-bold rounded-xl transition-all"
              >
                {isSubmitting ? "Creating Account..." : "Create Owner Account"} <ArrowRight size={18} className="ml-2" />
              </Button>

              <p className="text-center text-sm text-[#A89080]">
                Already have an account? <button type="button" onClick={() => router.push("/login")} className="text-[#C9A84C] font-bold hover:underline">Login here</button>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
