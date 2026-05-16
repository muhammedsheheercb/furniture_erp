"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const schema = z.object({
  email: z.string().min(1, "Name or Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [authError, setAuthError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    if (res?.error) setAuthError("Invalid credentials");
    else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-input:focus {
          border-color: #2d2d2d !important;
          box-shadow: 0 0 0 3px rgba(45,45,45,0.08) !important;
        }
        @media (max-width: 680px) {
          .login-card {
            flex-direction: column !important;
            border-radius: 20px !important;
            min-height: unset !important;
          }
          .login-image-panel {
            width: 100% !important;
            flex: none !important;
            height: 220px !important;
            min-height: unset !important;
            order: -1;
          }
          .login-image-panel img {
            border-radius: 0 !important;
            object-position: center 60% !important;
          }
          .login-form-panel {
            flex: 1 1 100% !important;
            padding: 32px 24px 36px !important;
            border-radius: 0 !important;
          }
          .login-title { font-size: 28px !important; }
          .login-btn   { width: 100% !important; }
        }
        @media (max-width: 400px) {
          .login-image-panel { height: 180px !important; }
          .login-form-panel  { padding: 26px 18px 32px !important; }
          .login-title       { font-size: 24px !important; }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          fontFamily: "'Inter', system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
          background: "#ddeedd",
        }}
      >
        {/* Watercolor blobs */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        }}>
          <div style={{
            position: "absolute", top: "-10%", left: "-8%",
            width: "45%", height: "55%",
            background: "radial-gradient(ellipse, rgba(120,180,120,0.45) 0%, rgba(140,195,130,0.2) 50%, transparent 75%)",
            borderRadius: "60% 40% 70% 30% / 50% 60% 40% 50%",
            filter: "blur(24px)",
          }} />
          <div style={{
            position: "absolute", bottom: "0%", right: "-5%",
            width: "40%", height: "50%",
            background: "radial-gradient(ellipse, rgba(100,165,100,0.4) 0%, rgba(130,185,120,0.18) 50%, transparent 75%)",
            borderRadius: "40% 60% 30% 70% / 60% 40% 60% 40%",
            filter: "blur(28px)",
          }} />
          <div style={{
            position: "absolute", top: "30%", right: "10%",
            width: "25%", height: "35%",
            background: "radial-gradient(ellipse, rgba(160,210,155,0.3) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(20px)",
          }} />
        </div>

        {/* Card */}
        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            width: "100%",
            maxWidth: 880,
            minHeight: 520,
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
          }}
        >

          {/* LEFT: Form */}
          <div
            className="login-form-panel"
            style={{
              flex: "0 0 52%",
              background: "#F8F3E8",
              padding: "52px 48px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <h1
              className="login-title"
              style={{
                margin: "0 0 10px",
                fontSize: 36,
                fontWeight: 700,
                color: "#1a1a1a",
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
              }}
            >
              Log In To Your
              <br />
              Account
            </h1>
            <p
              style={{
                margin: "0 0 36px",
                fontSize: 13,
                color: "#888",
                lineHeight: 1.65,
                maxWidth: 290,
              }}
            >
              Manage your furniture inventory, orders, and business operations with ease.
            </p>

            <form
              onSubmit={handleSubmit(onSubmit)}
              style={{ display: "flex", flexDirection: "column", gap: 22 }}
            >
              {/* Email */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: "#2d2d2d",
                    marginBottom: 8,
                  }}
                >
                  Name or Email *
                </label>
                <input
                  className="login-input"
                  type="text"
                  placeholder="Enter Name or Email"
                  {...register("email")}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: "100%",
                    height: 48,
                    borderRadius: 12,
                    border: `1.5px solid ${focusedField === "email" ? "#2d2d2d" : "#DDD5C5"}`,
                    padding: "0 16px",
                    fontSize: 14,
                    color: "#1a1a1a",
                    background: "#fff",
                    outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                />
                <p style={{ margin: "4px 0 0 2px", fontSize: 11, color: "#C9A84C", fontWeight: 500 }}>
                  Workers: Use your Name to log in
                </p>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ margin: "5px 0 0 2px", fontSize: 12, color: "#d32f2f" }}
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: "#2d2d2d",
                    marginBottom: 8,
                  }}
                >
                  Password*
                </label>
                <div style={{ position: "relative" }}>
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
                      border: `1.5px solid ${focusedField === "password" ? "#2d2d2d" : "#DDD5C5"}`,
                      padding: "0 46px 0 16px",
                      fontSize: 14,
                      color: "#1a1a1a",
                      background: "#fff",
                      outline: "none",
                      transition: "border-color 0.2s, box-shadow 0.2s",
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
                      color: "#aaa",
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
                      style={{ margin: "5px 0 0 2px", fontSize: 12, color: "#d32f2f" }}
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Auth error */}
              <AnimatePresence>
                {authError && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "#d32f2f",
                      fontWeight: 500,
                      background: "#fdf0f0",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "1px solid #f5c6c6",
                    }}
                  >
                    ⚠ {authError}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                className="login-btn"
                disabled={isSubmitting}
                style={{
                  width: "55%",
                  height: 50,
                  borderRadius: 30,
                  background: isSubmitting ? "#555" : "#1a1a1a",
                  border: "none",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.2s, transform 0.1s",
                }}
                onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = "#333"; }}
                onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = "#1a1a1a"; }}
              >
                {isSubmitting ? (
                  <svg
                    style={{ animation: "spin 0.8s linear infinite" }}
                    width="18" height="18" viewBox="0 0 18 18" fill="none"
                  >
                    <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
                    <path d="M9 2 a7 7 0 0 1 7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  "LOG IN"
                )}
              </button>
            </form>
          </div>

          {/* RIGHT: Furniture image */}
          <div
            className="login-image-panel"
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85"
              alt="Elegant furniture"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
              }}
            />
          </div>
        </motion.div>
      </div>
    </>
  );
}
