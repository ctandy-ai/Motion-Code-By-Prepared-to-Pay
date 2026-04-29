import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";

type ModalType = "athlete" | "coach" | "org" | "org-success" | null;

async function registerUser(data: {
  email: string; password: string; role: string;
  name?: string; firstName?: string; lastName?: string;
  sport?: string; teamSize?: string;
}) {
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

// ── Shared sub-components ─────────────────────────────────────────────────

function Btn({ primary, onClick, children }: {
  primary?: boolean; onClick?: () => void; children: React.ReactNode;
}) {
  if (primary) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 px-8 py-4 bg-p2p-orange hover:bg-p2p-orange-hover text-p2p-dark font-bold text-sm transition-all duration-200 hover:-translate-y-0.5"
      >
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-8 py-4 text-p2p-text border border-white/15 hover:border-p2p-orange hover:bg-p2p-orange/5 font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
    >
      {children}
    </button>
  );
}

function NavCta({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="bg-p2p-orange hover:bg-p2p-orange-hover text-p2p-dark font-bold text-sm px-5 py-2 transition-all duration-200 hover:-translate-y-px"
    >
      {children}
    </button>
  );
}

function CardOpt({ icon, label, selected, onClick }: {
  icon: string; label: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 text-left text-sm font-medium transition-all duration-200 border ${
        selected
          ? "bg-p2p-orange/10 border-p2p-orange text-p2p-text"
          : "bg-p2p-text/[0.04] border-white/15 text-p2p-muted hover:border-p2p-orange/30 hover:text-p2p-text"
      }`}
    >
      <span className="text-lg mb-1.5 block">{icon}</span>
      {label}
    </button>
  );
}

function FormBtn({ disabled, onClick, loading, children }: {
  disabled?: boolean; onClick?: () => void; loading?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-4 mt-1 font-bold text-sm text-p2p-dark bg-p2p-orange hover:bg-p2p-orange-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
    >
      {loading ? "Creating account…" : children}
    </button>
  );
}

function BackBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-center mt-2.5 text-xs text-p2p-muted hover:text-p2p-text transition-colors duration-200 bg-transparent border-0 cursor-pointer"
    >
      {children}
    </button>
  );
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-1 mb-7">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-0.5 flex-1 transition-colors duration-300"
          style={{ background: i < current ? "#FF6432" : "rgba(238,242,246,0.14)" }}
        />
      ))}
    </div>
  );
}

function ModalShell({ id, open, onClose, children }: {
  id: string; open: boolean; onClose: () => void; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      id={id}
      onClick={e => { if ((e.target as HTMLElement).id === id) onClose(); }}
      className="fixed inset-0 bg-[#0C1A27]/92 z-[200] flex items-center justify-center backdrop-blur-lg"
    >
      <div className="bg-p2p-surface2 border border-white/15 p-12 w-full max-w-[480px] relative mx-4 animate-[mcUp_0.3s_ease_forwards]">
        <button
          onClick={onClose}
          className="absolute top-4 right-5 bg-transparent border-0 text-p2p-muted hover:text-p2p-text text-xl cursor-pointer"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function ModalEye({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-p2p-orange mb-3 flex items-center gap-2">
      <span className="inline-block w-4 h-px bg-p2p-orange" />
      {children}
    </div>
  );
}

function ModalH({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-heading text-[2rem] font-extrabold uppercase tracking-wide mb-7 leading-none text-p2p-text">
      {children}
    </h3>
  );
}

function FormFieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-p2p-muted mb-2.5 block">
      {children}
    </label>
  );
}

function FormInput({
  type = "text", placeholder, value, onChange, id,
}: {
  type?: string; placeholder: string; value: string; onChange: (v: string) => void; id?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-p2p-text/5 border border-white/15 focus:border-p2p-orange px-4 py-3 text-p2p-text text-sm mb-4 outline-none transition-colors duration-200 box-border placeholder:text-p2p-muted/60"
    />
  );
}

function SuccessState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="text-center py-5">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="font-heading text-[2rem] font-extrabold uppercase text-p2p-orange mb-2">{title}</div>
      <p className="text-sm text-p2p-muted leading-relaxed">{sub}</p>
    </div>
  );
}

// ── Modals ────────────────────────────────────────────────────────────────

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

  const reset = useCallback(() => {
    setStep(1); setSport(""); setGoal(""); setFirstName(""); setLastName("");
    setEmail(""); setPassword(""); setLoading(false); setError("");
  }, []);

  const handleClose = () => { reset(); onClose(); };

  const eyeText = ["Step 1 of 4", "Step 2 of 4", "Step 3 of 4", "✓ Complete"];
  const titleText = ["What sport do\nyou play?", "What is your\nmain goal?", "Create your\naccount", ""];
  const formValid = email.includes("@") && password.length >= 8 && firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleCreate = async () => {
    setLoading(true); setError("");
    try {
      await registerUser({ email, password, role: "athlete", firstName, lastName, sport, name: `${firstName} ${lastName}` });
      setStep(4);
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
          <div className="grid grid-cols-2 gap-2 mb-5">
            {sports.map(s => (
              <CardOpt key={s.label} icon={s.icon} label={s.label} selected={sport === s.label} onClick={() => setSport(s.label)} />
            ))}
          </div>
          <FormBtn disabled={!sport} onClick={() => setStep(2)}>Continue →</FormBtn>
        </>
      )}

      {step === 2 && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {goals.map(g => (
              <div key={g.label} className={g.span ? "col-span-2" : ""}>
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
          <FormFieldLabel>First name</FormFieldLabel>
          <FormInput placeholder="e.g. Jessica" value={firstName} onChange={setFirstName} />
          <FormFieldLabel>Last name</FormFieldLabel>
          <FormInput placeholder="e.g. Morris" value={lastName} onChange={setLastName} />
          <FormFieldLabel>Email address</FormFieldLabel>
          <FormInput type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
          <FormFieldLabel>Password</FormFieldLabel>
          <FormInput type="password" placeholder="Min. 8 characters" value={password} onChange={setPassword} />
          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
          <FormBtn disabled={!formValid} loading={loading} onClick={handleCreate}>Create my account →</FormBtn>
          <BackBtn onClick={() => setStep(2)}>← Back</BackBtn>
        </>
      )}

      {step === 4 && (
        <SuccessState
          icon="✅"
          title="You're in!"
          sub="Your athlete account is created. Your sport-specific program is being built — check your email to access your dashboard."
        />
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
          <div className="grid grid-cols-2 gap-2 mb-5">
            {sports.map(s => (
              <CardOpt key={s.label} icon={s.icon} label={s.label} selected={sport === s.label} onClick={() => setSport(s.label)} />
            ))}
          </div>
          <FormBtn disabled={!sport} onClick={() => setStep(2)}>Continue →</FormBtn>
        </>
      )}

      {step === 2 && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {scales.map(s => (
              <CardOpt key={s.label} icon={s.icon} label={s.label} selected={scale === s.label} onClick={() => setScale(s.label)} />
            ))}
          </div>
          <FormBtn disabled={!scale} onClick={() => setStep(3)}>Continue →</FormBtn>
          <BackBtn onClick={() => setStep(1)}>← Back</BackBtn>
        </>
      )}

      {step === 3 && (
        <>
          <FormFieldLabel>Full name</FormFieldLabel>
          <FormInput placeholder="e.g. Tom Kennedy" value={name} onChange={setName} />
          <FormFieldLabel>Email address</FormFieldLabel>
          <FormInput type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
          <FormFieldLabel>Password</FormFieldLabel>
          <FormInput type="password" placeholder="Min. 8 characters" value={password} onChange={setPassword} />
          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
          <FormBtn disabled={!formValid} loading={loading} onClick={handleCreate}>Get early access →</FormBtn>
          <BackBtn onClick={() => setStep(2)}>← Back</BackBtn>
        </>
      )}

      {step === 4 && (
        <SuccessState
          icon="🎯"
          title="Access granted!"
          sub="Your coach account is ready. Check your email — your dashboard link and first program builder walkthrough are waiting."
        />
      )}
    </ModalShell>
  );
}

function OrgModal({ open, onClose, onSuccess }: {
  open: boolean; onClose: () => void; onSuccess: () => void;
}) {
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
      <div className="flex gap-1 mb-7">
        <div className="h-0.5 flex-1 bg-p2p-orange" />
      </div>
      <FormFieldLabel>Organisation name</FormFieldLabel>
      <FormInput placeholder="e.g. Netball Australia" value={orgName} onChange={setOrgName} />
      <FormFieldLabel>Your name &amp; role</FormFieldLabel>
      <FormInput placeholder="e.g. Jane Smith, Participation Manager" value={contactName} onChange={setContactName} />
      <FormFieldLabel>Email address</FormFieldLabel>
      <FormInput type="email" placeholder="you@organisation.com.au" value={email} onChange={setEmail} />
      <FormFieldLabel>What are you looking to achieve?</FormFieldLabel>
      <FormInput placeholder="e.g. Give our 10,000 registered athletes access" value={goal} onChange={setGoal} />
      <FormBtn onClick={() => { reset(); onSuccess(); }}>Send enquiry →</FormBtn>
    </ModalShell>
  );
}

function OrgSuccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ModalShell id="modal-org-success" open={open} onClose={onClose}>
      <SuccessState
        icon="🤝"
        title="Enquiry sent!"
        sub="Thanks for reaching out. We'll be in touch within 48 hours to discuss how Motion Code can work for your organisation."
      />
    </ModalShell>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

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
    <div className="bg-p2p-navy text-p2p-text font-sans overflow-x-hidden">
      <style>{`
        @keyframes mcUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .mc-anim { animation: mcUp 0.7s ease forwards; opacity:0; }
        .mc-d1 { animation-delay:0.08s; }
        .mc-d2 { animation-delay:0.2s; }
        .mc-d3 { animation-delay:0.34s; }
        .mc-d4 { animation-delay:0.48s; }
        .mc-d5 { animation-delay:0.62s; }
        .mc-d6 { animation-delay:0.76s; }
      `}</style>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-[100] flex items-center justify-between px-5 sm:px-10 py-[18px] bg-[#0C1A27]/95 backdrop-blur-2xl border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5 font-heading text-[1.4rem] font-extrabold tracking-[0.06em] uppercase">
          <div className="w-6 h-6 bg-p2p-orange flex items-center justify-center text-[0.7rem] font-extrabold text-p2p-dark"
            style={{ clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)" }}>
            MC
          </div>
          Motion Code
        </div>
        <div className="hidden md:flex items-center gap-7">
          <button onClick={() => scrollTo("how")} className="bg-transparent border-0 text-p2p-muted hover:text-p2p-text text-sm font-medium cursor-pointer transition-colors duration-200">How it works</button>
          <button onClick={() => scrollTo("audience")} className="bg-transparent border-0 text-p2p-muted hover:text-p2p-text text-sm font-medium cursor-pointer transition-colors duration-200">For Athletes</button>
          <button onClick={() => scrollTo("audience")} className="bg-transparent border-0 text-p2p-muted hover:text-p2p-text text-sm font-medium cursor-pointer transition-colors duration-200">For Coaches</button>
          <button onClick={() => openModal("org")} className="bg-transparent border-0 text-p2p-muted hover:text-p2p-text text-sm font-medium cursor-pointer transition-colors duration-200">Organisations</button>
          <Link href="/login"><NavCta>Log in</NavCta></Link>
        </div>
        <div className="flex md:hidden items-center gap-3">
          <Link href="/login"><NavCta>Log in</NavCta></Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="min-h-screen flex flex-col justify-center relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 55% 60% at 75% 15%,rgba(255,100,50,0.08) 0%,transparent 65%),radial-gradient(ellipse 50% 50% at 15% 85%,rgba(255,100,50,0.04) 0%,transparent 60%)" }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(255,100,50,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,100,50,0.025) 1px,transparent 1px)", backgroundSize: "72px 72px" }} />

        <div className="mc-anim mc-d1 relative z-[5] px-5 sm:px-10 pt-[60px] pb-10 max-w-[900px]">
          <div className="mc-anim mc-d1 inline-flex items-center gap-2.5 font-mono text-[0.68rem] tracking-[0.25em] uppercase text-p2p-orange mb-6">
            <span className="inline-block w-6 h-px bg-p2p-orange" />
            Strength &amp; Movement for Sport
          </div>

          <h1 className="mc-anim mc-d2 font-heading font-extrabold leading-[0.88] tracking-tight uppercase mb-6"
            style={{ fontSize: "clamp(4rem,11vw,9rem)" }}>
            Run Faster.<br />
            <span className="text-p2p-orange">Play Longer.</span>
          </h1>

          <p className="mc-anim mc-d3 font-light leading-[1.65] text-p2p-text/65 max-w-[500px] mb-10"
            style={{ fontSize: "clamp(0.95rem,1.7vw,1.15rem)" }}>
            The strength and movement platform for athletes who want to perform — and the coaches who develop them.
          </p>

          <div className="mc-anim mc-d4 flex gap-3 flex-wrap items-center">
            <Btn primary onClick={() => openModal("athlete")}>I'm an Athlete <span>→</span></Btn>
            <Btn onClick={() => openModal("coach")}>I'm a Coach <span>→</span></Btn>
          </div>

          <p className="mc-anim mc-d5 mt-3.5 text-[0.76rem] text-p2p-muted">
            Are you a sporting organisation or NSO?{" "}
            <button
              onClick={() => openModal("org")}
              className="bg-transparent border-0 text-p2p-muted underline underline-offset-[3px] text-[0.76rem] cursor-pointer font-sans hover:text-p2p-text transition-colors duration-200"
            >
              Get in touch →
            </button>
          </p>
        </div>

        {/* Stats bar */}
        <div className="mc-anim mc-d6 relative z-[5] grid grid-cols-2 sm:grid-cols-4 border-t border-white/[0.08] mx-5 sm:mx-10 mt-11">
          {[
            { n: "6", l: "Sports covered" },
            { n: "40+", l: "Prescribed exercises" },
            { n: "3", l: "Training phases" },
            { n: "AUS", l: "Built for Australian sport" },
          ].map((s, i) => (
            <div
              key={i}
              className={`py-6 pl-7 ${i < 3 ? "border-r border-white/[0.08]" : ""} ${i === 0 ? "pl-0" : ""}`}
            >
              <div className="font-heading text-[2.2rem] font-extrabold text-p2p-orange tracking-wide leading-none mb-1">{s.n}</div>
              <div className="text-[0.68rem] text-p2p-muted tracking-[0.06em] uppercase font-medium">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="px-5 sm:px-10 py-20">
        <div className="font-mono text-[0.65rem] tracking-[0.25em] uppercase text-p2p-orange flex items-center gap-2.5 mb-4">
          <span className="inline-block w-5 h-px bg-p2p-orange" />
          How it works
        </div>
        <h2 className="font-heading font-extrabold uppercase tracking-wide leading-none mb-12"
          style={{ fontSize: "clamp(2.2rem,4.5vw,3.6rem)" }}>
          Simple. Specific.<br />Effective.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0.5">
          {[
            { n: "01", title: "Know Your Movement", desc: "Tell us your sport, your position, and your goals. Motion Code builds your profile and understands the physical demands you face every game." },
            { n: "02", title: "Get Your Program", desc: "Receive strength and power exercises built for exactly how you run and play. No generic gym plans. Every exercise has a reason." },
            { n: "03", title: "Track What Changes", desc: "See your consistency, watch your progress, and perform when it counts. Your coach can follow along and adjust as the season evolves." },
          ].map((step) => (
            <div
              key={step.n}
              className="bg-p2p-surface2 hover:bg-p2p-navy border border-white/[0.08] px-8 py-9 relative overflow-hidden transition-colors duration-300"
            >
              <div className="absolute bottom-[-20px] right-2.5 font-heading text-[7rem] font-extrabold text-p2p-orange/[0.04] leading-none pointer-events-none">{step.n}</div>
              <div className="font-heading text-[0.68rem] font-bold tracking-[0.2em] uppercase text-p2p-orange mb-4 flex items-center gap-2">
                {`Step ${step.n}`}
                <span className="flex-1 h-px bg-p2p-orange/20 inline-block" />
              </div>
              <h3 className="font-heading text-[1.55rem] font-bold uppercase tracking-wide mb-2.5 text-p2p-text">{step.title}</h3>
              <p className="text-[0.86rem] text-p2p-text/55 leading-[1.7]">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AUDIENCE ── */}
      <div id="audience" className="px-5 sm:px-10 pb-20 grid grid-cols-1 sm:grid-cols-2 gap-0.5">
        {/* Athlete card */}
        <div className="bg-p2p-orange px-11 py-12 relative overflow-hidden">
          <div className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-p2p-dark/60 mb-4">For Athletes</div>
          <h3 className="font-heading font-extrabold uppercase tracking-wide leading-[0.92] mb-6 text-p2p-dark"
            style={{ fontSize: "clamp(1.9rem,3.5vw,3rem)" }}>
            Your program.<br />Your sport.<br />Your edge.
          </h3>
          <ul className="list-none p-0 flex flex-col gap-3 mb-9">
            {[
              "Strength programs built for your sport and position — not generic gym work",
              "Understand exactly what to do and why it makes you faster and more resilient",
              "Track your consistency week to week and see real improvement",
            ].map((item, i) => (
              <li key={i} className="text-sm leading-relaxed flex items-start gap-2.5 text-p2p-dark/75">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-p2p-dark/12 flex items-center justify-center text-[0.58rem] text-p2p-dark mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={() => openModal("athlete")}
            className="bg-p2p-dark text-p2p-orange border-0 px-7 py-3.5 text-sm font-bold cursor-pointer inline-flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5"
          >
            Start free →
          </button>
        </div>

        {/* Coach card */}
        <div className="bg-p2p-surface2 border border-white/[0.08] px-11 py-12 relative overflow-hidden">
          <div className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-p2p-muted mb-4">For Coaches</div>
          <h3 className="font-heading font-extrabold uppercase tracking-wide leading-[0.92] mb-6 text-p2p-text"
            style={{ fontSize: "clamp(1.9rem,3.5vw,3rem)" }}>
            Prescribe better.<br />In less time.
          </h3>
          <ul className="list-none p-0 flex flex-col gap-3 mb-9">
            {[
              "Build evidence-based programs in minutes, not hours",
              "Monitor every athlete's compliance and progress in one place",
              "Build a library of templates and reuse them across your entire roster",
            ].map((item, i) => (
              <li key={i} className="text-sm leading-relaxed flex items-start gap-2.5 text-p2p-text/65">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-p2p-orange/15 flex items-center justify-center text-[0.58rem] text-p2p-orange mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={() => openModal("coach")}
            className="bg-p2p-orange hover:bg-p2p-orange-hover text-p2p-dark border-0 px-7 py-3.5 text-sm font-bold cursor-pointer inline-flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5"
          >
            Get early access →
          </button>
        </div>
      </div>

      {/* ── PROOF ── */}
      <div className="px-5 sm:px-10 pb-20">
        <div className="font-mono text-[0.65rem] tracking-[0.25em] uppercase text-p2p-orange flex items-center gap-2.5 mb-6">
          <span className="inline-block w-5 h-px bg-p2p-orange" />
          What coaches say
        </div>
        <div className="grid gap-0.5 grid-cols-1 sm:grid-cols-[2fr_1fr]">
          <div className="bg-p2p-surface2 border border-white/[0.08] px-[52px] py-12 flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="font-heading text-[4.5rem] font-extrabold text-p2p-orange leading-[0.8] mb-2.5 opacity-50">"</div>
              <p className="font-light leading-[1.6] text-p2p-text mb-6"
                style={{ fontSize: "clamp(0.95rem,1.8vw,1.25rem)" }}>
                Finally a tool that understands sport-specific demands. My athletes know{" "}
                <em className="not-italic text-p2p-orange">why</em> they're doing every exercise — and that changes how hard they work.
              </p>
            </div>
            <div className="text-[0.72rem] text-p2p-muted tracking-[0.07em] uppercase font-medium">
              S&amp;C Coach — Australian Football
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            {[
              { n: "3 min", l: "Average time to build a full athlete program" },
              { n: "↑ 87%", l: "Of early users completed their program in week one" },
            ].map((s, i) => (
              <div key={i} className="bg-p2p-surface2 border border-white/[0.08] px-8 py-7 flex-1 flex flex-col justify-center">
                <div className="font-heading text-[2.8rem] font-extrabold text-p2p-orange leading-none mb-1">{s.n}</div>
                <div className="text-[0.76rem] text-p2p-muted leading-[1.45]">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CREDIBILITY ── */}
      <div className="border-t border-b border-white/[0.08] mx-5 sm:mx-10 py-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-9">
        <p className="flex-1 text-[0.84rem] text-p2p-muted leading-[1.7]">
          Motion Code is built on the methodology behind{" "}
          <a href="https://preparedtoplay.replit.app" target="_blank" rel="noreferrer" className="text-p2p-orange no-underline font-medium hover:underline">
            Prepared to Play
          </a>
          {" "}— developed through applied speed development work with athletes across Australian sport.
        </p>
        <div className="flex-shrink-0 font-mono text-[0.62rem] tracking-[0.12em] text-p2p-muted border border-white/15 px-4 py-2.5 uppercase whitespace-nowrap">
          A Prepared to Play Platform
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <section className="px-5 sm:px-10 py-[90px] text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 100%,rgba(255,100,50,0.07) 0%,transparent 65%)" }} />
        <h2 className="relative font-heading font-extrabold uppercase tracking-wide leading-[0.9] mb-4"
          style={{ fontSize: "clamp(2.8rem,6.5vw,6rem)" }}>
          Ready to<br /><span className="text-p2p-orange">Move Better?</span>
        </h2>
        <p className="relative text-[0.95rem] text-p2p-muted mb-9">
          Join athletes and coaches building performance that lasts.
        </p>
        <div className="relative flex gap-3 justify-center flex-wrap">
          <Btn primary onClick={() => openModal("athlete")}>I'm an Athlete — Start Free <span>→</span></Btn>
          <Btn onClick={() => openModal("coach")}>I'm a Coach — Get Early Access <span>→</span></Btn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.08] px-5 sm:px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <span className="font-heading text-[0.9rem] font-bold tracking-[0.1em] uppercase text-p2p-muted">
          Motion Code · A Prepared to Play Platform
        </span>
        <div className="flex gap-6">
          {["Privacy Policy", "Terms of Service", "Contact", "For Organisations"].map(link => (
            <a key={link} href="#" className="text-[0.7rem] text-p2p-muted hover:text-p2p-text no-underline tracking-[0.04em] transition-colors duration-200">
              {link}
            </a>
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
