import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";

type ModalType = "athlete" | "coach" | "org" | "org-success" | null;

interface ModalState {
  open: ModalType;
  athStep: number;
  athSport: string;
  athGoal: string;
  cchStep: number;
  cchSport: string;
  cchScale: string;
}

const C = {
  navy: "#0C1A27",
  navyCard: "#132130",
  navyMid: "#1A2D3F",
  orange: "#FF6432",
  orangeH: "#FF7A52",
  white: "#EEF2F6",
  muted: "#6A8499",
  border: "rgba(238,242,246,0.08)",
  borderM: "rgba(238,242,246,0.14)",
};

const fade: React.CSSProperties = {
  animation: "mcUp 0.7s ease forwards",
  opacity: 0,
};
const delays = [0.08, 0.2, 0.34, 0.48, 0.62, 0.76];

function Btn({ primary, onClick, children, style }: {
  primary?: boolean; onClick?: () => void; children: React.ReactNode; style?: React.CSSProperties;
}) {
  const [hover, setHover] = useState(false);
  const base: React.CSSProperties = primary
    ? { background: hover ? C.orangeH : C.orange, color: C.navy, border: "none", padding: "15px 30px", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, transition: "background 0.2s, transform 0.15s", transform: hover ? "translateY(-2px)" : "none", fontFamily: "'DM Sans', sans-serif", ...style }
    : { background: hover ? "rgba(255,100,50,0.06)" : "transparent", color: C.white, border: `1px solid ${hover ? C.orange : C.borderM}`, padding: "15px 30px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, transition: "border-color 0.2s, background 0.2s, transform 0.15s", transform: hover ? "translateY(-2px)" : "none", fontFamily: "'DM Sans', sans-serif", ...style };
  return <button style={base} onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>{children}</button>;
}

function NavCta({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      style={{ background: hover ? C.orangeH : C.orange, color: C.navy, border: "none", padding: "9px 22px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", transition: "background 0.2s, transform 0.1s", transform: hover ? "translateY(-1px)" : "none", fontFamily: "'DM Sans', sans-serif" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >{children}</button>
  );
}

function CardOpt({ icon, label, selected, onClick }: { icon: string; label: string; selected: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      style={{
        background: selected ? "rgba(255,100,50,0.08)" : "rgba(238,242,246,0.04)",
        border: `1px solid ${selected ? C.orange : hover ? "rgba(255,100,50,0.3)" : C.borderM}`,
        padding: "14px 16px", cursor: "pointer", textAlign: "left",
        color: selected || hover ? C.white : C.muted,
        transition: "border-color 0.2s, background 0.2s, color 0.2s",
        fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", fontWeight: 500,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span style={{ fontSize: "1.1rem", marginBottom: 6, display: "block" }}>{icon}</span>
      {label}
    </button>
  );
}

function FormBtn({ disabled, onClick, loading, children }: { disabled?: boolean; onClick?: () => void; loading?: boolean; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: "100%", background: disabled || loading ? "rgba(255,100,50,0.4)" : hover ? C.orangeH : C.orange,
        color: C.navy, border: "none", padding: 15,
        fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", fontWeight: 700,
        cursor: disabled || loading ? "not-allowed" : "pointer", transition: "background 0.2s", marginTop: 4,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >{loading ? "Creating account…" : children}</button>
  );
}

function BackBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      style={{ background: "none", border: "none", color: hover ? C.white : C.muted, fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", cursor: "pointer", marginTop: 10, width: "100%", textAlign: "center", transition: "color 0.2s" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >{children}</button>
  );
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ height: 3, flex: 1, background: i < current ? C.orange : C.borderM, transition: "background 0.3s" }} />
      ))}
    </div>
  );
}

function ModalShell({ id, open, onClose, children }: { id: string; open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      id={id}
      onClick={e => { if ((e.target as HTMLElement).id === id) onClose(); }}
      style={{
        display: open ? "flex" : "none",
        position: "fixed", inset: 0,
        background: "rgba(12,26,39,0.92)",
        zIndex: 200, alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{
        background: C.navyCard, border: `1px solid ${C.borderM}`,
        padding: "48px", width: "100%", maxWidth: 480,
        position: "relative", animation: open ? "mcUp 0.3s ease forwards" : "none",
        margin: "0 16px",
      }}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", color: C.muted, fontSize: "1.2rem", cursor: "pointer" }}
        >✕</button>
        {children}
      </div>
    </div>
  );
}

function ModalEye({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: C.orange, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 16, height: 1, background: C.orange, display: "inline-block" }} />
      {children}
    </div>
  );
}

function ModalH({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 28, lineHeight: 1, color: C.white }}>{children}</h3>;
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: C.muted, marginBottom: 10, display: "block" }}>{children}</label>;
}

function FormInput({ type = "text", placeholder, value, onChange, id }: { type?: string; placeholder: string; value: string; onChange: (v: string) => void; id?: string }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: "100%", background: "rgba(238,242,246,0.05)",
        border: `1px solid ${focus ? C.orange : C.borderM}`,
        padding: "13px 16px", color: C.white,
        fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem",
        marginBottom: 16, outline: "none", transition: "border-color 0.2s",
        boxSizing: "border-box",
      }}
    />
  );
}

function SuccessState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ fontSize: "3rem", marginBottom: 16 }}>{icon}</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", fontWeight: 800, textTransform: "uppercase", color: C.orange, marginBottom: 8 }}>{title}</div>
      <p style={{ fontSize: "0.875rem", color: C.muted, lineHeight: 1.6 }}>{sub}</p>
    </div>
  );
}

async function registerUser(data: { email: string; password: string; role: string; name?: string; firstName?: string; lastName?: string; sport?: string; teamSize?: string }) {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Registration failed" }));
    throw new Error(err.message || "Registration failed");
  }
  return res.json();
}

function AthleteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [sport, setSport] = useState("");
  const [goal, setGoal] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reset = useCallback(() => {
    setStep(1); setSport(""); setGoal(""); setFirstName(""); setLastName("");
    setEmail(""); setPassword(""); setLoading(false); setError(""); setSuccess(false);
  }, []);

  const handleClose = () => { reset(); onClose(); };

  const eyeText = ["Step 1 of 4", "Step 2 of 4", "Step 3 of 4", "✓ Complete"];
  const titleText = ["What sport do\nyou play?", "What is your\nmain goal?", "Create your\naccount", ""];
  const formValid = email.includes("@") && password.length >= 8 && firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleCreate = async () => {
    setLoading(true); setError("");
    try {
      await registerUser({ email, password, role: "athlete", firstName, lastName, sport, name: `${firstName} ${lastName}` });
      setSuccess(true); setStep(4);
      setTimeout(() => { window.location.href = "/athlete"; }, 1800);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const sports = [
    { icon: "🏐", label: "Netball" }, { icon: "🏉", label: "AFL" },
    { icon: "⚽", label: "Soccer" }, { icon: "🏈", label: "Rugby" },
    { icon: "🏀", label: "Basketball" }, { icon: "🏃", label: "Athletics / Other" },
  ];
  const goals = [
    { icon: "⚡", label: "Get faster" },
    { icon: "🛡", label: "Stay injury-free" },
    { icon: "🎯", label: "Both — I want to be faster AND more durable", span: true },
  ];

  return (
    <ModalShell id="modal-athlete" open={open} onClose={handleClose}>
      <ModalEye>{eyeText[step - 1]}</ModalEye>
      {step < 4 && <ModalH>{titleText[step - 1]}</ModalH>}
      <ProgressDots total={4} current={step} />

      {step === 1 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            {sports.map(s => <CardOpt key={s.label} icon={s.icon} label={s.label} selected={sport === s.label} onClick={() => setSport(s.label)} />)}
          </div>
          <FormBtn disabled={!sport} onClick={() => setStep(2)}>Continue →</FormBtn>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            {goals.map(g => (
              <div key={g.label} style={g.span ? { gridColumn: "1 / -1" } : {}}>
                <CardOpt icon={g.icon} label={g.label} selected={goal === g.label} onClick={() => setGoal(g.label)} />
              </div>
            ))}
          </div>
          <FormBtn disabled={!goal} onClick={() => setStep(3)}>Continue →</FormBtn>
          <BackBtn onClick={() => setStep(1)}>← Back</BackBtn>
        </>
      )}

      {step === 3 && (
        <>
          <FormLabel>First name</FormLabel>
          <FormInput placeholder="e.g. Jessica" value={firstName} onChange={setFirstName} />
          <FormLabel>Last name</FormLabel>
          <FormInput placeholder="e.g. Morris" value={lastName} onChange={setLastName} />
          <FormLabel>Email address</FormLabel>
          <FormInput type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
          <FormLabel>Password</FormLabel>
          <FormInput type="password" placeholder="Min. 8 characters" value={password} onChange={setPassword} />
          {error && <p style={{ color: "#FF6060", fontSize: "0.8rem", marginBottom: 8 }}>{error}</p>}
          <FormBtn disabled={!formValid} loading={loading} onClick={handleCreate}>Create my account →</FormBtn>
          <BackBtn onClick={() => setStep(2)}>← Back</BackBtn>
        </>
      )}

      {step === 4 && (
        <SuccessState icon="✅" title="You're in!" sub="Your athlete account is created. Your sport-specific program is being built — check your email to access your dashboard." />
      )}
    </ModalShell>
  );
}

function CoachModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [sport, setSport] = useState("");
  const [scale, setScale] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = useCallback(() => {
    setStep(1); setSport(""); setScale(""); setName(""); setEmail(""); setPassword(""); setLoading(false); setError("");
  }, []);
  const handleClose = () => { reset(); onClose(); };

  const eyeText = ["Step 1 of 3", "Step 2 of 3", "Step 3 of 3", "✓ Complete"];
  const titleText = ["What sport do\nyou coach?", "How many athletes\ndo you work with?", "Create your\ncoach account", ""];
  const formValid = email.includes("@") && password.length >= 8 && name.trim().length > 0;

  const handleCreate = async () => {
    setLoading(true); setError("");
    try {
      await registerUser({ email, password, role: "coach", name, sport, teamSize: scale });
      setStep(4);
      setTimeout(() => { window.location.href = "/coach"; }, 1800);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const sports = [
    { icon: "🏐", label: "Netball" }, { icon: "🏉", label: "AFL" },
    { icon: "⚽", label: "Soccer" }, { icon: "🏈", label: "Rugby" },
    { icon: "🔀", label: "Multiple sports" }, { icon: "💪", label: "General athlete dev" },
  ];
  const scales = [
    { icon: "👤", label: "1–5 athletes" }, { icon: "👥", label: "6–20 athletes" },
    { icon: "🏟", label: "21–50 athletes" }, { icon: "🏢", label: "50+ / Organisation" },
  ];

  return (
    <ModalShell id="modal-coach" open={open} onClose={handleClose}>
      <ModalEye>{eyeText[step - 1]}</ModalEye>
      {step < 4 && <ModalH>{titleText[step - 1]}</ModalH>}
      <ProgressDots total={3} current={Math.min(step, 3)} />

      {step === 1 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            {sports.map(s => <CardOpt key={s.label} icon={s.icon} label={s.label} selected={sport === s.label} onClick={() => setSport(s.label)} />)}
          </div>
          <FormBtn disabled={!sport} onClick={() => setStep(2)}>Continue →</FormBtn>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            {scales.map(s => <CardOpt key={s.label} icon={s.icon} label={s.label} selected={scale === s.label} onClick={() => setScale(s.label)} />)}
          </div>
          <FormBtn disabled={!scale} onClick={() => setStep(3)}>Continue →</FormBtn>
          <BackBtn onClick={() => setStep(1)}>← Back</BackBtn>
        </>
      )}

      {step === 3 && (
        <>
          <FormLabel>Full name</FormLabel>
          <FormInput placeholder="e.g. Tom Kennedy" value={name} onChange={setName} />
          <FormLabel>Email address</FormLabel>
          <FormInput type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
          <FormLabel>Password</FormLabel>
          <FormInput type="password" placeholder="Min. 8 characters" value={password} onChange={setPassword} />
          {error && <p style={{ color: "#FF6060", fontSize: "0.8rem", marginBottom: 8 }}>{error}</p>}
          <FormBtn disabled={!formValid} loading={loading} onClick={handleCreate}>Get early access →</FormBtn>
          <BackBtn onClick={() => setStep(2)}>← Back</BackBtn>
        </>
      )}

      {step === 4 && (
        <SuccessState icon="🎯" title="Access granted!" sub="Your coach account is ready. Check your email — your dashboard link and first program builder walkthrough are waiting." />
      )}
    </ModalShell>
  );
}

function OrgModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [orgName, setOrgName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("");

  const reset = useCallback(() => { setOrgName(""); setContactName(""); setEmail(""); setGoal(""); }, []);
  const handleClose = () => { reset(); onClose(); };

  return (
    <ModalShell id="modal-org" open={open} onClose={handleClose}>
      <ModalEye>For Organisations</ModalEye>
      <ModalH>Let's talk<br />partnership.</ModalH>
      <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
        <div style={{ height: 3, flex: 1, background: C.orange }} />
      </div>
      <FormLabel>Organisation name</FormLabel>
      <FormInput placeholder="e.g. Netball Australia" value={orgName} onChange={setOrgName} />
      <FormLabel>Your name &amp; role</FormLabel>
      <FormInput placeholder="e.g. Jane Smith, Participation Manager" value={contactName} onChange={setContactName} />
      <FormLabel>Email address</FormLabel>
      <FormInput type="email" placeholder="you@organisation.com.au" value={email} onChange={setEmail} />
      <FormLabel>What are you looking to achieve?</FormLabel>
      <FormInput placeholder="e.g. Give our 10,000 registered athletes access" value={goal} onChange={setGoal} />
      <FormBtn onClick={() => { reset(); onSuccess(); }}>Send enquiry →</FormBtn>
    </ModalShell>
  );
}

function OrgSuccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ModalShell id="modal-org-success" open={open} onClose={onClose}>
      <SuccessState icon="🤝" title="Enquiry sent!" sub="Thanks for reaching out. We'll be in touch within 48 hours to discuss how Motion Code can work for your organisation." />
    </ModalShell>
  );
}

export default function MotionCodeLanding() {
  const [modal, setModal] = useState<ModalType>(null);
  const openModal = (type: ModalType) => { setModal(type); document.body.style.overflow = "hidden"; };
  const closeModal = () => { setModal(null); document.body.style.overflow = ""; };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ background: C.navy, color: C.white, fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>
      <style>{`
        @keyframes mcUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .mc-anim { animation: mcUp 0.7s ease forwards; opacity:0; }
        .mc-d1 { animation-delay:0.08s; }
        .mc-d2 { animation-delay:0.2s; }
        .mc-d3 { animation-delay:0.34s; }
        .mc-d4 { animation-delay:0.48s; }
        .mc-d5 { animation-delay:0.62s; }
        .mc-d6 { animation-delay:0.76s; }
        .mc-nav-link { color:${C.muted}; text-decoration:none; font-size:0.85rem; font-weight:500; transition:color 0.2s; }
        .mc-nav-link:hover { color:${C.white}; }
        .mc-step { background:${C.navyCard}; padding:36px 32px; position:relative; overflow:hidden; transition:background 0.3s; border:1px solid ${C.border}; }
        .mc-step:hover { background:${C.navyMid}; }
        .mc-footer-link { font-size:0.7rem; color:${C.muted}; text-decoration:none; letter-spacing:0.04em; transition:color 0.2s; }
        .mc-footer-link:hover { color:${C.white}; }
        ::placeholder { color:${C.muted}; opacity: 0.6; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", background: "rgba(12,26,39,0.95)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.4rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          <div style={{ width: 26, height: 26, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, color: C.navy, clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)" }}>MC</div>
          Motion Code
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <button onClick={() => scrollTo("how")} className="mc-nav-link" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>How it works</button>
          <button onClick={() => scrollTo("audience")} className="mc-nav-link" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>For Athletes</button>
          <button onClick={() => scrollTo("audience")} className="mc-nav-link" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>For Coaches</button>
          <button onClick={() => openModal("org")} className="mc-nav-link" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Organisations</button>
          <Link href="/login"><NavCta>Log in</NavCta></Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 55% 60% at 75% 15%,rgba(255,100,50,0.08) 0%,transparent 65%),radial-gradient(ellipse 50% 50% at 15% 85%,rgba(255,100,50,0.04) 0%,transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,100,50,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,100,50,0.025) 1px,transparent 1px)", backgroundSize: "72px 72px", pointerEvents: "none" }} />

        <div className="mc-anim mc-d1" style={{ position: "relative", zIndex: 5, padding: "60px 40px 40px", maxWidth: 900 }}>
          <div className="mc-anim mc-d1" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.25em", textTransform: "uppercase", color: C.orange, marginBottom: 24 }}>
            <span style={{ width: 26, height: 1, background: C.orange, display: "inline-block" }} />
            Strength &amp; Movement for Sport
          </div>

          <h1 className="mc-anim mc-d2" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(4rem,11vw,9rem)", fontWeight: 800, lineHeight: 0.88, letterSpacing: "-0.01em", textTransform: "uppercase", marginBottom: 24 }}>
            Run Faster.<br />
            <span style={{ color: C.orange }}>Play Longer.</span>
          </h1>

          <p className="mc-anim mc-d3" style={{ fontSize: "clamp(0.95rem,1.7vw,1.15rem)", fontWeight: 300, lineHeight: 1.65, color: "rgba(238,242,246,0.65)", maxWidth: 500, marginBottom: 40 }}>
            The strength and movement platform for athletes who want to perform — and the coaches who develop them.
          </p>

          <div className="mc-anim mc-d4" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <Btn primary onClick={() => openModal("athlete")}>I'm an Athlete <span>→</span></Btn>
            <Btn onClick={() => openModal("coach")}>I'm a Coach <span>→</span></Btn>
          </div>

          <p className="mc-anim mc-d5" style={{ marginTop: 14, fontSize: "0.76rem", color: C.muted }}>
            Are you a sporting organisation or NSO?{" "}
            <button onClick={() => openModal("org")} style={{ background: "none", border: "none", color: C.muted, textDecoration: "underline", textUnderlineOffset: 3, fontSize: "0.76rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Get in touch →</button>
          </p>
        </div>

        {/* Stats bar */}
        <div className="mc-anim mc-d6" style={{ position: "relative", zIndex: 5, display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: `1px solid ${C.border}`, margin: "44px 40px 0" }}>
          {[
            { n: "6", l: "Sports covered" },
            { n: "40+", l: "Prescribed exercises" },
            { n: "3", l: "Training phases" },
            { n: "AUS", l: "Built for Australian sport" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "24px 0 24px 28px", borderRight: i < 3 ? `1px solid ${C.border}` : "none", ...(i === 0 ? { paddingLeft: 0 } : {}) }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2.2rem", fontWeight: 800, color: C.orange, letterSpacing: "0.02em", lineHeight: 1, marginBottom: 4 }}>{s.n}</div>
              <div style={{ fontSize: "0.68rem", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: "80px 40px" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: C.orange, display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ width: 20, height: 1, background: C.orange, display: "inline-block" }} />
          How it works
        </div>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.2rem,4.5vw,3.6rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1, marginBottom: 48 }}>
          Simple. Specific.<br />Effective.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2 }}>
          {[
            { n: "01", title: "Know Your Movement", desc: "Tell us your sport, your position, and your goals. Motion Code builds your profile and understands the physical demands you face every game." },
            { n: "02", title: "Get Your Program", desc: "Receive strength and power exercises built for exactly how you run and play. No generic gym plans. Every exercise has a reason." },
            { n: "03", title: "Track What Changes", desc: "See your consistency, watch your progress, and perform when it counts. Your coach can follow along and adjust as the season evolves." },
          ].map((step) => (
            <div key={step.n} className="mc-step">
              <div style={{ position: "absolute", bottom: -20, right: 10, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "7rem", fontWeight: 800, color: "rgba(255,100,50,0.04)", lineHeight: 1, pointerEvents: "none" }}>{step.n}</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.orange, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                {`Step ${step.n}`}
                <span style={{ flex: 1, height: 1, background: "rgba(255,100,50,0.2)", display: "inline-block" }} />
              </div>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.55rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 10, color: C.white }}>{step.title}</h3>
              <p style={{ fontSize: "0.86rem", color: "rgba(238,242,246,0.55)", lineHeight: 1.7 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AUDIENCE ── */}
      <div id="audience" style={{ padding: "0 40px 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        {/* Athlete card */}
        <div style={{ background: C.orange, padding: "48px 44px", position: "relative", overflow: "hidden" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(12,26,39,0.6)", marginBottom: 16 }}>For Athletes</div>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(1.9rem,3.5vw,3rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 0.92, marginBottom: 24, color: C.navy }}>
            Your program.<br />Your sport.<br />Your edge.
          </h3>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
            {[
              "Strength programs built for your sport and position — not generic gym work",
              "Understand exactly what to do and why it makes you faster and more resilient",
              "Track your consistency week to week and see real improvement",
            ].map((item, i) => (
              <li key={i} style={{ fontSize: "0.875rem", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 10, color: "rgba(12,26,39,0.75)" }}>
                <span style={{ flexShrink: 0, width: 17, height: 17, borderRadius: "50%", background: "rgba(12,26,39,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.58rem", color: C.navy, marginTop: 2 }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={() => openModal("athlete")}
            style={{ background: C.navy, color: C.orange, border: "none", padding: "14px 28px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, transition: "transform 0.15s, opacity 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Start free →
          </button>
        </div>

        {/* Coach card */}
        <div style={{ background: C.navyCard, border: `1px solid ${C.border}`, padding: "48px 44px", position: "relative", overflow: "hidden" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>For Coaches</div>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(1.9rem,3.5vw,3rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 0.92, marginBottom: 24, color: C.white }}>
            Prescribe better.<br />In less time.
          </h3>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
            {[
              "Build evidence-based programs in minutes, not hours",
              "Monitor every athlete's compliance and progress in one place",
              "Build a library of templates and reuse them across your entire roster",
            ].map((item, i) => (
              <li key={i} style={{ fontSize: "0.875rem", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 10, color: "rgba(238,242,246,0.65)" }}>
                <span style={{ flexShrink: 0, width: 17, height: 17, borderRadius: "50%", background: "rgba(255,100,50,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.58rem", color: C.orange, marginTop: 2 }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={() => openModal("coach")}
            style={{ background: C.orange, color: C.navy, border: "none", padding: "14px 28px", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, transition: "transform 0.15s, opacity 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Get early access →
          </button>
        </div>
      </div>

      {/* ── PROOF ── */}
      <div style={{ padding: "0 40px 80px" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: C.orange, display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <span style={{ width: 20, height: 1, background: C.orange, display: "inline-block" }} />
          What coaches say
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 2 }}>
          <div style={{ background: C.navyCard, border: `1px solid ${C.border}`, padding: "48px 52px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 220 }}>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "4.5rem", fontWeight: 800, color: C.orange, lineHeight: 0.8, marginBottom: 10, opacity: 0.5 }}>"</div>
              <p style={{ fontSize: "clamp(0.95rem,1.8vw,1.25rem)", fontWeight: 300, lineHeight: 1.6, color: C.white, marginBottom: 24 }}>
                Finally a tool that understands sport-specific demands. My athletes know <em style={{ fontStyle: "normal", color: C.orange }}>why</em> they're doing every exercise — and that changes how hard they work.
              </p>
            </div>
            <div style={{ fontSize: "0.72rem", color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", fontWeight: 500 }}>
              S&amp;C Coach — Australian Football
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { n: "3 min", l: "Average time to build a full athlete program" },
              { n: "↑ 87%", l: "Of early users completed their program in week one" },
            ].map((s, i) => (
              <div key={i} style={{ background: C.navyCard, border: `1px solid ${C.border}`, padding: "28px 32px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2.8rem", fontWeight: 800, color: C.orange, lineHeight: 1, marginBottom: 5 }}>{s.n}</div>
                <div style={{ fontSize: "0.76rem", color: C.muted, lineHeight: 1.45 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CREDIBILITY ── */}
      <div style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, margin: "0 40px", padding: "32px 0", display: "flex", alignItems: "center", gap: 36 }}>
        <p style={{ flex: 1, fontSize: "0.84rem", color: C.muted, lineHeight: 1.7 }}>
          Motion Code is built on the methodology behind{" "}
          <a href="https://preparedtoplay.replit.app" target="_blank" rel="noreferrer" style={{ color: C.orange, textDecoration: "none", fontWeight: 500 }}>Prepared to Play</a>
          {" "}— developed through applied speed development work with athletes across Australian sport.
        </p>
        <div style={{ flexShrink: 0, fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.12em", color: C.muted, border: `1px solid ${C.borderM}`, padding: "10px 16px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          A Prepared to Play Platform
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "90px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 50% 100%,rgba(255,100,50,0.07) 0%,transparent 65%)", pointerEvents: "none" }} />
        <h2 style={{ position: "relative", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.8rem,6.5vw,6rem)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 0.9, marginBottom: 16 }}>
          Ready to<br /><span style={{ color: C.orange }}>Move Better?</span>
        </h2>
        <p style={{ position: "relative", fontSize: "0.95rem", color: C.muted, marginBottom: 36 }}>
          Join athletes and coaches building performance that lasts.
        </p>
        <div style={{ position: "relative", display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn primary onClick={() => openModal("athlete")}>I'm an Athlete — Start Free <span>→</span></Btn>
          <Btn onClick={() => openModal("coach")}>I'm a Coach — Get Early Access <span>→</span></Btn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted }}>
          Motion Code · A Prepared to Play Platform
        </span>
        <div style={{ display: "flex", gap: 24 }}>
          {["Privacy Policy", "Terms of Service", "Contact", "For Organisations"].map(link => (
            <a key={link} href="#" className="mc-footer-link">{link}</a>
          ))}
        </div>
      </footer>

      {/* ── MODALS ── */}
      <AthleteModal open={modal === "athlete"} onClose={closeModal} />
      <CoachModal open={modal === "coach"} onClose={closeModal} />
      <OrgModal open={modal === "org"} onClose={closeModal} onSuccess={() => { closeModal(); openModal("org-success"); }} />
      <OrgSuccessModal open={modal === "org-success"} onClose={closeModal} />
    </div>
  );
}
