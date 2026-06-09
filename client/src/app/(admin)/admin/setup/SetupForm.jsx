"use client";

import { API_URL } from "@/config/site";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Building2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { setupApi } from "@/lib/api";
import { useAuth } from "@/context/useAuth";

const REQUIREMENTS = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  {
    id: "upper",
    label: "One uppercase letter (A-Z)",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "lower",
    label: "One lowercase letter (a-z)",
    test: (p) => /[a-z]/.test(p),
  },
  { id: "number", label: "One number (0-9)", test: (p) => /[0-9]/.test(p) },
];

function PasswordStrength({ password }) {
  const met = REQUIREMENTS.filter((r) => r.test(password)).length;
  const pct = (met / REQUIREMENTS.length) * 100;
  const color =
    pct === 0
      ? "#E2E8F0"
      : pct <= 25
        ? "#EF4444"
        : pct <= 50
          ? "#F59E0B"
          : pct <= 75
            ? "#38BDF8"
            : "#22C55E";
  return (
    <div style={{ marginTop: "0.75rem" }}>
      <div
        style={{
          height: "4px",
          borderRadius: "9999px",
          background: "rgba(255,255,255,0.08)",
          marginBottom: "0.75rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: "9999px",
            transition: "width 300ms ease",
          }}
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.375rem",
        }}
      >
        {REQUIREMENTS.map((r) => {
          const ok = r.test(password);
          return (
            <div
              key={r.id}
              style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
            >
              <CheckCircle
                size={11}
                style={{
                  color: ok ? "#22C55E" : "rgba(255,255,255,0.2)",
                  flexShrink: 0,
                  transition: "color 200ms",
                }}
              />
              <span
                style={{
                  fontSize: "0.7rem",
                  color: ok
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(255,255,255,0.25)",
                  transition: "color 200ms",
                }}
              >
                {r.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SetupForm() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [siteName, setSiteName] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/settings`)
      .then((r) => r.json())
      .then((json) => {
        const name = json?.data?.settings?.site_name;
        if (name) setSiteName(name);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/admin");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    async function check() {
      try {
        const res = await setupApi.getStatus();
        if (!res.data.setup_required) {
          router.replace("/admin/login");
          return;
        }
      } catch {
        /* API unreachable — show form anyway */
      } finally {
        setChecking(false);
      }
    }
    check();
  }, [router]);

  const handleChange = (e) => {
    setError("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const passwordOk = REQUIREMENTS.every((r) => r.test(form.password));
  const canSubmit =
    form.name &&
    form.email &&
    passwordOk &&
    form.confirm_password === form.password &&
    form.confirm_password !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await setupApi.create(form);
      await login(form.email, form.password);
      setDone(true);
    } catch (err) {
      const msg = err.message || "Setup failed.";
      if (msg.toLowerCase().includes("already")) {
        router.replace("/admin/login");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCss = {
    width: "100%",
    padding: "0.8125rem 1rem",
    borderRadius: "0.75rem",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    fontSize: "0.9375rem",
    outline: "none",
    fontFamily: "Inter, sans-serif",
    boxSizing: "border-box",
    transition: "border-color 200ms, background 200ms",
    opacity: loading ? 0.6 : 1,
  };

  if (checking || authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #060B14 0%, #0F172A 100%)",
        }}
      >
        <Loader2
          size={32}
          style={{ color: "#FF6B6B", animation: "spin 1s linear infinite" }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #060B14 0%, #0F172A 60%, #1E2D4A 100%)",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-5%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,107,107,0.07) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.02,
          backgroundImage: "radial-gradient(white 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: "480px", position: "relative" }}>
        {/* Success */}
        {done && (
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "1.5rem",
              padding: "3rem 2.5rem",
              backdropFilter: "blur(20px)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "5rem",
                height: "5rem",
                borderRadius: "50%",
                background: "rgba(34,197,94,0.15)",
                border: "2px solid rgba(34,197,94,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <CheckCircle size={36} style={{ color: "#22C55E" }} />
            </div>
            <h2
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 800,
                fontSize: "1.625rem",
                color: "white",
                marginBottom: "0.75rem",
                letterSpacing: "-0.02em",
              }}
            >
              You're all set!
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.9375rem",
                lineHeight: 1.7,
                marginBottom: "2rem",
              }}
            >
              Your super admin account has been created and you are now logged
              in.
            </p>
            <button
              onClick={() => router.replace("/admin")}
              style={{
                width: "100%",
                padding: "0.9rem 1.5rem",
                borderRadius: "0.75rem",
                border: "none",
                background: "linear-gradient(135deg, #FF6B6B 0%, #E85555 100%)",
                color: "white",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 700,
                fontSize: "0.9375rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 8px 24px rgba(255,107,107,0.35)",
              }}
            >
              Go to Dashboard <ArrowRight size={17} />
            </button>
          </div>
        )}

        {/* Form */}
        {!done && (
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "1.5rem",
              padding: "2.5rem",
              backdropFilter: "blur(20px)",
              boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div
                style={{
                  width: "3.5rem",
                  height: "3.5rem",
                  borderRadius: "1rem",
                  background:
                    "linear-gradient(135deg, #FF6B6B 0%, #E85555 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.25rem",
                  boxShadow: "0 8px 24px rgba(255,107,107,0.35)",
                }}
              >
                <Building2 size={24} style={{ color: "white" }} />
              </div>
              <h1
                style={{
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontWeight: 800,
                  fontSize: "1.625rem",
                  color: "white",
                  marginBottom: "0.5rem",
                  letterSpacing: "-0.02em",
                }}
              >
                Welcome to {siteName || "Admin"}
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                }}
              >
                Create your admin account to get started.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                justifyContent: "center",
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                background: "rgba(56,189,248,0.08)",
                border: "1px solid rgba(56,189,248,0.2)",
                marginBottom: "1.75rem",
              }}
            >
              <ShieldCheck size={13} style={{ color: "#38BDF8" }} />
              <span
                style={{
                  color: "#38BDF8",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                }}
              >
                First-run setup — this page locks after account creation
              </span>
            </div>

            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.625rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "0.75rem",
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  marginBottom: "1.5rem",
                }}
              >
                <AlertCircle
                  size={16}
                  style={{
                    color: "#EF4444",
                    flexShrink: 0,
                    marginTop: "0.1rem",
                  }}
                />
                <p
                  style={{
                    color: "#FCA5A5",
                    fontSize: "0.875rem",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.125rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    color: "rgba(255,255,255,0.6)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Full Name
                </label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Chukwuemeka Adeyemi"
                  autoComplete="name"
                  disabled={loading}
                  style={inputCss}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#FF6B6B";
                    e.target.style.background = "rgba(255,255,255,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.12)";
                    e.target.style.background = "rgba(255,255,255,0.06)";
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    color: "rgba(255,255,255,0.6)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@yourcompany.com"
                  autoComplete="email"
                  disabled={loading}
                  style={inputCss}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#FF6B6B";
                    e.target.style.background = "rgba(255,255,255,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.12)";
                    e.target.style.background = "rgba(255,255,255,0.06)";
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    color: "rgba(255,255,255,0.6)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    name="password"
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    disabled={loading}
                    style={{ ...inputCss, paddingRight: "3rem" }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#FF6B6B";
                      e.target.style.background = "rgba(255,255,255,0.08)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255,255,255,0.12)";
                      e.target.style.background = "rgba(255,255,255,0.06)";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    style={{
                      position: "absolute",
                      right: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.3)",
                      padding: "0.25rem",
                    }}
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {form.password && <PasswordStrength password={form.password} />}
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    color: "rgba(255,255,255,0.6)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    name="confirm_password"
                    type={showConf ? "text" : "password"}
                    value={form.confirm_password}
                    onChange={handleChange}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    disabled={loading}
                    style={{
                      ...inputCss,
                      paddingRight: "3rem",
                      borderColor:
                        form.confirm_password &&
                        form.confirm_password !== form.password
                          ? "rgba(239,68,68,0.5)"
                          : "rgba(255,255,255,0.12)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#FF6B6B";
                      e.target.style.background = "rgba(255,255,255,0.08)";
                    }}
                    onBlur={(e) => {
                      const m =
                        form.confirm_password &&
                        form.confirm_password !== form.password;
                      e.target.style.borderColor = m
                        ? "rgba(239,68,68,0.5)"
                        : "rgba(255,255,255,0.12)";
                      e.target.style.background = "rgba(255,255,255,0.06)";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConf((p) => !p)}
                    style={{
                      position: "absolute",
                      right: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.3)",
                      padding: "0.25rem",
                    }}
                  >
                    {showConf ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {form.confirm_password &&
                  form.confirm_password !== form.password && (
                    <p
                      style={{
                        color: "#FCA5A5",
                        fontSize: "0.75rem",
                        marginTop: "0.375rem",
                      }}
                    >
                      Passwords do not match
                    </p>
                  )}
                {form.confirm_password &&
                  form.confirm_password === form.password && (
                    <p
                      style={{
                        color: "#86EFAC",
                        fontSize: "0.75rem",
                        marginTop: "0.375rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <CheckCircle size={11} /> Passwords match
                    </p>
                  )}
              </div>
              <button
                type="submit"
                disabled={loading || !canSubmit}
                style={{
                  width: "100%",
                  padding: "0.9rem 1.5rem",
                  marginTop: "0.5rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  background:
                    canSubmit && !loading
                      ? "linear-gradient(135deg, #FF6B6B 0%, #E85555 100%)"
                      : "rgba(255,107,107,0.3)",
                  color: "white",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  cursor: canSubmit && !loading ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow:
                    canSubmit && !loading
                      ? "0 8px 24px rgba(255,107,107,0.35)"
                      : "none",
                  transition: "all 150ms",
                }}
              >
                {loading ? (
                  <>
                    <Loader2
                      size={17}
                      style={{ animation: "spin 1s linear infinite" }}
                    />{" "}
                    Creating Account…
                  </>
                ) : (
                  <>
                    Create Admin Account <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <p
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: "0.75rem",
                textAlign: "center",
                marginTop: "1.5rem",
              }}
            >
              Already have an account?{" "}
              <a
                href="/admin/login"
                style={{ color: "#FF9B9B", textDecoration: "none" }}
              >
                Sign in
              </a>
            </p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
