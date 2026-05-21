"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, User, Armchair, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const schema = z.object({
  email: z.string().min(1, "Name or Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

const SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85",
    title: "Contemporary Living",
    desc: "Crafted in warm natural walnut, hand-spun fabrics, and soft architectural outlines."
  },
  {
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85",
    title: "Masterful Artistry",
    desc: "Exquisite solid oak joinery and leather details designed for sophisticated homes."
  },
  {
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85",
    title: "Showroom Ambience",
    desc: "Cozy travertine stone backdrops blended with minimalist forms and warm luxury light."
  }
];

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [authError, setAuthError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Rotate images in the right visual panel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  if (status === "loading") return null;

  const onSubmit = async (data: FormData) => {
    setAuthError("");
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (res?.error) setAuthError("Invalid credentials");
    else {
      router.push("/");
      router.refresh();
    }
  };

  // Variants for staggered entrance animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 100, damping: 15 },
    },
  };

  const currentSlide = SLIDES[activeSlide] || { image: "", title: "", desc: "" };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        /* Floating studio spotlight blobs */
        @keyframes float-blob-1 {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          33% { transform: translate(30px, -40px) scale(1.1) rotate(120deg); }
          66% { transform: translate(-25px, 20px) scale(0.9) rotate(240deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(360deg); }
        }
        @keyframes float-blob-2 {
          0% { transform: translate(0px, 0px) scale(1) rotate(360deg); }
          50% { transform: translate(-30px, 35px) scale(1.08) rotate(180deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
        }

        /* Ken burns panning effect on active slide */
        @keyframes ken-burns {
          0% { transform: scale(1.02); }
          50% { transform: scale(1.08) translate(-1%, -0.5%); }
          100% { transform: scale(1.02); }
        }

        /* Input field premium focus styling */
        .login-input {
          transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .login-input:focus {
          border-color: var(--gold) !important;
          box-shadow: 0 0 0 4px rgba(197, 168, 128, 0.18) !important;
          background: #FFFFFF !important;
        }

        /* Responsive styling override */
        @media (max-width: 768px) {
          .login-card {
            flex-direction: column !important;
            max-width: 480px !important;
            min-height: unset !important;
            border-radius: 24px !important;
          }
          .login-image-panel {
            width: 100% !important;
            flex: none !important;
            height: 250px !important;
            border-bottom: 1px solid var(--border);
          }
          .login-form-panel {
            padding: 42px 28px !important;
            width: 100% !important;
            flex: none !important;
          }
          .login-title {
            font-size: 28px !important;
            text-align: center;
          }
          .login-subtitle {
            text-align: center;
            margin-left: auto;
            margin-right: auto;
          }
          .login-btn {
            width: 100% !important;
          }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          fontFamily: "'Inter', system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
          background: "#1c1714", // Velvet Espresso Charcoal background
        }}
      >
        {/* Soft, warm showroom aura lights in background */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          {/* Terracotta/Amber light */}
          <div
            style={{
              position: "absolute",
              top: "-10%",
              left: "-5%",
              width: "50%",
              height: "60%",
              background: "radial-gradient(circle, rgba(197, 168, 128, 0.12) 0%, rgba(74, 59, 50, 0.05) 50%, transparent 70%)",
              borderRadius: "50%",
              filter: "blur(60px)",
              animation: "float-blob-1 28s infinite alternate ease-in-out",
            }}
          />
          {/* Travertine Honey light */}
          <div
            style={{
              position: "absolute",
              bottom: "-15%",
              right: "-5%",
              width: "55%",
              height: "65%",
              background: "radial-gradient(circle, rgba(229, 213, 192, 0.1) 0%, rgba(46, 37, 32, 0.04) 55%, transparent 75%)",
              borderRadius: "50%",
              filter: "blur(75px)",
              animation: "float-blob-2 24s infinite alternate ease-in-out",
            }}
          />
        </div>

        {/* Outer Login Card */}
        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 35, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 70, damping: 15, delay: 0.1 }}
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            width: "100%",
            maxWidth: 960,
            minHeight: 580,
            borderRadius: 28,
            overflow: "hidden",
            background: "rgba(255, 255, 255, 0.99)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.45), 0 0 80px rgba(197, 168, 128, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.8)",
          }}
        >
          {/* LEFT: Luxurious Form Panel */}
          <motion.div
            className="login-form-panel"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
              flex: "0 0 52%",
              background: "#FFFFFF",
              padding: "54px 58px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Self-drawing Lounge Chair Vector Wireframe in background */}
            <div style={{
              position: "absolute",
              right: 15,
              bottom: 15,
              width: "210px",
              height: "210px",
              pointerEvents: "none",
              zIndex: 0,
              opacity: 0.045,
              color: "var(--primary)",
            }}>
              <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ width: "100%", height: "100%" }}>
                <motion.path 
                  d="M20 75 C 20 75, 80 75, 80 75 M30 75 L 24 88 M70 75 L 76 88" 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2.2, ease: "easeInOut", delay: 0.6 }}
                />
                <motion.path 
                  d="M15 50 C 15 65, 25 72, 50 72 C 75 72, 85 65, 85 50" 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2.5, ease: "easeInOut", delay: 0.9 }}
                />
                <motion.path 
                  d="M15 50 C 15 38, 20 32, 32 32 C 38 32, 44 40, 50 40 C 56 40, 62 32, 68 32 C 80 32, 85 38, 85 50" 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2.8, ease: "easeInOut", delay: 1.2 }}
                />
                <motion.path 
                  d="M32 32 C 32 20, 38 15, 50 15 C 62 15, 68 20, 68 32" 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 3, ease: "easeInOut", delay: 1.5 }}
                />
              </svg>
            </div>

            {/* Logo */}
            <motion.div
              variants={itemVariants}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 32,
                zIndex: 1,
              }}
            >
              <div
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(46, 37, 32, 0.15)",
                }}
              >
                <Armchair size={19} color="var(--gold)" style={{ strokeWidth: 2.2 }} />
              </div>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: "0.15em",
                  color: "var(--primary)",
                }}
              >
                DIMOND HOME
              </span>
            </motion.div>

            {/* Header Text */}
            <motion.h1
              className="login-title"
              variants={itemVariants}
              style={{
                margin: "0 0 12px",
                fontSize: 34,
                fontWeight: 800,
                color: "var(--primary)",
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                zIndex: 1,
              }}
            >
              Welcome back
            </motion.h1>
            
            <motion.p
              className="login-subtitle"
              variants={itemVariants}
              style={{
                margin: "0 0 36px",
                fontSize: 14,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                maxWidth: 320,
                zIndex: 1,
              }}
            >
              Log in to access your dashboard, inventory schedules, and operations.
            </motion.p>

            {/* Credentials Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              style={{ display: "flex", flexDirection: "column", gap: 20, zIndex: 1 }}
            >
              {/* Username/Email Field */}
              <motion.div variants={itemVariants}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: 8,
                    letterSpacing: "0.02em",
                  }}
                >
                  Name or Email
                </label>
                <div style={{ position: "relative" }}>
                  <User
                    size={18}
                    style={{
                      position: "absolute",
                      left: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: focusedField === "email" ? "var(--gold)" : "var(--text-muted)",
                      transition: "color 0.2s",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    className="login-input"
                    type="text"
                    placeholder="Enter Username or Email"
                    {...register("email")}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: "100%",
                      height: 48,
                      borderRadius: 12,
                      border: `1.5px solid ${focusedField === "email" ? "var(--gold)" : "var(--border)"}`,
                      padding: "0 16px 0 46px",
                      fontSize: 14,
                      color: "var(--primary)",
                      background: "#FAF9F6", // Soft linen base
                      outline: "none",
                    }}
                  />
                </div>
                <p style={{ margin: "6px 0 0 4px", fontSize: 11, color: "var(--gold)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <Sparkles size={11} /> Staff/Workers: Log in using your registered Name
                </p>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ margin: "5px 0 0 4px", fontSize: 12, color: "var(--danger)" }}
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Password Field */}
              <motion.div variants={itemVariants}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: 8,
                    letterSpacing: "0.02em",
                  }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={18}
                    style={{
                      position: "absolute",
                      left: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: focusedField === "password" ? "var(--gold)" : "var(--text-muted)",
                      transition: "color 0.2s",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    className="login-input"
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: "100%",
                      height: 48,
                      borderRadius: 12,
                      border: `1.5px solid ${focusedField === "password" ? "var(--gold)" : "var(--border)"}`,
                      padding: "0 46px 0 46px",
                      fontSize: 14,
                      color: "var(--primary)",
                      background: "#FAF9F6", // Soft linen base
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((p) => !p)}
                    style={{
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ margin: "5px 0 0 4px", fontSize: 12, color: "var(--danger)" }}
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Authentication Errors */}
              <AnimatePresence>
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    style={{
                      fontSize: 13,
                      color: "var(--danger)",
                      fontWeight: 500,
                      background: "var(--danger-bg)",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(168, 67, 67, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>⚠️</span> {authError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                className="login-btn"
                disabled={isSubmitting}
                whileHover={!isSubmitting ? { scale: 1.015 } : {}}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                style={{
                  width: "55%",
                  height: 50,
                  borderRadius: 25,
                  background: "var(--primary)",
                  border: "none",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 10px 24px rgba(46, 37, 32, 0.15)",
                  transition: "background 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = "var(--primary-light)";
                    e.currentTarget.style.boxShadow = "0 12px 28px rgba(46, 37, 32, 0.22)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = "var(--primary)";
                    e.currentTarget.style.boxShadow = "0 10px 24px rgba(46, 37, 32, 0.15)";
                  }
                }}
              >
                {isSubmitting ? (
                  <svg
                    style={{ animation: "spin 0.8s linear infinite" }}
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                  >
                    <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                    <path d="M9 2 a7 7 0 0 1 7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <>
                    LOG IN <ChevronRight size={16} style={{ strokeWidth: 2.5 }} />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* RIGHT: Visual Panel (Showroom Slideshow with elegant crossfades) */}
          <div
            className="login-image-panel"
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              background: "#2e2520",
            }}
          >
            {/* The Active Slide Container */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url('${currentSlide.image}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  animation: "ken-burns 24s infinite alternate ease-in-out",
                }}
              />
            </AnimatePresence>

            {/* Subtle luxury vignette gradient */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(46, 37, 32, 0.85) 0%, rgba(46, 37, 32, 0.35) 60%, rgba(46, 37, 32, 0.1) 100%)",
                zIndex: 1,
              }}
            />

            {/* Overlaid luxury showroom description card */}
            <div
              style={{
                position: "absolute",
                bottom: 40,
                left: 40,
                right: 40,
                zIndex: 2,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.6 }}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    padding: "24px 28px",
                    borderRadius: 20,
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
                  }}
                >
                  <h3
                    style={{
                      color: "#FFFFFF",
                      fontSize: 17,
                      fontWeight: 700,
                      margin: "0 0 6px",
                      letterSpacing: "-0.01em",
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    {currentSlide.title}
                  </h3>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.8)",
                      fontSize: 12.5,
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {currentSlide.desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress indicators */}
              <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16 }}>
                {SLIDES.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    style={{
                      width: activeSlide === idx ? 24 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: activeSlide === idx ? "var(--gold)" : "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
