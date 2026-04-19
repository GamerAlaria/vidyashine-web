import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useParams, Navigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Terminal, X, Calendar, Menu, Mail, Copy, ExternalLink, Check } from 'lucide-react';
import blogData from './data/blogData';
import './index.css';

/** True when the Web3Forms key is properly configured */
const IS_BOOKING_ENABLED = !!(import.meta.env.VITE_WEB3FORMS_ACCESS_KEY
  && import.meta.env.VITE_WEB3FORMS_ACCESS_KEY !== 'YOUR_WEB3FORMS_ACCESS_KEY_HERE'
  && import.meta.env.VITE_WEB3FORMS_ACCESS_KEY.trim() !== '');

gsap.registerPlugin(ScrollTrigger);

// --- COMPONENTS ---

const BookingModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedDate(null);
    }
  }, [isOpen]);

  /** Rate-limit: track last successful submission time */
  const lastSubmitRef = useRef(0);
  const COOLDOWN_MS = 60_000; // 60-second cooldown between submissions

  if (!isOpen) return null;

  const handleBook = async (e) => {
    e.preventDefault();

    // --- Rate-limit guard ---
    const now = Date.now();
    if (now - lastSubmitRef.current < COOLDOWN_MS) {
      const secsLeft = Math.ceil((COOLDOWN_MS - (now - lastSubmitRef.current)) / 1000);
      alert(`Please wait ${secsLeft}s before submitting again.`);
      return;
    }

    // --- Validate email format ---
    const emailValue = e.target.elements.email.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      alert('Please enter a valid email address.');
      return;
    }

    // --- Guard: booking system must be configured ---
    if (!IS_BOOKING_ENABLED) {
      alert("Booking is temporarily unavailable. Please try again later.");
      return;
    }

    setIsSubmitting(true);

    // Build dynamic date string from selection
    const now2 = new Date();
    const selectedFullDate = new Date(now2.getFullYear(), now2.getMonth(), selectedDate);
    const dateStr = selectedFullDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    const formData = {
      access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY,
      botcheck: e.target.elements.botcheck?.checked || false,
      subject: "New Free Trial Booking - Vidyashine Academy",
      name: e.target.elements.name.value,
      email: emailValue,
      date_selected: dateStr,
      message: `A new student has requested a free trial! \nName: ${e.target.elements.name.value}\nEmail: ${emailValue}\nRequested Date: ${dateStr}`
    };

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.success) {
        lastSubmitRef.current = Date.now();
        setStep(2);
      } else {
        alert("Failed to send booking. Please try again later.");
      }
    } catch (_) {
      alert("A network error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white border border-primary/10 rounded-[2rem] w-full max-w-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_20px_50px_rgba(10,22,40,0.15)]">
        <button onClick={onClose} className="absolute top-4 right-4 md:right-4 z-10 text-primary/60 hover:text-primary transition-colors">
          <X className="w-6 h-6" />
        </button>
        {step === 1 ? (
          <>
            <div className="p-8 md:p-12 md:w-1/2 border-b md:border-b-0 md:border-r border-primary/10">
              <h3 className="font-heading font-bold text-2xl mb-2 text-primary">Select a Date</h3>
              <p className="font-data text-sm text-primary/60 mb-8">Schedule your free trial.</p>
              <div className="grid grid-cols-7 gap-2 text-center font-data text-sm mb-4">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-primary/40">{d}</div>)}
                {(() => {
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = today.getMonth();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const todayDate = today.getDate();
                  return Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isPast = day < todayDate;
                    const isSelected = selectedDate === day;
                    return (
                      <button
                        key={day}
                        disabled={isPast}
                        type="button"
                        onClick={() => setSelectedDate(day)}
                        className={`p-2 rounded-[0.4rem] transition-colors ${isPast ? 'opacity-20 cursor-not-allowed text-primary/40' : isSelected ? 'bg-accent text-white font-bold' : 'text-primary hover:bg-primary/10'}`}
                      >
                        {day}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
            <form onSubmit={handleBook} className="relative p-8 md:p-12 md:w-1/2 flex flex-col justify-center bg-[#F0F4FF]">
              {isSubmitting && (
                <div className="absolute inset-0 z-10 bg-[#F0F4FF]/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <h3 className="font-heading font-bold text-2xl mb-6 text-primary">Your Details</h3>
              <input name="name" required type="text" placeholder="Full Name" className="bg-white border border-primary/20 rounded-lg px-4 py-3 mb-4 font-data text-sm text-primary placeholder:text-primary/30 focus:outline-none focus:border-accent" disabled={isSubmitting} />
              <input name="email" required type="email" placeholder="Email Address" className="bg-white border border-primary/20 rounded-lg px-4 py-3 mb-8 font-data text-sm text-primary placeholder:text-primary/30 focus:outline-none focus:border-accent" disabled={isSubmitting} />
              <input type="hidden" name="support_email" value={import.meta.env.VITE_SUPPORT_EMAIL} />
              <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} />
              <button disabled={!selectedDate || isSubmitting} type="submit" className="magnetic-button bg-accent text-white px-8 py-4 rounded-full font-heading font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed">
                <span>{isSubmitting ? 'Confirming...' : 'Confirm Booking'}</span>
              </button>
            </form>
          </>
        ) : (
          <div className="p-16 text-center flex flex-col items-center w-full justify-center">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="font-heading font-bold text-3xl mb-4 text-primary">Booking Confirmed</h3>
            <p className="font-data text-primary/60 max-w-md text-sm leading-relaxed mb-8">
              Your trial session has been scheduled. An email notification has been securely routed to our managing staff successfully. We will be in touch shortly.
            </p>
            <button onClick={onClose} className="px-6 py-3 border border-primary/20 rounded-full font-data text-sm hover:bg-primary/10 transition-colors text-primary uppercase tracking-widest font-bold">Close panel</button>
          </div>
        )}
      </div>
    </div>
  );
};

const CancellationModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // --- Mobile / Tablet detection ---
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|Tablet/i.test(navigator.userAgent);

  // --- Properly URI-encoded URLs ---
  const mailtoUrl = `mailto:${CANCEL_EMAIL}?subject=${CANCEL_SUBJECT_ENC}&body=${CANCEL_BODY_ENC}`;
  const gmailDeep = `googlegmail:///co?to=${CANCEL_EMAIL}&subject=${CANCEL_SUBJECT_ENC}&body=${CANCEL_BODY_ENC}`;
  const outlookDeep = `ms-outlook://compose?to=${CANCEL_EMAIL}&subject=${CANCEL_SUBJECT_ENC}&body=${CANCEL_BODY_ENC}`;
  const gmailWeb = `https://mail.google.com/mail/?view=cm&fs=1&to=${CANCEL_EMAIL}&su=${CANCEL_SUBJECT_ENC}&body=${CANCEL_BODY_ENC}`;
  const outlookWeb = `https://outlook.office.com/mail/deeplink/compose?to=${CANCEL_EMAIL}&subject=${CANCEL_SUBJECT_ENC}&body=${CANCEL_BODY_ENC}`;

  // --- Clipboard ---
  const handleCopy = () => {
    navigator.clipboard.writeText(CANCEL_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Deep-link with fallback ---
  // Try the native app scheme; if the page doesn't lose focus within 2.5 s
  // the app is not installed → fall back to mailto:
  const handleDeepLink = (deepUrl) => {
    let didBlur = false;
    const onBlur = () => { didBlur = true; };
    window.addEventListener('blur', onBlur, { once: true });

    const timer = setTimeout(() => {
      window.removeEventListener('blur', onBlur);
      if (!didBlur) {
        window.location.href = mailtoUrl;   // fallback
      }
    }, 2500);

    // If the app opened, clear the timer
    const onFocus = () => { clearTimeout(timer); window.removeEventListener('blur', onBlur); };
    window.addEventListener('focus', onFocus, { once: true });

    window.location.href = deepUrl;
  };

  // ======== MOBILE / TABLET — bottom-sheet ========
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* backdrop */}
        <div className="absolute inset-0 bg-primary/30 backdrop-blur-sm" onClick={onClose}></div>

        {/* bottom-sheet */}
        <div
          className="relative w-full bg-white border-t border-primary/10 rounded-t-[2rem] overflow-hidden shadow-[0_-10px_40px_rgba(10,22,40,0.15)]"
          style={{ animation: 'slideUp .3s ease-out' }}
        >
          {/* drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-primary/20"></div>
          </div>

          <div className="px-6 pb-8 pt-4">
            {/* header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-primary">Cancel Booking</h3>
                <p className="font-data text-xs text-primary/50">Choose how to send your cancellation</p>
              </div>
            </div>

            {/* email display + copy */}
            <div className="bg-[#F0F4FF] border border-primary/10 rounded-2xl p-3 flex items-center justify-between mb-5">
              <span className="font-data text-sm text-primary/80 truncate mr-3">{CANCEL_EMAIL}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 bg-primary/5 hover:bg-primary/10 text-primary/80 px-3 py-1.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest border border-primary/10 shrink-0"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* action buttons */}
            <div className="space-y-3">
              {/* Gmail */}
              <button
                onClick={() => handleDeepLink(gmailDeep)}
                className="w-full flex items-center gap-4 bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-primary/5 p-4 rounded-2xl transition-all text-left"
              >
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-heading font-bold text-sm text-primary block">Open in Gmail</span>
                  <span className="font-data text-xs text-primary/40">Opens the Gmail app</span>
                </div>
                <ArrowRight className="w-4 h-4 text-primary/30 shrink-0" />
              </button>

              {/* Outlook */}
              <button
                onClick={() => handleDeepLink(outlookDeep)}
                className="w-full flex items-center gap-4 bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-primary/5 p-4 rounded-2xl transition-all text-left"
              >
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-heading font-bold text-sm text-primary block">Open in Outlook</span>
                  <span className="font-data text-xs text-primary/40">Opens the Outlook app</span>
                </div>
                <ArrowRight className="w-4 h-4 text-primary/30 shrink-0" />
              </button>

              {/* Default mail */}
              <a
                href={mailtoUrl}
                rel="noopener noreferrer"
                className="w-full flex items-center gap-4 bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-primary/5 p-4 rounded-2xl transition-all text-left block"
              >
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center shrink-0">
                  <ExternalLink className="w-5 h-5 text-primary/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-heading font-bold text-sm text-primary block">Default Mail App</span>
                  <span className="font-data text-xs text-primary/40">Opens your device mail client</span>
                </div>
                <ArrowRight className="w-4 h-4 text-primary/30 shrink-0" />
              </a>
            </div>

            {/* back button */}
            <button
              onClick={onClose}
              className="w-full mt-5 py-3 text-center font-data text-sm text-primary/50 hover:text-primary/80 transition-colors uppercase tracking-widest"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* slide-up animation keyframe */}
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // ======== DESKTOP — centered modal (existing style) ========
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white border border-primary/10 rounded-[2rem] w-full max-w-xl overflow-hidden shadow-[0_20px_50px_rgba(10,22,40,0.15)]">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 text-primary/60 hover:text-primary transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="p-10 md:p-12">
          <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mb-8 mx-auto">
            <Mail className="w-8 h-8 text-accent" />
          </div>

          <h3 className="font-heading font-bold text-3xl mb-4 text-primary text-center">Cancel Booking</h3>
          <p className="font-data text-primary/60 text-center mb-10 leading-relaxed">
            Please send an email to our support team to process your cancellation. Choose your preferred method below.
          </p>

          <div className="space-y-4">
            {/* email + copy */}
            <div className="bg-[#F0F4FF] border border-primary/10 rounded-2xl p-4 flex items-center justify-between group">
              <span className="font-data text-sm text-primary/80 truncate mr-4">{CANCEL_EMAIL}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 bg-primary/5 hover:bg-primary/10 text-primary/80 px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest border border-primary/10"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* web links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <a
                href={gmailWeb}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-3 bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-primary/5 p-4 rounded-2xl transition-all group"
              >
                <span className="font-heading font-bold text-sm">Open in Gmail</span>
                <ExternalLink className="w-4 h-4 text-primary/40 group-hover:text-accent transition-colors" />
              </a>
              <a
                href={outlookWeb}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-3 bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-primary/5 p-4 rounded-2xl transition-all group"
              >
                <span className="font-heading font-bold text-sm">Open in Outlook</span>
                <ExternalLink className="w-4 h-4 text-primary/40 group-hover:text-accent transition-colors" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ onOpenModal }) => {
  const navRef = useRef(null);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: 'top -50',
        end: 99999,
        toggleClass: { className: 'nav-scrolled', targets: navRef.current },
        onToggle: self => {
          if (self.isActive && navRef.current) {
            gsap.to(navRef.current, { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: 'rgba(10, 22, 40, 0.1)', color: '#0A1628', duration: 0.3 });
          } else if (navRef.current) {
            gsap.to(navRef.current, { backgroundColor: 'transparent', borderColor: 'transparent', color: '#0A1628', duration: 0.3 });
          }
        }
      });
    }, navRef);
    return () => ctx.revert();
  }, [location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Features', path: '/' },
    { name: 'Curriculum', path: '/curriculum' },
    { name: 'Admissions', path: '/admissions' },
    { name: 'Blog', path: '/blog' },
    { name: 'About Us', path: '/about-us' },
    { name: 'Reach Us', path: '/reach-us' },
    { name: 'Contact', path: '/contact' }
  ];

  return (
    <nav
      ref={navRef}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-40 w-[95%] md:w-[94%] max-w-7xl rounded-[2rem] px-4 md:px-8 py-4 flex flex-col justify-between items-center transition-all duration-300 border border-transparent text-primary backdrop-blur-xl"
    >
      <div className="w-full flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group relative shrink-0">
          <div className="flex items-center gap-2 md:gap-3 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:-translate-y-0.5 animate-float will-change-transform">
            <div className="relative shrink-0 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-transparent overflow-hidden transition-colors -ml-1 md:-ml-2 rounded-full">
              <img
                src="/logo.png"
                alt="Vidyashine Logo"
                className="w-full h-full object-contain relative z-10"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="flex flex-col justify-center">
              <div className="w-full max-w-[90px] md:max-w-[140px] overflow-hidden whitespace-nowrap mask-edges opacity-80 mb-0.5">
                <div className="inline-block animate-marquee will-change-transform text-[0.55rem] md:text-[0.65rem] font-semibold tracking-[0.2em] uppercase relative pr-4">
                  <span className="mr-4">CBSE • NEET • JEE • OLYMPIAD</span>
                  <span>CBSE • NEET • JEE • OLYMPIAD</span>
                </div>
              </div>
              <div className="font-heading font-bold text-lg md:text-xl tracking-tighter uppercase leading-none group-hover:text-black transition-colors">
                Vidyashine
              </div>
            </div>
          </div>
        </Link>
        <div className="hidden lg:flex gap-5 xl:gap-7 text-sm font-medium">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} className={`link-lift hover:text-black ${location.pathname === link.path ? 'text-accent' : ''}`}>{link.name}</Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://play.google.com/store/apps/details?id=co.paige.mhemk&pcampaignid=web_share"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium border border-accent/30 text-accent hover:bg-accent/10 transition-all duration-300"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
            <span>Our App</span>
          </a>
          <button onClick={onOpenModal} className="hidden md:flex magnetic-button bg-accent text-white px-6 py-2 rounded-full text-sm font-medium">
            <span>Start free trial</span>
          </button>
          <button
            className="lg:hidden p-2 text-primary hover:text-accent transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden w-full pt-6 pb-2 mt-2 border-t border-primary/10 flex flex-col gap-4 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-lg font-heading font-bold hover:text-white ${location.pathname === link.path ? 'text-accent' : 'text-primary'}`}
            >
              {link.name}
            </Link>
          ))}
          <a
            href="https://play.google.com/store/apps/details?id=co.paige.mhemk&pcampaignid=web_share"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 border border-accent/30 text-accent px-6 py-3 rounded-full text-sm font-medium max-w-[250px] w-full hover:bg-accent/10 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
            Our App
          </a>
          <button onClick={() => { setMobileMenuOpen(false); onOpenModal(); }} className="bg-accent text-white px-6 py-3 rounded-full text-sm font-medium max-w-[250px] text-center w-full shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            Start free trial
          </button>
        </div>
      )}
    </nav>
  );
};


// Support email for cancellation requests (from env or fallback)
const CANCEL_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || "support@vidyashine.com";
const CANCEL_SUBJECT_RAW = "Cancellation Request - Free Trial";
const CANCEL_BODY_RAW = "Hello Vidyashine Team,\n\nI would like to cancel my free trial for the following account: [Insert Email/Order ID].\n\nThank you.";
const CANCEL_SUBJECT_ENC = encodeURIComponent(CANCEL_SUBJECT_RAW);
const CANCEL_BODY_ENC = encodeURIComponent(CANCEL_BODY_RAW);

const HeroCanvas = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const PARTICLE_COUNT = 50;
    const MAX_DIST = 120;

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    const rand = (min, max) => Math.random() * (max - min) + min;

    const createParticles = () => {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: rand(0, width),
        y: rand(0, height),
        vx: rand(-0.25, 0.25),
        vy: rand(-0.25, 0.25),
        r: rand(1.5, 3),
        opacity: rand(0.5, 0.9),
      }));
    };

    // Aurora blob state
    const blobs = [
      { x: 0.2, y: 0.3, r: 0.35, color: '37,99,235', speed: 0.00012 },
      { x: 0.75, y: 0.6, r: 0.3, color: '59,130,246', speed: 0.00009 },
      { x: 0.5, y: 0.8, r: 0.28, color: '96,165,250', speed: 0.00015 },
    ];
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      t += 1;

      // Aurora blobs
      blobs.forEach((b, i) => {
        const bx = (b.x + Math.sin(t * b.speed + i * 2.1) * 0.15) * width;
        const by = (b.y + Math.cos(t * b.speed + i * 1.7) * 0.12) * height;
        const br = b.r * Math.min(width, height);
        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        grad.addColorStop(0, `rgba(${b.color},0.25)`);
        grad.addColorStop(1, `rgba(${b.color},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      });

      // Mouse influence
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      particles.forEach(p => {
        // Drift
        p.x += p.vx;
        p.y += p.vy;

        // Mouse repulsion / attraction (very subtle)
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180 && dist > 0) {
          p.x -= (dx / dist) * 0.3;
          p.y -= (dy / dist) * 0.3;
        }

        // Wrap
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(10,22,40,${Math.min(p.opacity * 1.5, 1)})`;
        ctx.fill();
      });

      // Draw lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            if (!particles[i].lines) particles[i].lines = 0;
            if (particles[i].lines >= 3) continue;
            particles[i].lines++;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(10,22,40,${0.3 * (1 - d / MAX_DIST)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Reset line counts
      particles.forEach(p => p.lines = 0);

      /* Stop the loop if canvas is off-screen — saves CPU/GPU */
      if (!isVisibleRef.current) {
        rafRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    /* Pause animation when canvas is scrolled off-screen */
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && !rafRef.current) {
          draw();
        }
      },
      { threshold: 0 }
    );

    resize();
    createParticles();
    observer.observe(canvas);
    draw();

    const ro = new ResizeObserver(() => { resize(); });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      observer.disconnect();
      ro.disconnect();
    };
  }, []);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 2 }}
    />
  );
};

const Hero = ({ onOpenModal, onOpenCancelModal }) => {
  const heroRef = useRef(null);

  /* Academic pathway data — each milestone on the vertical trace */
  const milestones = [
    { cls: 'VI', label: 'Class VI', detail: 'Where curiosity ignites. NCERT-aligned foundations in Science & Math that turn abstract concepts into tangible understanding.' },
    { cls: 'VII', label: 'Class VII', detail: 'Sharpening the analytical mind. Scientific reasoning meets algebraic intuition through structured problem-solving frameworks.' },
    { cls: 'VIII', label: 'Class VIII', detail: 'The launchpad year. Pre-foundation modules activate competitive instincts while cementing board-level fundamentals.' },
    { cls: 'IX', label: 'Class IX', detail: 'The inflection point. Deep immersion into Physics, Chemistry & Math with battle-tested exam strategies woven in.' },
    { cls: 'X', label: 'Class X', detail: 'Board domination protocol. 200+ chapter-wise assessments, national-level benchmarking, and zero-gap revision cycles.' },
    { cls: 'XI', label: 'Class XI', detail: 'Stream-specific acceleration. Unified Board + JEE/NEET preparation with 300+ precision-crafted concept modules.' },
    { cls: 'XII', label: 'Class XII', detail: 'The summit year. Peak exam performance through 500+ mock tests, mentor-led clinics, and relentless strategic drilling.' },
  ];

  /* Competitive offerings data */
  const competitiveEdge = [
    { tag: 'JEE', desc: 'Engineering gateway decoded' },
    { tag: 'NEET', desc: 'Medical dream accelerator' },
    { tag: 'CUET', desc: 'Premier university passport' },
    { tag: 'NDA', desc: 'Defender\'s forge' },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* Stagger-reveal all hero child elements */
      gsap.from('.hero-reveal', {
        y: 40,
        opacity: 0,
        duration: 1.2,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.2,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative w-full min-h-[100dvh] flex flex-col overflow-hidden">
      {/* Static background image (z:0) — PRESERVED */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=2940&auto=format&fit=crop")', filter: 'grayscale(100%)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      </div>

      {/* Particle canvas animation (z:2) — PRESERVED, UNTOUCHED */}
      <HeroCanvas />

      {/* Gradient overlay for readability (z:3) — PRESERVED */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" style={{ zIndex: 3 }} />

      {/* ===== HERO CONTENT (z:5) — sits "inside" the particle atmosphere ===== */}
      <div className="relative w-full max-w-6xl mx-auto px-4 md:px-16 pt-40 pb-20 md:pt-48 md:pb-24 flex flex-col gap-20" style={{ zIndex: 5 }}>

        {/* ── Zone 1: Header + Brief Info ── */}
        <div className="hero-reveal flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 lg:gap-16">
          {/* Left — Main heading */}
          <div className="flex-1 min-w-0">
            <h1 className="font-drama italic text-primary text-5xl md:text-8xl lg:text-9xl leading-none tracking-tight mb-6">
              Architect Your Future<span className="text-accent">.</span>
            </h1>
            <p className="font-data text-sm md:text-base text-primary/60 tracking-widest uppercase max-w-xl">
              A precision-engineered academic journey from Class VI through XII — fused with elite coaching for India's most demanding competitive exams.
            </p>
          </div>

          {/* Right — Brief coaching info (interactive) */}
          <div className="lg:w-[340px] xl:w-[380px] shrink-0 bg-[#EFF6FF]/80 backdrop-blur-md border border-accent/15 rounded-2xl p-6 md:p-7 shadow-[0_8px_30px_rgba(37,99,235,0.08)] group relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(37,99,235,0.15)] hover:border-accent/30 cursor-default">
            {/* Shimmer sweep on hover */}
            <div className="absolute inset-0 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[1.5s] ease-in-out bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none z-10" />
            {/* Top accent glow */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-500" />

            <div className="relative z-20">
              <h3 className="font-heading font-bold text-xs tracking-[0.2em] uppercase text-accent mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Who We Are
              </h3>
              <p className="font-heading text-[15px] md:text-base text-primary font-medium leading-relaxed mb-5 transition-colors duration-300">
                Vidyashine Academy offers expert coaching for <span className="font-bold text-primary">Classes VI – XII</span> with CBSE-aligned curriculum and structured test series.
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {['JEE', 'NEET', 'NDA', 'CUET', 'Olympiad'].map((tag, i) => (
                  <span
                    key={tag}
                    className="font-data text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/20 transition-all duration-300 hover:bg-accent hover:text-white hover:scale-110 hover:shadow-[0_0_12px_rgba(37,99,235,0.3)] cursor-default"
                    style={{ animation: `fadeSlideIn 0.5s ease ${0.6 + i * 0.1}s both` }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="font-data text-xs text-primary/80 leading-relaxed transition-colors duration-300">
                3 campus locations in Noida · Small-batch mentorship · Weekly diagnostic testing · Dedicated doubt-clearing sessions
              </p>
            </div>
          </div>
        </div>

        {/* ── Zone 2: Academic Pathway — Staggered Card Grid ── */}
        <div className="hero-reveal">
          <div className="font-data text-xs text-accent font-bold tracking-widest uppercase mb-8">
            The 7-Year Blueprint
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {milestones.map((m, idx) => {
              /* Alternate card heights for staggered/masonry feel */
              const isLarge = idx === 4 || idx === 6; /* Class X & XII get emphasis */
              const offsetClass = idx % 2 === 1 ? 'md:translate-y-8' : '';
              return (
                <div
                  key={m.cls}
                  className={`glass-panel rounded-2xl p-5 md:p-6 group cursor-default border-2 border-accent/20 hover:border-accent/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(37,99,235,0.1)] ${offsetClass} ${isLarge ? 'row-span-1 md:col-span-1' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-heading font-black text-2xl md:text-3xl text-primary group-hover:text-black transition-colors">
                      {m.cls}
                    </span>
                    <span className="w-3 h-3 rounded-full bg-accent/60 group-hover:bg-accent transition-colors"></span>
                  </div>
                  <h3 className="font-heading font-bold text-sm text-primary/80 mb-2 group-hover:text-black transition-colors">
                    {m.label}
                  </h3>
                  <p className="font-data text-xs text-primary/50 leading-relaxed group-hover:text-primary/70 transition-colors">
                    {m.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Zone 3: Competitive Edge — Floating Typographic Cluster ── */}
        <div className="hero-reveal">
          <div className="font-data text-xs text-accent font-bold tracking-widest uppercase mb-8">
            Beyond The Classroom
          </div>
          <div className="flex flex-wrap gap-6 md:gap-10 items-center">
            {competitiveEdge.map((item, idx) => (
              <div
                key={item.tag}
                className="competitive-float group cursor-default"
                style={{ animationDelay: `${idx * 1.5}s` }}
              >
                <span className="font-heading font-black text-5xl md:text-7xl lg:text-8xl text-accent/40 group-hover:text-accent group-hover:drop-shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all duration-500 select-none">
                  {item.tag}
                </span>
                <p className="font-data text-xs text-primary/50 mt-1 tracking-wider uppercase group-hover:text-primary/80 transition-colors">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Zone 4: CTAs — IDENTICAL PRESERVATION ── */}
        <div className="hero-reveal flex flex-wrap items-center gap-4">
          <button onClick={onOpenModal} className="magnetic-button group bg-accent text-white px-8 py-4 rounded-full font-heading font-bold uppercase tracking-wide flex items-center gap-3 shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]">
            <span>Start free trial</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={onOpenCancelModal}
            className="group px-8 py-4 rounded-full font-heading font-bold uppercase tracking-wide flex items-center gap-3 border border-primary/40 text-primary/80 hover:border-primary hover:text-primary transition-all duration-300 hover:bg-primary/5"
          >
            <span>Cancel Booking</span>
          </button>
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  return (
    <section className="py-32 px-6 md:px-16 w-full flex flex-col items-center justify-center z-10 relative mt-24">
      <div className="mb-28 text-center max-w-2xl">
        <h2 className="font-heading font-bold text-4xl tracking-tight text-primary mb-6">How We Deliver Results</h2>
        <p className="font-data text-primary/60 text-sm">Three pillars of our data-driven academic infrastructure that turn potential into performance.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <DiagnosticShuffler />
        <TelemetryTypewriter />
        <CursorProtocol />
      </div>
    </section>
  );
};

const DiagnosticShuffler = () => {
  const [cards, setCards] = useState([
    { id: 1, label: 'Concept-First Pedagogy', val: 'CORE.01' },
    { id: 2, label: 'Weekly Diagnostic Tests', val: 'CORE.02' },
    { id: 3, label: 'Real-Time Analytics', val: 'CORE.03' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCards(prev => {
        const newCards = [...prev];
        const last = newCards.pop();
        newCards.unshift(last);
        return newCards;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#F0F4FF] border border-primary/15 rounded-[2rem] p-8 shadow-sm flex flex-col h-[400px]">
      <div className="flex justify-between items-start mb-8">
        <h3 className="font-heading font-bold text-xl text-primary">Growth Engine</h3>
        <span className="font-data text-xs text-accent">CORE_STACK</span>
      </div>
      <div className="relative flex-1 flex items-center justify-center">
        {cards.map((card, idx) => (
          <div
            key={card.id}
            className="absolute w-full bg-[#E0E7FF] border border-primary/10 p-6 rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_10px_30px_rgba(10,22,40,0.12)]"
            style={{
              transform: `translateY(${idx * 20}px) scale(${1 - idx * 0.05})`,
              zIndex: 10 - idx,
              opacity: 1 - idx * 0.3
            }}
          >
            <div className="font-data text-xs text-primary/40 mb-2">{card.val}</div>
            <div className="font-heading font-bold text-primary"><span>{card.label}</span></div>
          </div>
        ))}
      </div>
      <p className="text-sm font-data text-primary/60 mt-8">Every metric tracked. Every gap closed.</p>
    </div>
  );
};

const TelemetryTypewriter = () => {
  const [text, setText] = useState('');
  const fullText = "Every student receives a dedicated mentor who architects their learning path. No shortcuts. No generic solutions. Just relentless, personalized academic elevation.\n\n> SYSTEM READY...";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) i = 0;
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#EFF6FF] border border-primary/15 text-primary rounded-[2rem] p-8 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)] flex flex-col h-[400px] relative overflow-hidden">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
          <span className="font-data text-xs tracking-widest text-primary/80">MENTOR INTELLIGENCE</span>
        </div>
        <Terminal className="w-5 h-5 text-primary/40" />
      </div>
      <div className="font-data text-sm leading-relaxed text-primary/70 whitespace-pre-wrap">
        {text}<span className="inline-block w-2 bg-accent h-4 ml-1 animate-pulse" style={{ animationDuration: '0.8s' }}></span>
      </div>
    </div>
  );
};

const CursorProtocol = () => {
  const svgRef = useRef(null);
  const cursorRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

      tl.to(cursorRef.current, { x: 140, y: 80, duration: 1, ease: 'power2.inOut' })
        .to(cursorRef.current, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 })
        .to('.day-cell-target', { backgroundColor: '#2563EB', color: '#fff', duration: 0.2 }, "-=0.2")
        .to(cursorRef.current, { x: 220, y: 180, duration: 1, ease: 'power2.inOut', delay: 0.5 })
        .to(cursorRef.current, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 })
        .to('.save-btn-target', { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 }, "-=0.2")
        .to('.day-cell-target', { backgroundColor: '#E0E7FF', color: '#0A1628', duration: 0.2, delay: 0.5 })
        .to(cursorRef.current, { x: 0, y: 0, duration: 1, ease: 'power2.inOut', opacity: 0 });
    }, svgRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-[#F0F4FF] border border-primary/15 rounded-[2rem] p-8 shadow-sm flex flex-col h-[400px] relative">
      <div className="flex justify-between items-start mb-6">
        <h3 className="font-heading font-bold text-xl text-primary">Precision Planning</h3>
        <span className="font-data text-xs text-accent">OPTIMIZER</span>
      </div>
      <p className="text-sm font-data text-primary/60 mb-8">Structured routines that breed champions.</p>

      <div ref={svgRef} className="relative flex-1 bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="grid grid-cols-7 gap-1 lg:gap-2 mb-8">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className={`flex items-center justify-center font-data text-xs lg:text-sm h-8 rounded-md transition-colors ${i === 3 ? 'day-cell-target bg-[#E0E7FF] text-primary' : 'bg-transparent text-primary/40'}`}>
              {day}
            </div>
          ))}
        </div>
        <div className="absolute bottom-4 right-4">
          <div className="save-btn-target bg-primary text-dark font-data text-xs px-4 py-2 rounded">Save Routine</div>
        </div>

        {/* Animated Custom Cursor */}
        <div ref={cursorRef} className="absolute top-0 left-0 z-10 w-6 h-6">
          <svg viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.42c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z" fill="#1E3A8A" />
            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.42c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z" stroke="#FFFFFF" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const Curriculum = () => {
  const classesData = [
    {
      id: 'xii',
      title: 'Class XII - Board Mastery',
      focus: 'Stream-specific',
      ncert: true,
      features: ['Science/Math Focus', 'JEE/NEET Foundation', 'Advanced CBSE Theory'],
      syllabus: 'Physics (Electrostatics, Optics, Current Electricity, Magnetism); Chemistry (Solutions, Electrochemistry, Kinetics, Advanced Organic/Inorganic); Mathematics (Calculus, Algebra, Probability, Vectors/3D). Rigorous tracking via Pre-Boards.'
    },
    {
      id: 'xi',
      title: 'Class XI - Pre-University',
      focus: 'Stream-specific',
      ncert: true,
      features: ['Science/Math Focus', 'JEE/NEET Foundation', 'Advanced CBSE Theory'],
      syllabus: 'Physics (Kinematics, Thermodynamics, Waves); Chemistry (Atomic Structure, Bonding, Thermodynamics, Equilibrium); Mathematics (Algebra, Coordinate Geometry, Calculus Basics). Focuses on high-order cognitive development.'
    },
    {
      id: 'x',
      title: 'Class X - Secondary Excellence',
      focus: 'Board Exam Mastery',
      ncert: true,
      features: ['Rigorous Testing', 'Comprehensive Science & Math', 'Integrated Social Sciences'],
      syllabus: 'Mathematics (Algebra, Geometry, Trigonometry, Statistics); Science (Chemical Reactions, Life Processes, Light, Electricity); Social Science (History, Democratic Politics, Economics); Language mastery for Board benchmarks.'
    },
    {
      id: 'ix',
      title: 'Class IX - Secondary Prep',
      focus: 'Board Exam Mastery',
      ncert: true,
      features: ['Comprehensive Science & Math', 'Integrated Social Sciences', 'Analytical Writing'],
      syllabus: 'Mathematics (Number Systems, Algebra, Geometry, Mensuration); Science (Matter, Organization in Living World, Motion, Force, Work); Social Science (Contemporary India, Economics); Core foundational literature and grammar.'
    },
    {
      id: 'viii',
      title: 'Class VIII',
      focus: 'Foundation Building',
      ncert: true,
      features: ['NCERT Alignment', 'Olympiad Readiness', 'Pre-Board Prep Start'],
      syllabus: 'Mathematics (Rational Numbers, Linear Equations, Quadrilaterals, Data Handling); Science (Crop Production, Microorganisms, Synthetic Fibres, Forces); Social Science (Resources and Development); Skill-building across linguistics.'
    },
    {
      id: 'vii',
      title: 'Class VII',
      focus: 'Foundation Building',
      ncert: true,
      features: ['NCERT Alignment', 'Olympiad Readiness', 'Analytical Thinking'],
      syllabus: 'Mathematics (Integers, Fractions, Decimals, Data Handling, Equations); Science (Nutrition, Heat, Acids, Respiration); Social Science (Our Environment, Tracing Changes); Introductory structured logical analysis frameworks.'
    },
    {
      id: 'vi',
      title: 'Class VI',
      focus: 'Foundation Building',
      ncert: true,
      features: ['NCERT Alignment', 'Olympiad Readiness', 'Basic Concepts Clarity'],
      syllabus: 'Mathematics (Knowing Numbers, Whole Numbers, Geometry Basics, Integers); Science (Food, Components, Materials, Separation, Habitat); Social Science (The Earth, Early Man). Establishing the very first competitive study protocols.'
    }
  ];

  return (
    <section className="w-full bg-background flex flex-col py-16 md:py-28 px-4 md:px-16 border-t border-primary/5 relative z-10 text-primary overflow-hidden">
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start">
        {/* Left: Static CTA Button */}
        <div className="w-full lg:w-1/3 flex flex-col items-start lg:sticky top-40 z-20 transition-transform duration-700 animate-float will-change-transform">
          <div className="bg-[#EFF6FF] border border-primary/15 rounded-[2rem] p-8 shadow-[0_20px_40px_rgba(10,22,40,0.1)] w-full relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>
            <div className="font-data text-xs text-accent font-bold tracking-widest uppercase mb-3">From Class VI to XII</div>
            <h2 className="font-heading font-bold text-4xl md:text-5xl tracking-tight text-primary mb-6">Our Curriculum</h2>
            <p className="font-data text-primary/60 text-sm leading-relaxed mb-8">
              Syllabus structuring strictly aligned with <span className="text-accent font-bold">CBSE 2025-26</span> guidelines. Our pedagogy guarantees comprehensive coverage and strategic review cycles.
            </p>
            <button className="magnetic-button group bg-accent text-white px-8 py-4 rounded-full font-heading font-bold uppercase tracking-wide flex items-center justify-between w-full shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]">
              <span>Explore Programs</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right: Horizontal Scrolling Cards */}
        <div className="w-full lg:w-2/3 flex overflow-x-auto gap-6 pb-8 pt-4 px-4 -mx-4 snap-x snap-mandatory default-scrollbar" style={{ scrollBehavior: 'smooth' }}>
          {classesData.map((cls, idx) => (
            <div
              key={cls.id}
              className="snap-center shrink-0 w-[280px] md:w-[320px] animate-float-staggered will-change-transform"
              style={{ animationDelay: `${idx * 0.2}s` }}
            >
              <div className="w-full h-full bg-[#F0F4FF] border border-primary/20 hover:border-accent rounded-3xl p-6 transition-all duration-500 hover:scale-[1.05] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)] flex flex-col group relative z-10 hover:z-20">
                {cls.ncert && (
                  <div className="absolute top-4 right-4 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-data flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse block"></span>
                    NCERT Aligned
                  </div>
                )}

                <div className="font-data text-xs text-accent font-bold tracking-widest uppercase mb-4 mt-6 px-3 py-1 bg-accent/10 rounded-full border border-accent/20 inline-block self-start">
                  {cls.focus}
                </div>

                <h3 className="font-heading font-bold text-2xl text-primary mb-6 leading-tight group-hover:text-black transition-colors">
                  {cls.title}
                </h3>

                <ul className="flex-1 space-y-4 mb-6 border-b border-primary/10 pb-6 group-hover:border-primary/20 transition-colors">
                  {cls.features.map((feat, fidx) => (
                    <li key={fidx} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0 group-hover:bg-accent transition-colors"></div>
                      <span className="font-data text-sm text-primary/60 leading-relaxed max-w-[90%]">
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-4 flex flex-col gap-2 border-t border-primary/10 group-hover:border-primary/30 transition-colors">
                  <span className="font-data text-[10px] font-bold uppercase tracking-widest text-accent/80">Core Syllabus</span>
                  <p className="font-data text-xs text-primary/50 leading-relaxed group-hover:text-primary/90 transition-colors">
                    {cls.syllabus}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Free Demo Videos Subsection */}
      <FreeDemoVideos />
    </section>
  );
};

const FreeDemoVideos = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.demo-reveal', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out'
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="w-full max-w-7xl mx-auto mt-28 pt-20 border-t border-primary/5">
      <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-start">
        {/* Left: Info */}
        <div className="w-full lg:w-2/5 flex flex-col items-start">
          <div className="demo-reveal font-data text-xs text-accent font-bold tracking-widest uppercase mb-4">Preview Our Teaching</div>
          <h3 className="demo-reveal font-heading font-bold text-3xl md:text-4xl tracking-tight text-primary mb-6">Free Demo Videos</h3>
          <p className="demo-reveal font-data text-primary/60 text-sm leading-relaxed mb-4">
            Experience our teaching methodology before enrolling. Watch our structured, concept-driven lectures and see why students trust Vidyashine for academic excellence.
          </p>
          <a
            href="https://www.youtube.com/@pibrains"
            target="_blank"
            rel="noreferrer"
            className="demo-reveal font-data text-sm text-accent hover:text-black transition-colors inline-flex items-center gap-2 mb-8 group"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            <span className="border-b border-accent/30 group-hover:border-black/50 transition-colors">youtube.com/@pibrains</span>
          </a>
          <a
            href="https://www.youtube.com/@pibrains"
            target="_blank"
            rel="noreferrer"
            className="demo-reveal magnetic-button group bg-[#FF0000] text-white px-8 py-4 rounded-full font-heading font-bold uppercase tracking-wide flex items-center gap-3 shadow-[0_0_20px_rgba(255,0,0,0.25)] hover:shadow-[0_0_30px_rgba(255,0,0,0.5)] transition-shadow"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            <span>Visit Our Channel</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Right: Video Embed */}
        <div className="demo-reveal w-full lg:w-3/5">
          <div className="relative w-full rounded-[2rem] overflow-hidden border border-primary/10 shadow-[0_20px_50px_rgba(10,22,40,0.1)] bg-[#EFF6FF]" style={{ aspectRatio: '16/9' }}>
            {isVisible ? (
              <iframe
                src="https://www.youtube.com/embed/5LXHJYviHwA?autoplay=1&mute=1&rel=0&modestbranding=1&color=red"
                title="Vidyashine Demo Video"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#EFF6FF]">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-[#FF0000]/20 border border-[#FF0000]/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#FF0000] ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                  <span className="font-data text-sm text-primary/40 tracking-widest uppercase">Loading video...</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

const CompetitiveExams = () => {
  return (
    <section className="w-full bg-[#EFF6FF] py-32 px-6 md:px-16 border-t border-primary/5 relative z-10 text-primary">
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center mb-28">
          <h2 className="font-heading font-bold text-4xl md:text-5xl tracking-tight text-primary mb-8">What Else We Offer</h2>
          <p className="font-data text-primary/60 max-w-3xl mx-auto text-sm leading-relaxed">
            We don't just teach the syllabus; we build competitive resilience. Our rigorous methodology, specialized faculty, and diagnostic testing protocol ensure students are aggressively prepared for the high-pressure environment of national entrance examinations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { tag: "Engineering", title: "JEE", desc: "Joint Entrance Examination", offers: "Advanced problem-solving modules, speed optimization, and rigorous testing on complex Science & Math applications.", quote: "\"Engineering the minds that will engineer the future.\"" },
            { tag: "Medical", title: "NEET", desc: "National Eligibility Entrance Test", offers: "High-retention biological drilling, concept-mapping, and calculation-heavy physics/chemistry strategies.", quote: "\"Precision in preparation for precision in practice.\"" },
            { tag: "Defense", title: "NDA", desc: "National Defence Academy", offers: "Specialized mathematical conditioning, comprehensive general ability coverage, and tactical aptitude training.", quote: "\"Forging discipline into academic dominance.\"" },
            { tag: "University", title: "CUET", desc: "Common University Entrance Test", offers: "Strategic domain-subject mastery, general aptitude benchmarks, and premier university admission counseling.", quote: "\"Your gateway to India's most prestigious campuses.\"" }
          ].map((exam, idx) => (
            <div key={idx} className="bg-[#F0F4FF] border border-primary/15 hover:border-accent/40 rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden flex flex-col items-start shadow-sm hover:shadow-[0_10px_30px_rgba(37,99,235,0.1)] h-full">
              <div className="font-data text-xs text-accent font-bold tracking-widest uppercase mb-4 px-3 py-1 bg-accent/10 rounded-full border border-accent/20">
                {exam.tag}
              </div>
              <h3 className="font-heading font-bold text-4xl text-primary mb-2 tracking-tighter group-hover:scale-105 transition-transform origin-left">{exam.title}</h3>
              <p className="font-heading font-bold text-[10px] text-primary/40 uppercase tracking-widest mb-6 border-b border-primary/5 pb-4 w-full">
                {exam.desc}
              </p>

              <div className="font-data text-[13px] text-primary/60 leading-relaxed mb-8 flex-1">
                <span className="font-bold text-accent/90 block mb-2 uppercase tracking-wider text-[10px]">What We Offer</span>
                {exam.offers}
              </div>

              <div className="mt-auto border-t border-primary/10 pt-5 w-full">
                <span className="font-heading italic text-sm text-accent/80 opacity-80 group-hover:opacity-100 transition-opacity block leading-snug">
                  {exam.quote}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Philosophy = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.manifesto-text', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        },
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out'
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full py-40 px-6 md:px-16 overflow-hidden bg-[#0A1628] text-white min-h-screen flex flex-col items-center justify-center border-y border-primary/5">
      {/* Background Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] bg-cover bg-center mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=2930&auto=format&fit=crop")', filter: 'grayscale(100%)' }}
      ></div>

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col gap-16 text-center items-center">
        <p className="manifesto-text font-heading text-xl md:text-3xl max-w-2xl text-white/50 text-center">
          The ordinary approach settles for: surface-level familiarity and passive absorption.
        </p>
        <h2 className="manifesto-text font-drama italic text-5xl md:text-8xl leading-tight text-white text-center">
          We engineer: <br />
          <span className="text-accent underline decoration-accent/30 underline-offset-8">unshakeable mastery.</span>
        </h2>
      </div>
    </section>
  );
};

const Protocol = () => {
  return (
    <section className="relative w-full bg-background pt-28 pb-32">
      <div className="px-6 md:px-16 w-full max-w-7xl mx-auto mb-24 relative z-10">
        <h2 className="font-heading font-bold text-4xl tracking-tight text-primary">Our Three-Phase Protocol</h2>
      </div>

      <div className="relative w-full max-w-6xl mx-auto z-10 space-y-8">
        {/* Card 1 */}
        <div className="protocol-card min-h-[85vh] w-full bg-[#F0F4FF] border border-primary/15 rounded-[3rem] p-12 md:p-16 flex flex-col md:flex-row gap-12 md:gap-20 items-center shadow-[0_-10px_40px_rgba(10,22,40,0.08)] hover:border-primary/20 transition-all duration-300">
          <div className="flex-1">
            <div className="font-data text-accent font-bold mb-4 tracking-widest text-sm">PHASE.01</div>
            <h3 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl mb-8 text-primary">Diagnose & Map</h3>
            <p className="font-data text-base text-primary/70 leading-relaxed max-w-xl">
              Before a single lesson begins, we run a precision diagnostic that X-rays your academic DNA — pinpointing exact strengths and hidden knowledge fractures. This data-driven blueprint eliminates guesswork and builds a custom launch trajectory.
            </p>
          </div>
          <div className="flex-1 flex justify-center items-center h-full min-h-[400px] relative">
            {/* Scanning Clipboard / Knowledge Map SVG */}
            <svg className="w-full max-w-[320px] drop-shadow-2xl" viewBox="0 0 200 240" fill="none">
              <rect x="30" y="40" width="140" height="180" rx="8" stroke="#1E3A8A" strokeWidth="3" className="opacity-30" />
              <path d="M70 40 V20 H130 V40" stroke="#1E3A8A" strokeWidth="3" fill="#F0F4FF" className="opacity-80" />
              <line x1="60" y1="80" x2="140" y2="80" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" className="opacity-20" />
              <line x1="60" y1="120" x2="120" y2="120" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" className="opacity-20" />
              <line x1="60" y1="160" x2="130" y2="160" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" className="opacity-20" />

              {/* Scanning laser line */}
              <line x1="20" y1="0" x2="180" y2="0" stroke="#2563EB" strokeWidth="4" className="animate-[scan_3s_ease-in-out_infinite]" />
              <style>{`
                 @keyframes scan {
                   0%, 100% { transform: translateY(40px); opacity: 0; }
                   10%, 90% { opacity: 1; }
                   50% { transform: translateY(210px); }
                 }
              `}</style>

              {/* Highlight points revealing as it scans */}
              <circle cx="120" cy="120" r="4" fill="#2563EB" className="animate-[pulse_3s_infinite]" style={{ animationDelay: '1.2s' }} />
              <circle cx="130" cy="160" r="4" fill="#2563EB" className="animate-[pulse_3s_infinite]" style={{ animationDelay: '1.6s' }} />
            </svg>
          </div>
        </div>

        {/* Card 2 */}
        <div className="protocol-card min-h-[85vh] w-full bg-[#EFF6FF] border border-primary/15 rounded-[3rem] p-12 md:p-16 flex flex-col md:flex-row gap-12 md:gap-20 items-center shadow-[0_-20px_40px_rgba(10,22,40,0.08)] hover:border-primary/20 transition-all duration-300">
          <div className="flex-1">
            <div className="font-data text-accent font-bold mb-4 tracking-widest text-sm">PHASE.02</div>
            <h3 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl mb-8 text-primary">Accelerate & Build</h3>
            <p className="font-data text-base text-primary/70 leading-relaxed max-w-xl">
              With the diagnostic map in hand, we deploy surgically targeted learning modules that attack weak points head-on. No wasted hours on what you already know — just high-yield concept bridges, expert mentorship, and reinforcement drills that lock knowledge permanently.
            </p>
          </div>
          <div className="flex-1 flex justify-center items-center h-full min-h-[400px] relative">
            {/* Self-Assembling Blocks / Lightbulb over book SVG */}
            <svg className="w-full max-w-[320px] drop-shadow-2xl" viewBox="0 0 200 200" fill="none">
              {/* Book Base */}
              <path d="M40 150 L100 170 L160 150 L100 130 Z" stroke="#1E3A8A" strokeWidth="3" strokeLinejoin="round" className="opacity-40" />
              <path d="M40 160 L100 180 L160 160" stroke="#1E3A8A" strokeWidth="3" strokeLinejoin="round" className="opacity-20" />

              {/* Lightbulb Bulb */}
              <path d="M100 50 C80 50 65 65 65 85 C65 100 75 110 80 120 V130 H120 V120 C125 110 135 100 135 85 C135 65 120 50 100 50 Z" stroke="#1E3A8A" strokeWidth="3" strokeLinejoin="round" className="opacity-80" />
              <path d="M85 130 V140 H115 V130" stroke="#1E3A8A" strokeWidth="3" strokeLinejoin="round" className="opacity-80" />
              <path d="M95 140 V145 H105 V140" stroke="#1E3A8A" strokeWidth="3" strokeLinejoin="round" className="opacity-80" />

              {/* Filament inside lightbulb */}
              <path d="M90 120 V95 L95 85 L105 95 V120" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" className="animate-pulse" />

              {/* Pulsing Glow Rings */}
              <circle cx="100" cy="85" r="45" stroke="#2563EB" strokeWidth="1" className="animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] opacity-20" />
              <circle cx="100" cy="85" r="60" stroke="#2563EB" strokeWidth="1" className="animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] opacity-10" style={{ animationDelay: '1s' }} />

              {/* Floating sparks */}
              <circle cx="60" cy="60" r="2" fill="#2563EB" className="animate-pulse opacity-60" style={{ animationDuration: '1.5s' }} />
              <circle cx="140" cy="70" r="3" fill="#2563EB" className="animate-pulse opacity-80" style={{ animationDuration: '2.2s' }} />
              <circle cx="70" cy="110" r="2" fill="#2563EB" className="animate-pulse opacity-50" style={{ animationDuration: '1.8s' }} />
            </svg>
          </div>
        </div>

        {/* Card 3 */}
        <div className="protocol-card min-h-[85vh] w-full bg-white text-primary border border-primary/15 rounded-[3rem] p-12 md:p-16 flex flex-col md:flex-row gap-12 md:gap-20 items-center shadow-[0_-20px_40px_rgba(10,22,40,0.1)] hover:border-primary/20 transition-all duration-300">
          <div className="flex-1">
            <div className="font-data text-accent font-bold mb-4 tracking-widest text-sm">PHASE.03</div>
            <h3 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl mb-8 text-primary">Validate & Conquer</h3>
            <p className="font-data text-base text-primary/70 leading-relaxed max-w-xl">
              Progress isn't assumed — it's proven. Through continuous diagnostic checkpoints and live performance dashboards, every ounce of growth is visible and verified. Students don't just feel confident — they see the evidence of their transformation.
            </p>
          </div>
          <div className="flex-1 flex justify-center items-center h-full min-h-[400px] relative">
            {/* Glowing Progress Radar / Compass SVG */}
            <svg className="w-full max-w-[320px] drop-shadow-2xl" viewBox="0 0 200 200" fill="none">
              {/* Radar Grid Circles */}
              <circle cx="100" cy="100" r="80" stroke="#1E3A8A" strokeWidth="2" strokeDasharray="4 4" className="opacity-20" />
              <circle cx="100" cy="100" r="50" stroke="#1E3A8A" strokeWidth="2" strokeDasharray="4 4" className="opacity-10" />
              <circle cx="100" cy="100" r="20" stroke="#1E3A8A" strokeWidth="2" className="opacity-10" />

              {/* Radar Crosshairs */}
              <line x1="20" y1="100" x2="180" y2="100" stroke="#1E3A8A" strokeWidth="1" className="opacity-20" />
              <line x1="100" y1="20" x2="100" y2="180" stroke="#1E3A8A" strokeWidth="1" className="opacity-20" />

              {/* Academic Progress Shape (Polygon) */}
              <polygon points="100,30 150,70 140,140 80,160 40,110" stroke="#2563EB" strokeWidth="3" fill="#2563EB" fillOpacity="0.1" className="animate-[pulse_4s_infinite]" />

              {/* Dots on points */}
              <circle cx="100" cy="30" r="4" fill="#1E3A8A" className="opacity-80" />
              <circle cx="150" cy="70" r="4" fill="#1E3A8A" className="opacity-80" />
              <circle cx="140" cy="140" r="4" fill="#1E3A8A" className="opacity-80" />
              <circle cx="80" cy="160" r="4" fill="#1E3A8A" className="opacity-80" />
              <circle cx="40" cy="110" r="4" fill="#1E3A8A" className="opacity-80" />

              {/* Scanning Sweep */}
              <g className="origin-center animate-[spin_5s_linear_infinite]">
                <path d="M100 100 L100 20 A80 80 0 0 1 156 43 Z" fill="url(#radarSweep)" className="opacity-40" />
              </g>
              <defs>
                <linearGradient id="radarSweep" x1="100" y1="100" x2="156" y2="43" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

const CTA = ({ onOpenModal, onOpenCancelModal }) => {
  return (
    <section className="w-full bg-background py-32 px-6 md:px-16 flex justify-center items-center relative z-10">
      <div className="bg-white border border-primary/5 rounded-[3rem] p-16 md:p-24 text-center max-w-4xl w-full flex flex-col items-center">
        <h2 className="font-heading font-bold text-4xl md:text-6xl mb-8 text-primary">Your Transformation Starts Now.</h2>
        <p className="font-data text-primary/60 max-w-lg mb-14">Take the first step toward academic excellence. Claim your free trial and experience the Vidyashine difference.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button onClick={onOpenModal} className="magnetic-button group bg-accent text-white px-10 py-5 rounded-full font-heading font-bold text-lg uppercase tracking-wide flex items-center gap-3 shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]">
            <span>Start free trial</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={onOpenCancelModal}
            className="group px-10 py-5 rounded-full font-heading font-bold uppercase tracking-wide flex items-center gap-3 border border-primary/40 text-primary/80 hover:border-primary hover:text-primary transition-all duration-300 hover:bg-primary/5"
          >
            <span>Cancel Booking</span>
          </button>
        </div>
      </div>
    </section>
  );
};

const PricingCard = ({ plan, idx }) => {
  const wrapRef = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setRevealed(true); },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease ${idx * 0.12}s, transform 0.6s ease ${idx * 0.12}s`,
      }}
      className={`h-full flex flex-col ${plan.popular ? 'lg:-translate-y-4 lg:z-10' : 'lg:translate-y-4'}`}
    >
      <div
        className={`group relative border overflow-hidden rounded-[2rem] flex flex-col items-center text-center h-full
          transition-all duration-700 ease-out flex-1 ring-1 ring-white/5 cursor-pointer
          hover:-translate-y-4 hover:scale-[1.02]
          ${plan.popular
            ? 'bg-gradient-to-b from-[#EFF6FF] to-white border-accent/40 shadow-[0_0_40px_rgba(37,99,235,0.1)] hover:shadow-[0_40px_80px_rgba(37,99,235,0.2)] hover:border-accent'
            : 'bg-white border-primary/25 hover:bg-gradient-to-b hover:from-[#F0F4FF] hover:to-white hover:shadow-[0_40px_80px_rgba(10,22,40,0.08)] hover:border-primary/40'
          }`}
        style={{ padding: '3.5rem 2.5rem', minHeight: plan.popular ? '880px' : plan.features.length > 3 ? '800px' : '720px' }}
      >
        {/* Shimmer sweep on hover — lightweight */}
        <div className="absolute inset-0 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[1.5s] ease-in-out bg-gradient-to-r from-transparent via-white/[0.05] to-transparent pointer-events-none z-10" />

        {/* Most Selected Badge */}
        {plan.popular && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-accent/10 border border-accent/30 text-accent px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase font-data z-30 flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse block"></span>
            Most Selected
          </div>
        )}

        <div className="relative z-20 w-full flex flex-col items-center flex-1">
          <h3 className="font-heading font-bold text-3xl text-primary mb-3 mt-4 group-hover:text-black transition-colors duration-500">{plan.name}</h3>
          <p className="font-data text-sm text-primary/50 mb-8">{plan.subject}</p>
          <div className="mb-8 flex items-end justify-center gap-1 group-hover:scale-105 transition-transform duration-500 origin-bottom">
            <span className="font-heading font-bold text-5xl xl:text-6xl text-primary tracking-tighter">{plan.fee}</span>
            <span className="font-data text-sm text-primary/40 mb-2">{plan.period}</span>
          </div>
          <div className="w-full h-[1px] bg-primary/10 mb-8 group-hover:bg-primary/20 transition-colors duration-500"></div>
          <ul className="text-left font-data text-base text-primary/70 space-y-4 w-full px-2 flex-grow flex flex-col justify-start mb-8">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-4 transform transition-transform duration-500 group-hover:translate-x-2" style={{ transitionDelay: `${i * 50}ms` }}>
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-2 transition-colors duration-500 ${plan.popular ? 'bg-accent group-hover:shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-primary/40 group-hover:bg-primary/80'}`}></div>
                <span className="leading-snug text-sm group-hover:text-primary/90 transition-colors duration-500">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const AdmissionsPricing = () => {
  const [activeTab, setActiveTab] = useState('ix');

  const singleSubjectFeatures = ["Targeted Topic Mastery", "Module-specific PDF Notes", "3-Month Course Validity"];
  const completeCourseFeatures = [
    "Full Live Subject Classes",
    "Digital Resource Library (PDFs/E-books)",
    "Subject-wise Practice Sets",
    "Peer-to-Peer Community Access",
    "Archive Video Access",
    "Monthly Parent-Teacher Meetings",
    "Priority Doubt Clearing",
    "Pre-Exam Strategy Workshops"
  ];
  const foundationalFeatures = ["1-on-1 Mentorship", "Physical Study Kits", "24/7 Doubt-Solving Group", "Lifetime Material Access", "Weekly Personalized Mock Tests", "Career Guidance Sessions"];

  const pricingData = {
    vi: {
      title: "Class VI",
      plans: [
        { name: "Single Subject", subject: "Maths or Science", fee: "₹15,000", period: "/ year", popular: false, features: singleSubjectFeatures },
        { name: "Complete Course", subject: "All Subjects", fee: "₹45,000", period: "/ year", popular: false, features: completeCourseFeatures },
        { name: "Foundation Batch", subject: "Maths + Science", fee: "₹30,000", period: "/ year", popular: true, features: foundationalFeatures }
      ]
    },
    vii: {
      title: "Class VII",
      plans: [
        { name: "Single Subject", subject: "Maths or Science", fee: "₹15,000", period: "/ year", popular: false, features: singleSubjectFeatures },
        { name: "Complete Course", subject: "All Subjects", fee: "₹50,000", period: "/ year", popular: false, features: completeCourseFeatures },
        { name: "Foundation Batch", subject: "Maths + Science", fee: "₹32,000", period: "/ year", popular: true, features: foundationalFeatures }
      ]
    },
    viii: {
      title: "Class VIII",
      plans: [
        { name: "Single Subject", subject: "Maths or Science", fee: "₹18,000", period: "/ year", popular: false, features: singleSubjectFeatures },
        { name: "Complete Course", subject: "All Subjects", fee: "₹55,000", period: "/ year", popular: false, features: completeCourseFeatures },
        { name: "Foundation Batch", subject: "Maths + Science", fee: "₹35,000", period: "/ year", popular: true, features: foundationalFeatures }
      ]
    },
    ix: {
      title: "Class IX",
      plans: [
        { name: "Single Subject", subject: "Maths or Science", fee: "₹20,000", period: "/ year", popular: false, features: singleSubjectFeatures },
        { name: "Complete Course", subject: "All Subjects", fee: "₹60,000", period: "/ year", popular: false, features: completeCourseFeatures },
        { name: "Foundation Batch", subject: "Maths + Science", fee: "₹40,000", period: "/ year", popular: true, features: foundationalFeatures }
      ]
    },
    x: {
      title: "Class X",
      plans: [
        { name: "Targeted Focus", subject: "Maths or Science", fee: "₹25,000", period: "/ year", popular: false, features: singleSubjectFeatures },
        { name: "Complete Mastery", subject: "All Subjects", fee: "₹65,000", period: "/ year", popular: false, features: completeCourseFeatures },
        { name: "Board Prep Batch", subject: "Maths + Science", fee: "₹45,000", period: "/ year", popular: true, features: foundationalFeatures }
      ]
    },
    xi: {
      title: "Class XI",
      plans: [
        { name: "Single Core Subject", subject: "Physics/Chem/Maths/Bio", fee: "₹30,000", period: "/ year", popular: false, features: singleSubjectFeatures },
        { name: "Complete + Entrance", subject: "Boards + JEE/NEET Base", fee: "₹95,000", period: "/ year", popular: false, features: completeCourseFeatures },
        { name: "Science Stream", subject: "PCM / PCB", fee: "₹75,000", period: "/ year", popular: true, features: foundationalFeatures }
      ]
    },
    xii: {
      title: "Class XII",
      plans: [
        { name: "Specialized Subject", subject: "Physics/Chem/Maths/Bio", fee: "₹35,000", period: "/ year", popular: false, features: singleSubjectFeatures },
        { name: "Ultimate Target", subject: "Boards + JEE/NEET Advanced", fee: "₹1,10,000", period: "/ year", popular: false, features: completeCourseFeatures },
        { name: "Board Excellence", subject: "PCM / PCB", fee: "₹85,000", period: "/ year", popular: true, features: foundationalFeatures }
      ]
    }
  };

  return (
    <section className="w-full min-h-screen bg-white flex flex-col pt-32 pb-16 px-4 md:px-6 border-t border-primary/5 relative z-10 text-primary">
      <div className="w-full mx-auto flex flex-col flex-1 gap-12">
        <div className="text-center mb-4">
          <h2 className="font-heading font-bold text-4xl md:text-5xl tracking-tight text-primary mb-6">Fee Structure</h2>
          <p className="font-data text-primary/60 max-w-2xl mx-auto text-sm leading-relaxed">
            Transparent investment in pure academic performance. Choose the protocol that aligns with your targets.
          </p>
        </div>

        {/* Class Tabs */}
        <div className="flex flex-row flex-wrap justify-center gap-3 w-full">
          {Object.keys(pricingData).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-8 py-4 rounded-full font-heading font-bold text-lg transition-all duration-300 min-w-[130px] border-2 ${activeTab === key
                ? 'bg-accent text-white border-accent shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                : 'bg-[#F0F4FF] text-primary/40 hover:text-primary hover:bg-[#E0E7FF] border-primary/30'
                }`}
            >
              {pricingData[key].title}
            </button>
          ))}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full flex-1 pt-2">
          {pricingData[activeTab].plans.map((plan, idx) => (
            <PricingCard key={`${activeTab}-${idx}`} plan={plan} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};

const PrivacyPolicy = () => {
  return (
    <section className="w-full min-h-screen bg-[#EFF6FF] flex flex-col pt-28 pb-16 px-6 md:px-16 border-t border-primary/5 relative z-10 text-primary">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="font-heading font-bold text-4xl md:text-5xl text-primary mb-12">Privacy Policy</h1>

        <div className="space-y-8 font-data text-primary/80">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-4">1. Introduction</h2>
            <p className="text-sm leading-relaxed">
              Vidyashine Academy ("we," "us," "our," or "Company") respects the privacy of our users and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-4">2. Information We Collect</h2>
            <p className="text-sm leading-relaxed mb-3">We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
            <ul className="text-sm leading-relaxed space-y-2 ml-4">
              <li>• <span className="font-bold">Personal Data:</span> Name, email address, phone number, date of birth, and academic information.</li>
              <li>• <span className="font-bold">Device Information:</span> Device type, IP address, browser type, and operating system.</li>
              <li>• <span className="font-bold">Performance Data:</span> Test scores, academic progress, and learning analytics.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-4">3. Use of Your Information</h2>
            <p className="text-sm leading-relaxed mb-3">Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
            <ul className="text-sm leading-relaxed space-y-2 ml-4">
              <li>• Process and send booking confirmations and updates.</li>
              <li>• Generate invoices and send billing information.</li>
              <li>• Fulfill and manage purchases, orders, payments, and other transactions related to the Site.</li>
              <li>• Email you regarding your account or order.</li>
              <li>• Improve the Site and better tailor it to match your needs.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-4">4. Disclosure of Your Information</h2>
            <p className="text-sm leading-relaxed">
              We may share information we have collected about you in certain situations. Your information may be disclosed when required by law or in the good faith belief that such action is necessary to comply with a legal obligation.
            </p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-4">5. Security of Your Information</h2>
            <p className="text-sm leading-relaxed">
              We use administrative, technical, and physical security measures to protect your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure.
            </p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-4">6. Contact Us</h2>
            <p className="text-sm leading-relaxed">
              If you have questions or comments about this Privacy Policy, please contact us at:<br />
              <span className="font-bold">Email:</span> {import.meta.env.VITE_SUPPORT_EMAIL || 'support@vidyashine.com'}<br />
              <span className="font-bold">Phone:</span> {import.meta.env.VITE_PHONE || 'Contact us via email'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const TermsOfService = () => {
  return (
    <section className="w-full min-h-screen bg-[#EFF6FF] flex flex-col pt-28 pb-16 px-6 md:px-16 border-t border-primary/5 relative z-10 text-primary">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="font-heading font-bold text-4xl md:text-5xl text-primary mb-12">Terms of Service</h1>

        <div className="space-y-8 font-data text-primary/80">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-4">1. Agreement to Terms</h2>
            <p className="text-sm leading-relaxed">
              By accessing and using Vidyashine Academy's website and services, you accept and agree to be bound by and comply with these Terms and Conditions. If you do not agree to abide by the terms set forth here, please do not use this service.
            </p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-4">2. Use License</h2>
            <p className="text-sm leading-relaxed mb-3">Permission is granted to temporarily download one copy of the materials (information or software) on Vidyashine Academy's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul className="text-sm leading-relaxed space-y-2 ml-4">
              <li>• Modify or copy the materials.</li>
              <li>• Use the materials for any commercial purpose.</li>
              <li>• Attempt to decompile or reverse engineer any software on the website.</li>
              <li>• Remove any copyright or other proprietary notations from the materials.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-4">3. Disclaimer</h2>
            <p className="text-sm leading-relaxed">
              The materials on Vidyashine Academy's website are provided on an 'as is' basis. Vidyashine Academy makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-4">4. Limitations of Liability</h2>
            <p className="text-sm leading-relaxed">
              In no event shall Vidyashine Academy or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Vidyashine Academy's website.
            </p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-4">5. Accuracy of Materials</h2>
            <p className="text-sm leading-relaxed">
              The materials appearing on Vidyashine Academy's website could include technical, typographical, or photographic errors. Vidyashine Academy does not warrant that any of the materials on the website are accurate, complete, or current.
            </p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-4">6. Links</h2>
            <p className="text-sm leading-relaxed">
              Vidyashine Academy has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Vidyashine Academy of the site. Use of any such linked website is at the user's own risk.
            </p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-4">7. Modifications</h2>
            <p className="text-sm leading-relaxed">
              Vidyashine Academy may revise these Terms of Service at any time without notice. By using this website, you are agreeing to be bound by the then current version of these Terms and Conditions.
            </p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-4">8. Contact Information</h2>
            <p className="text-sm leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:<br />
              <span className="font-bold">Email:</span> {import.meta.env.VITE_SUPPORT_EMAIL || 'support@vidyashine.com'}<br />
              <span className="font-bold">Phone:</span> {import.meta.env.VITE_PHONE || 'Contact us via email'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const Contact = () => {
  return (
    <section className="w-full min-h-screen bg-[#EFF6FF] flex flex-col pt-32 pb-16 px-6 md:px-16 border-t border-primary/5 relative z-10 text-primary">
      <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 gap-14 items-center">
        <div className="text-center mb-4">
          <h2 className="font-heading font-bold text-4xl md:text-5xl mb-6 text-primary tracking-tight">Contact Us</h2>
          <p className="font-data text-primary/60 max-w-2xl mx-auto text-sm leading-relaxed">
            Reach out to us directly or visit one of our offices. We're here Mon–Sat, 9AM to 7PM.
          </p>
        </div>

        <div className="flex flex-col lg:flex-col gap-6 flex-1 max-w-2xl w-full">
          {/* Get In Touch card */}
          <div className="flex-1 flex flex-col justify-center gap-8 bg-[#F0F4FF] border border-primary/5 rounded-[2rem] p-8 md:p-12 items-center text-center">
            <h3 className="font-heading font-bold text-2xl text-primary border-b border-primary/10 pb-4 w-full text-center">Get In Touch</h3>
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.15)] shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <div className="text-center">
                <p className="font-data text-2xl text-primary/90 font-bold tracking-wide">9999906710</p>
                <p className="font-data text-xs text-primary/40 mt-1">Available Mon–Sat, 9AM to 7PM</p>
              </div>
            </div>
          </div>

          {/* Meet Us card */}
          <div className="flex-1 flex flex-col bg-[#F0F4FF] rounded-[2rem] p-8 md:p-12 border border-primary/5 shadow-lg relative overflow-hidden group items-center text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors duration-500 pointer-events-none"></div>
            <h3 className="font-heading font-bold text-2xl text-primary border-b border-primary/10 pb-4 mb-8 relative z-10 w-full text-center">Meet Us</h3>
            <div className="flex flex-col gap-8 relative z-10 items-center">
              <div className="flex flex-col items-center gap-2">
                <div className="shrink-0">
                  <svg className="w-5 h-5 text-accent opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div className="text-center">
                  <h4 className="font-data text-primary/80 font-bold text-sm mb-1 uppercase tracking-widest">Head Office</h4>
                  <p className="font-data text-primary/50 text-sm leading-relaxed">B-1, Sector-52, Noida.</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="shrink-0">
                  <svg className="w-5 h-5 text-accent opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div className="text-center">
                  <h4 className="font-data text-primary/80 font-bold text-sm mb-1 uppercase tracking-widest">Branch Office</h4>
                  <p className="font-data text-primary/50 text-sm leading-relaxed">A-24, Sector-34, Noida.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const AboutUs = () => {
  const [imageError, setImageError] = useState(false);

  return (
    <section className="w-full min-h-screen bg-[#EFF6FF] flex flex-col pt-32 pb-16 px-6 md:px-16 border-t border-primary/5 relative z-10 text-primary">
      <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 gap-20 items-center">
        <div className="text-center mb-4">
          <h2 className="font-heading font-bold text-4xl md:text-5xl mb-6 text-primary tracking-tight">About Us</h2>
          <p className="font-data text-primary/60 max-w-2xl mx-auto text-sm leading-relaxed">
            Meet the dedicated leadership behind Vidyashine Academy
          </p>
        </div>

        <div className="w-full flex justify-center">
          <div className="bg-[#F0F4FF] border border-primary/5 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-[0_10px_40px_rgba(37,99,235,0.1)] transition-all duration-300 max-w-sm w-full">
            <div className="h-96 overflow-hidden bg-gradient-to-b from-[#E0E7FF] to-[#F0F4FF] flex items-center justify-center">
              {!imageError ? (
                <img
                  src="/Tutor.jpg"
                  alt="Abhishek Rana - Director & Maths HOD"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                  style={{ display: 'block' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5">
                  <div className="text-center">
                    <div className="text-6xl mb-4">👤</div>
                    <p className="font-data text-sm text-primary/50">Abhishek Rana</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-8 text-center">
              <h3 className="font-heading font-bold text-2xl text-primary mb-3">Mr. Abhishek Rana</h3>
              <p className="font-data text-sm text-accent font-bold mb-4">Director, Maths HOD</p>
              <div className="space-y-2 mb-6">
                <p className="font-data text-sm text-primary/70">MSc, B-Tech, B.Ed</p>
                <p className="font-data text-sm text-primary/70">12+ Years Experience</p>
              </div>
              <p className="font-data text-xs text-primary/50 leading-relaxed border-t border-primary/10 pt-6">
                Competitive exam veteran with proven track record of transforming student performance across mathematics, physics, and chemistry.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full border-t border-primary/10 pt-20">
          <div className="text-center mb-16">
            <h3 className="font-heading font-bold text-3xl md:text-4xl text-primary mb-4">Our Achievements</h3>
            <p className="font-data text-primary/60 max-w-2xl mx-auto text-sm">
              Excellence through measurable results and dedicated mentorship
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-[#F0F4FF] border border-primary/5 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-[0_10px_40px_rgba(37,99,235,0.1)] transition-all duration-500 group">
              <div className="h-72 md:h-96 overflow-hidden bg-gradient-to-b from-[#E0E7FF] to-[#F0F4FF] flex items-center justify-center">
                <img
                  src="/0.jpg"
                  alt="Achievement 1"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  style={{ display: 'block' }}
                />
              </div>
            </div>

            <div className="bg-[#F0F4FF] border border-primary/5 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-[0_10px_40px_rgba(37,99,235,0.1)] transition-all duration-500 group">
              <div className="h-72 md:h-96 overflow-hidden bg-gradient-to-b from-[#E0E7FF] to-[#F0F4FF] flex items-center justify-center">
                <img
                  src="/1.jpg"
                  alt="Achievement 2"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  style={{ display: 'block' }}
                />
              </div>
            </div>

            <div className="bg-[#F0F4FF] border border-primary/5 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-[0_10px_40px_rgba(37,99,235,0.1)] transition-all duration-500 group">
              <div className="h-72 md:h-96 overflow-hidden bg-gradient-to-b from-[#E0E7FF] to-[#F0F4FF] flex items-center justify-center">
                <img
                  src="/2.jpg"
                  alt="Achievement 3"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  style={{ display: 'block' }}
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-[2rem] p-8 md:p-12 text-center">
            <p className="font-heading italic text-lg md:text-xl text-primary mb-2">
              "Success is not just about scores—it's about building confident learners"
            </p>
            <p className="font-data text-sm text-primary/60">
              who understand concepts deeply, solve problems creatively, and excel in competitive exams.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const ReachUs = () => {
  const branches = [
    {
      name: "Sector 52 Branch",
      mapsUrl: "https://maps.app.goo.gl/toEniV9gz6iJwuG98",
      address: "B-1, Sector-52, Noida"
    },
    {
      name: "Sector 34 Branch",
      mapsUrl: "https://maps.app.goo.gl/XeeXz8uAfVXBJRUX7",
      address: "A-24, Sector-34, Noida"
    },
    {
      name: "Sector 61 Branch",
      mapsUrl: "https://maps.app.goo.gl/cenfftHzkuANHFqR6",
      address: "Sector-61, Noida"
    }
  ];

  return (
    <section className="w-full min-h-screen bg-[#EFF6FF] flex flex-col pt-32 pb-16 px-6 md:px-16 border-t border-primary/5 relative z-10 text-primary">
      <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 gap-20">
        <div className="text-center mb-4">
          <h2 className="font-heading font-bold text-4xl md:text-5xl mb-6 text-primary tracking-tight">Reach Us</h2>
          <p className="font-data text-primary/60 max-w-2xl mx-auto text-sm leading-relaxed">
            Visit one of our conveniently located branches. Choose the location nearest to you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
          {branches.map((branch, idx) => (
            <div key={idx} className="bg-[#F0F4FF] border border-primary/5 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-[0_10px_40px_rgba(37,99,235,0.1)] transition-all duration-300 group flex flex-col">
              {/* Location preview */}
              <div className="h-64 bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <svg className="w-16 h-16 text-accent" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.13 0 5 3.13 5 7c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <div>
                    <p className="font-heading font-bold text-primary mb-2">Location</p>
                    <p className="font-data text-sm text-primary/70">{branch.address}</p>
                  </div>
                </div>
              </div>
              {/* Branch info */}
              <div className="p-8 flex flex-col flex-1 justify-between">
                <div className="mb-6">
                  <h3 className="font-heading font-bold text-2xl text-primary mb-3">{branch.name}</h3>
                  <p className="font-data text-sm text-primary/70">{branch.address}</p>
                </div>
                <a
                  href={branch.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-accent text-white px-6 py-3 rounded-full font-data text-sm font-medium hover:bg-accent/90 transition-all duration-200 group-hover:shadow-[0_10px_25px_rgba(37,99,235,0.25)]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  View on Maps
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => {
  const scrollRef = useRef(null);

  const reviews = [
    { type: "Student", text: "Vidyashine completely transformed how I approach problem-solving. My board scores jumped by 40% in just one term.", author: "Rohan Sharma, Class 12" },
    { type: "Parent", text: "The transparency is remarkable. Weekly progress reports and diagnostic tests give us full visibility into our child's growth.", author: "Mr. Rajesh Gupta (Parent of Class 10 Student)" },
    { type: "Student", text: "The JEE foundation track here is unmatched. Doubt clearing sessions made complex topics feel effortless.", author: "Ananya Gupta, Class 11" },
    { type: "Parent", text: "The faculty doesn't just teach — they mentor. It's the most concept-focused coaching we've found in Noida.", author: "Mrs. Neha Sharma (Parent of Class 12 Student)" },
    { type: "Student", text: "Small batches and personal attention from every teacher. My confidence in Physics and Chemistry has never been higher.", author: "Aditya Verma, Class 10" },
    { type: "Parent", text: "A serious, no-nonsense environment that genuinely prepares students for competitive exams and beyond.", author: "Mr. Amit Verma (Parent of Class 11 Student)" }
  ];

  // Duplicate for infinite scroll 
  const extendedReviews = [...reviews, ...reviews];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Continuous sliding animation — GPU-accelerated
      gsap.to(scrollRef.current, {
        xPercent: -50,
        repeat: -1,
        duration: 30,
        ease: "linear",
        force3D: true,
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="w-full bg-[#EFF6FF] py-36 border-t border-primary/5 relative z-10 overflow-hidden text-primary">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-16 mb-24 text-center">
        <h2 className="font-heading font-bold text-4xl md:text-5xl tracking-tight text-primary mb-6">What Our Community Says</h2>
        <p className="font-data text-primary/60 max-w-2xl mx-auto text-sm leading-relaxed">
          Real stories from the students and families who trust Vidyashine to shape their academic future.
        </p>
      </div>

      {/* Infinite scrolling container — GPU-composited for smooth 60fps */}
      <div className="flex w-fit" ref={scrollRef} style={{ willChange: 'transform' }}>
        {extendedReviews.map((r, i) => (
          <div key={i} className="flex-shrink-0 w-[350px] md:w-[450px] mx-4">
            <div className="bg-[#F0F4FF] border border-primary/15 rounded-[2rem] p-8 md:p-10 h-full flex flex-col group hover:border-accent/40 transition-colors duration-300">
              <div className="font-data text-[10px] text-accent font-bold tracking-widest uppercase mb-6 pb-4 border-b border-primary/10">
                // {r.type} <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-primary/40">VERIFIED</span>
              </div>
              <h4 className="font-heading font-bold text-xl md:text-2xl text-primary leading-snug mb-8 flex-1 group-hover:text-black transition-colors">
                "{r.text}"
              </h4>
              <p className="font-data text-sm font-bold uppercase tracking-wider text-primary/60">
                {r.author}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="w-full bg-[#0A1628] text-white rounded-t-[4rem] pt-24 pb-12 px-6 md:px-16 relative z-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20 text-center">
        <div className="lg:col-span-2 flex flex-col items-center">
          <Link to="/" className="mb-6 inline-block rounded-full overflow-hidden bg-transparent">
            <img src="/logo.png" alt="Vidyashine Academy Logo" className="h-20 w-auto object-contain drop-shadow-lg" />
          </Link>
          <p className="font-data text-sm text-white/60 max-w-xs">Structured teaching, regular testing, and performance tracking.</p>
        </div>
        <div>
          <h4 className="font-data text-accent font-bold mb-6 text-sm">Navigation</h4>
          <ul className="flex flex-col gap-4 font-heading">
            <li><Link to="/" className="link-lift opacity-80 hover:opacity-100 text-white/80 hover:text-white">Features & Philosophy</Link></li>
            <li><Link to="/curriculum" className="link-lift opacity-80 hover:opacity-100 text-white/80 hover:text-white">Curriculum</Link></li>
            <li><Link to="/admissions" className="link-lift opacity-80 hover:opacity-100 text-white/80 hover:text-white">Admissions</Link></li>
            <li><Link to="/contact" className="link-lift opacity-80 hover:opacity-100 text-white/80 hover:text-white">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-data text-accent font-bold mb-6 text-sm">Legal</h4>
          <ul className="flex flex-col gap-4 font-heading">
            <li><Link to="/privacy-policy" className="link-lift opacity-80 hover:opacity-100 text-white/80 hover:text-white">Privacy Policy</Link></li>
            <li><Link to="/terms-of-service" className="link-lift opacity-80 hover:opacity-100 text-white/80 hover:text-white">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col items-center gap-4">
        <div className="font-data text-xs text-white/40">© {new Date().getFullYear()} Vidyashine Academy. All rights reserved.</div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-data text-xs tracking-widest text-white/60 uppercase">System Operational</span>
        </div>
      </div>
    </footer>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    ScrollTrigger.refresh();
  }, [pathname]);

  return null;
};

// --- PAGES ---

const Stats = () => {
  const statsRef = useRef(null);
  const statsData = [
    { value: "3", label: "Campus Locations" },
    { value: "10000+", label: "Students Transformed" },
    { value: "1000+", label: "Assessments Delivered" },
    { value: "Top", label: "Board Performers" }
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.stat-item', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 85%',
        }
      });
    }, statsRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={statsRef} className="w-full bg-white py-12 border-b border-primary/5 relative z-10">
      <div className="w-full max-w-6xl mx-auto px-6 md:px-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center">
          {statsData.map((stat, idx) => (
            <div key={idx} className="stat-item flex flex-col items-center justify-center space-y-2">
              <span className="font-heading font-black text-4xl md:text-5xl text-accent">{stat.value}</span>
              <span className="font-data text-sm md:text-base text-primary font-medium">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HomePage = ({ onOpenModal, onOpenCancelModal }) => (
  <>
    <Hero onOpenModal={onOpenModal} onOpenCancelModal={onOpenCancelModal} />
    <Stats />
    <Features />
    <Philosophy />
    <Protocol />
    <Testimonials />
    <CTA onOpenModal={onOpenModal} onOpenCancelModal={onOpenCancelModal} />
  </>
);

const CurriculumPage = ({ onOpenModal, onOpenCancelModal }) => (
  <>
    <Curriculum />
    <CompetitiveExams />
    <CTA onOpenModal={onOpenModal} onOpenCancelModal={onOpenCancelModal} />
  </>
);

const AdmissionsPage = ({ onOpenModal, onOpenCancelModal }) => (
  <>
    <AdmissionsPricing onOpenModal={onOpenModal} onOpenCancelModal={onOpenCancelModal} />
    <CTA onOpenModal={onOpenModal} onOpenCancelModal={onOpenCancelModal} />
  </>
);

const ContactPage = () => (
  <Contact />
);

const AboutUsPage = () => (
  <AboutUs />
);

const ReachUsPage = () => (
  <ReachUs />
);

const PrivacyPolicyPage = () => (
  <PrivacyPolicy />
);

const TermsOfServicePage = () => (
  <TermsOfService />
);

// --- SAFE BLOG IMAGE COMPONENT (replaces innerHTML XSS pattern) ---
const BlogImage = ({ src, alt, className, fallbackSize = 48 }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full flex items-center justify-center text-primary/20 bg-[#F0F4FF]">
        <Terminal style={{ width: fallbackSize, height: fallbackSize }} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};

// --- 404 NOT FOUND PAGE ---
const NotFoundPage = () => (
  <section className="w-full min-h-screen bg-[#EFF6FF] flex flex-col items-center justify-center px-6 relative z-10 text-primary">
    <h1 className="font-heading font-bold text-8xl md:text-9xl text-accent mb-6">404</h1>
    <h2 className="font-heading font-bold text-2xl md:text-3xl text-primary mb-4">Page Not Found</h2>
    <p className="font-data text-primary/60 text-sm mb-10 max-w-md text-center">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <Link to="/" className="magnetic-button bg-accent text-white px-8 py-4 rounded-full font-heading font-bold uppercase tracking-wide flex items-center gap-3">
      <span>Back to Home</span>
      <ArrowRight className="w-5 h-5" />
    </Link>
  </section>
);

// --- BLOG PAGE COMPONENT ---
const BlogPage = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      // Reveal header
      gsap.fromTo('.blog-header-element',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power4.out', delay: 0.2 }
      );

      // Reveal blog cards on scroll
      gsap.fromTo('.blog-card',
        { y: 80, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.blog-grid',
            start: 'top 80%',
          }
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen pt-32 pb-24 relative">
      {/* Fixed Aurora Glow (Hardware Accelerated) */}
      <div className="fixed top-1/4 left-1/4 w-1/2 h-[500px] bg-accent/10 blur-[100px] rounded-full pointer-events-none transform-gpu opacity-30"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-28 max-w-3xl mx-auto flex flex-col items-center">
          <div className="blog-header-element inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary/70 text-xs font-data font-medium tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            Journal & Insights
          </div>
          <h1 className="blog-header-element font-heading font-black text-5xl md:text-7xl text-primary mb-6 tracking-tighter leading-none">
            The <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-400 to-blue-500" style={{ filter: 'drop-shadow(0 0 12px rgba(37,99,235,0.6)) drop-shadow(0 0 30px rgba(59,130,246,0.4))' }}>Vidyashine</span> Chronicle
          </h1>
          <p className="blog-header-element font-data text-xl text-primary/60">
            Thoughts, announcements, and mathematical insights from the frontier of education.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="blog-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogData.map((blog, index) => (
            <Link
              to={`/blog/${blog.link}`}
              key={index}
              className="blog-card group flex flex-col bg-white border border-primary/15 rounded-[2rem] overflow-hidden hover:border-accent/40 transition-all duration-500 shadow-[0_8px_30px_rgba(10,22,40,0.08)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.1)] hover:-translate-y-2 relative"
            >
              {/* Image Container */}
              <div className="relative h-64 w-full overflow-hidden bg-[#F0F4FF]">
                <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent z-10"></div>
                {blog.image ? (
                  <BlogImage
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    fallbackSize={48}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary/20 bg-[#F0F4FF]">
                    <Terminal className="w-12 h-12" />
                  </div>
                )}
                {/* Specular Edge Glow inside image */}
                <div className="absolute inset-0 border border-white/5 rounded-t-[2rem] z-20 pointer-events-none"></div>
              </div>

              {/* Content Container */}
              <div className="flex flex-col flex-grow p-8 relative z-20">
                <div className="flex items-center gap-3 mb-4 text-xs font-data text-primary/50 tracking-wider uppercase">
                  <Calendar className="w-3.5 h-3.5" />
                  <time dateTime={blog.date}>
                    {new Date(blog.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                </div>

                <h3 className="font-heading font-bold text-2xl text-primary mb-4 leading-tight group-hover:text-accent transition-colors line-clamp-3">
                  {blog.title}
                </h3>

                <p className="font-data text-primary/60 text-sm leading-relaxed mb-8 flex-grow line-clamp-4">
                  {blog.description}
                </p>

                {/* Read More Button */}
                <div className="mt-auto pt-6 border-t border-primary/10 flex items-center justify-between">
                  <span className="font-heading font-bold text-xs tracking-widest uppercase text-primary/80 group-hover:text-accent transition-colors">
                    Read Article
                  </span>
                  <div className="w-8 h-8 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- BLOG ARTICLE COMPONENT ---

const BlogArticle = () => {
  const { slug } = useParams();
  const containerRef = useRef(null);
  const blog = blogData.find((b) => b.link === slug);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (blog) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.article-reveal',
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out', delay: 0.1 }
        );

        gsap.fromTo('.article-image-reveal',
          { scale: 1.05, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.2, ease: 'power4.out', delay: 0.3 }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [blog]);

  // If slug is invalid, redirect to the main blog page
  if (!blog) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <article ref={containerRef} className="min-h-screen pt-32 pb-24 relative">
      {/* Fixed Aurora Background */}
      <div className="fixed top-1/4 left-1/4 w-1/2 h-[500px] bg-accent/5 blur-[100px] rounded-full pointer-events-none transform-gpu opacity-30 z-0"></div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <Link to="/blog" className="article-reveal inline-flex items-center gap-2 text-primary/60 hover:text-accent transition-colors font-data text-sm uppercase tracking-widest mb-12 group">
          <ArrowRight className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-1" />
          Back to Journal
        </Link>

        {/* Header content */}
        <header className="mb-16">
          <div className="article-reveal flex items-center gap-3 mb-6 text-sm font-data text-accent tracking-widest uppercase">
            <Calendar className="w-4 h-4" />
            <time dateTime={blog.date}>
              {new Date(blog.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          </div>
          <h1 className="article-reveal font-heading font-black text-4xl md:text-6xl text-primary leading-tight tracking-tighter mb-8">
            {blog.title}
          </h1>
        </header>

        {/* Feature Image */}
        <div className="article-image-reveal relative w-full h-[40vh] md:h-[60vh] rounded-[2rem] overflow-hidden mb-16 border border-primary/10 shadow-[0_20px_50px_rgba(10,22,40,0.1)]">
          {blog.image ? (
            <BlogImage
              src={blog.image}
              alt={blog.title}
              className="w-full h-full object-cover"
              fallbackSize={64}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/20 bg-[#F0F4FF]">
              <Terminal className="w-16 h-16" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60"></div>
          <div className="absolute inset-0 border border-white/5 rounded-[2rem] pointer-events-none"></div>
        </div>

        {/* Article Body */}
        <div className="article-reveal prose prose-lg max-w-none font-data text-primary/80 leading-relaxed md:leading-loose">
          <p className="text-xl md:text-2xl text-primary font-medium mb-8 leading-snug border-l-2 border-accent pl-6">
            {blog.description}
          </p>
          <p>
            Welcome to Vidyashine Academy's official communication channel. Here, we outline our commitment to pushing the boundaries of what is possible in educational methodology. Our focus remains resolutely on structural brilliance and conceptual purity over rote mechanics.
          </p>
          <p>
            For those embarking on this journey with us, know that we view academic rigor not as a burden, but as the fundamental sharpening interface for the ambitious mind. From algorithmic thinking to mastery of the physical sciences, the paradigm starts here.
          </p>
        </div>

        {/* Footer actions */}
        <div className="article-reveal mt-20 pt-10 border-t border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-sm font-data text-primary/50 uppercase tracking-widest">
            End of Transmission
          </div>
          <a href="https://www.instagram.com/pibrains/" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-6 py-3 rounded-full border border-primary/20 font-heading text-sm uppercase tracking-widest hover:border-accent hover:text-accent transition-colors">
            Share this insight
          </a>
        </div>
      </div>
    </article>
  );
};

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="relative w-full min-h-screen bg-background text-primary flex flex-col">
        <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <CancellationModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} />

        <div className="noise-overlay">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
          </svg>
        </div>

        <Navbar onOpenModal={() => setIsModalOpen(true)} onOpenCancelModal={() => setIsCancelModalOpen(true)} />

        <main className="flex-grow w-full flex flex-col">
          <Routes>
            <Route path="/" element={<HomePage onOpenModal={() => setIsModalOpen(true)} onOpenCancelModal={() => setIsCancelModalOpen(true)} />} />
            <Route path="/curriculum" element={<CurriculumPage onOpenModal={() => setIsModalOpen(true)} onOpenCancelModal={() => setIsCancelModalOpen(true)} />} />
            <Route path="/admissions" element={<AdmissionsPage onOpenModal={() => setIsModalOpen(true)} onOpenCancelModal={() => setIsCancelModalOpen(true)} />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogArticle />} />
            {/* Placeholder routes for the rest to keep nav working */}
            <Route path="/about-us" element={<AboutUsPage />} />
            <Route path="/reach-us" element={<ReachUsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
