"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [authError, setAuthError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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
    if (res?.error) setAuthError("Invalid email or password");
    else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #F7F4F0 0%, #EDE8E0 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes shimmer { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }
        * { box-sizing: border-box; }
      `}</style>

      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: 960,
          minHeight: 600,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow:
            "0 32px 80px rgba(44,24,16,0.18), 0 8px 24px rgba(44,24,16,0.1)",
        }}
      >
        {/* ── LEFT PANEL – Brand/Illustration ──────── */}
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="left-panel"
          style={{
            flex: 1,
            background:
              "linear-gradient(160deg, #1A0F0A 0%, #2C1810 55%, #3D2415 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 40px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background texture blobs */}
          <div
            style={{
              position: "absolute",
              top: -80,
              left: -80,
              width: 300,
              height: 280,
              background:
                "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -100,
              right: -60,
              width: 320,
              height: 260,
              background:
                "radial-gradient(circle, rgba(139,94,60,0.15) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
          {/* Decorative grain lines */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${8 + i * 12}%`,
                top: 0,
                bottom: 0,
                width: 1,
                background: "rgba(201,168,76,0.04)",
              }}
            />
          ))}

          {/* Furniture SVG illustration */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "relative", zIndex: 2, marginBottom: 36 }}
          >
            <svg
              width="200"
              height="180"
              viewBox="0 0 200 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Room floor */}
              <ellipse
                cx="100"
                cy="165"
                rx="85"
                ry="12"
                fill="rgba(201,168,76,0.1)"
              />

              {/* Sofa body */}
              <rect
                x="22"
                y="100"
                width="156"
                height="55"
                rx="12"
                fill="#5C3D2E"
              />
              <rect
                x="22"
                y="100"
                width="156"
                height="55"
                rx="12"
                fill="url(#sofaGrad)"
              />

              {/* Sofa back cushions */}
              <rect
                x="28"
                y="78"
                width="56"
                height="36"
                rx="10"
                fill="#7A5040"
              />
              <rect
                x="90"
                y="78"
                width="56"
                height="36"
                rx="10"
                fill="#7A5040"
              />
              <rect
                x="28"
                y="78"
                width="56"
                height="36"
                rx="10"
                fill="rgba(255,255,255,0.05)"
              />
              <rect
                x="90"
                y="78"
                width="56"
                height="36"
                rx="10"
                fill="rgba(255,255,255,0.05)"
              />

              {/* Sofa armrests */}
              <rect
                x="14"
                y="90"
                width="22"
                height="48"
                rx="10"
                fill="#6B4530"
              />
              <rect
                x="164"
                y="90"
                width="22"
                height="48"
                rx="10"
                fill="#6B4530"
              />

              {/* Sofa seat cushions */}
              <rect
                x="30"
                y="110"
                width="63"
                height="34"
                rx="8"
                fill="#8B5E3C"
              />
              <rect
                x="107"
                y="110"
                width="63"
                height="34"
                rx="8"
                fill="#8B5E3C"
              />
              <rect
                x="30"
                y="110"
                width="63"
                height="34"
                rx="8"
                fill="rgba(255,255,255,0.05)"
              />
              <rect
                x="107"
                y="110"
                width="63"
                height="34"
                rx="8"
                fill="rgba(255,255,255,0.05)"
              />

              {/* Sofa legs */}
              <rect
                x="30"
                y="150"
                width="10"
                height="16"
                rx="3"
                fill="#4A2810"
              />
              <rect
                x="160"
                y="150"
                width="10"
                height="16"
                rx="3"
                fill="#4A2810"
              />
              <rect
                x="70"
                y="150"
                width="8"
                height="12"
                rx="2"
                fill="#4A2810"
              />
              <rect
                x="122"
                y="150"
                width="8"
                height="12"
                rx="2"
                fill="#4A2810"
              />

              {/* Coffee table */}
              <rect
                x="65"
                y="148"
                width="70"
                height="8"
                rx="3"
                fill="#C9A84C"
                opacity="0.9"
              />
              <rect
                x="72"
                y="156"
                width="5"
                height="14"
                rx="2"
                fill="#B8942A"
              />
              <rect
                x="123"
                y="156"
                width="5"
                height="14"
                rx="2"
                fill="#B8942A"
              />

              {/* Decorative plant */}
              <rect
                x="168"
                y="140"
                width="6"
                height="22"
                rx="3"
                fill="#6B4530"
              />
              <ellipse cx="170" cy="130" rx="14" ry="16" fill="#2D5A27" />
              <ellipse
                cx="163"
                cy="125"
                rx="9"
                ry="11"
                fill="#27AE60"
                opacity="0.7"
              />
              <ellipse
                cx="177"
                cy="127"
                rx="8"
                ry="10"
                fill="#2ECC71"
                opacity="0.6"
              />
              <ellipse
                cx="170"
                cy="118"
                rx="7"
                ry="9"
                fill="#27AE60"
                opacity="0.8"
              />

              {/* Lamp */}
              <rect
                x="22"
                y="128"
                width="4"
                height="28"
                rx="2"
                fill="#C9A84C"
                opacity="0.7"
              />
              <path
                d="M12 128 L34 128 L28 112 L18 112 Z"
                fill="#E8C97A"
                opacity="0.9"
              />
              <ellipse
                cx="24"
                cy="112"
                rx="11"
                ry="4"
                fill="#E8C97A"
                opacity="0.5"
              />

              {/* Gradient defs */}
              <defs>
                <linearGradient
                  id="sofaGrad"
                  x1="22"
                  y1="100"
                  x2="22"
                  y2="155"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
                </linearGradient>
              </defs>

              {/* Gold accent dots */}
              <circle cx="56" cy="110" r="2" fill="#C9A84C" opacity="0.6" />
              <circle cx="100" cy="108" r="2" fill="#C9A84C" opacity="0.6" />
              <circle cx="144" cy="110" r="2" fill="#C9A84C" opacity="0.6" />
            </svg>
          </motion.div>

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{ textAlign: "center", position: "relative", zIndex: 2 }}
          >
            {/* Logo */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo.webp"
                alt="Diamond Home"
                style={{ width: 56, height: 56, objectFit: "contain" }}
              />
            </div>
            <h2
              style={{
                margin: "0 0 6px",
                fontSize: 26,
                fontWeight: 800,
                color: "#E8C97A",
                letterSpacing: "-0.02em",
              }}
            >
              Diamond Home
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "rgba(255,255,255,0.45)",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Furniture Management ERP
            </p>
          </motion.div>

          {/* Animated gold dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            style={{
              marginTop: 28,
              display: "flex",
              gap: 6,
              position: "relative",
              zIndex: 2,
            }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                style={{
                  width: i === 2 ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: "#C9A84C",
                  opacity: 0.5,
                  transition: "width 0.3s",
                }}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* ── RIGHT PANEL – Login Form ──────────────── */}
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{
            flex: 1,
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "56px 48px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle corner decoration */}
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -60,
              left: -40,
              width: 200,
              height: 160,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(44,24,16,0.04) 0%, transparent 70%)",
            }}
          />

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            style={{ marginBottom: 36, position: "relative", zIndex: 2 }}
          >
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 11,
                fontWeight: 700,
                color: "#C9A84C",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Welcome back
            </p>
            <h1
              style={{
                margin: "0 0 8px",
                fontSize: 30,
                fontWeight: 800,
                color: "#1A1210",
                letterSpacing: "-0.02em",
              }}
            >
              Sign In
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "#7A6055" }}>
              Access your Diamond Home ERP dashboard
            </p>
          </motion.div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Email */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#5A4035",
                  display: "block",
                  marginBottom: 6,
                  letterSpacing: "0.04em",
                }}
              >
                EMAIL ADDRESS
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: focused === "email" ? "#fff" : "#FAF8F6",
                  borderRadius: 12,
                  padding: "0 16px",
                  height: 52,
                  border:
                    focused === "email"
                      ? "1.5px solid #C9A84C"
                      : "1.5px solid #E5DDD5",
                  boxShadow:
                    focused === "email"
                      ? "0 0 0 3px rgba(201,168,76,0.12)"
                      : "none",
                  transition: "all 0.2s",
                }}
              >
                <Mail
                  size={16}
                  color={focused === "email" ? "#C9A84C" : "#A89080"}
                />
                <input
                  type="email"
                  placeholder="your@email.com"
                  {...register("email")}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    fontSize: 14,
                    color: "#1A1210",
                    background: "transparent",
                  }}
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      margin: "5px 0 0 4px",
                      fontSize: 12,
                      color: "#C0392B",
                      fontWeight: 500,
                    }}
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
            >
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#5A4035",
                  display: "block",
                  marginBottom: 6,
                  letterSpacing: "0.04em",
                }}
              >
                PASSWORD
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: focused === "password" ? "#fff" : "#FAF8F6",
                  borderRadius: 12,
                  padding: "0 16px",
                  height: 52,
                  border:
                    focused === "password"
                      ? "1.5px solid #C9A84C"
                      : "1.5px solid #E5DDD5",
                  boxShadow:
                    focused === "password"
                      ? "0 0 0 3px rgba(201,168,76,0.12)"
                      : "none",
                  transition: "all 0.2s",
                }}
              >
                <Lock
                  size={16}
                  color={focused === "password" ? "#C9A84C" : "#A89080"}
                />
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    fontSize: 14,
                    color: "#1A1210",
                    background: "transparent",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((p) => !p)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#A89080",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      margin: "5px 0 0 4px",
                      fontSize: 12,
                      color: "#C0392B",
                      fontWeight: 500,
                    }}
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Auth error */}
            <AnimatePresence>
              {authError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: "#FDEDEC",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#C0392B",
                    fontWeight: 500,
                    border: "1px solid #F5B7B1",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 15 }}>⚠</span> {authError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.4 }}
              style={{ marginTop: 4 }}
            >
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{
                  scale: isSubmitting ? 1 : 1.02,
                  y: isSubmitting ? 0 : -1,
                }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                style={{
                  width: "100%",
                  height: 52,
                  borderRadius: 12,
                  background: isSubmitting
                    ? "#E5DDD5"
                    : "linear-gradient(135deg, #2C1810 0%, #5C3D2E 100%)",
                  border: "none",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  boxShadow: isSubmitting
                    ? "none"
                    : "0 4px 20px rgba(44,24,16,0.25)",
                  transition: "background 0.2s, box-shadow 0.2s",
                }}
              >
                {isSubmitting ? (
                  <svg
                    style={{ animation: "spin 0.8s linear infinite" }}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path
                      d="M10 2 a8 8 0 0 1 8 8"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                ) : (
                  <>
                    Sign In to Dashboard
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* Footer note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            style={{
              marginTop: 28,
              fontSize: 12,
              color: "#A89080",
              textAlign: "center",
              position: "relative",
              zIndex: 2,
            }}
          >
            Diamond Home Furniture ERP • Secure Access
          </motion.p>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
