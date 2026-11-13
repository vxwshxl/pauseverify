import Link from "next/link";
import { ArrowRight, Clock, EyeOff, Gift, KeyRound, Lock, Phone, QrCode, Siren, Users, Zap } from "lucide-react";
import { HeroDemo } from "./hero-demo";

const CATCHES = [
  { Icon: KeyRound, title: "Bank & KYC alerts", quote: "Your account will be blocked in 10 minutes" },
  { Icon: Siren, title: "“Digital arrest” calls", quote: "Stay on the video call and don’t tell anyone" },
  { Icon: QrCode, title: "QR “refunds”", quote: "Scan this QR to receive ₹5,000" },
  { Icon: Gift, title: "Too-good jobs & prizes", quote: "Earn ₹3,000 daily liking videos" },
  { Icon: Users, title: "“New number” family", quote: "Maa, my phone broke, send money now" },
  { Icon: Zap, title: "Power-cut threats", quote: "Electricity disconnected tonight at 9:30" },
];

export default function Home() {
  return (
    <>
      <section className="container-page grid items-center gap-12 pb-16 pt-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-24 lg:pt-20">
        <div className="animate-rise">
          <h1 className="text-balance font-display text-[52px] font-semibold leading-[0.98] sm:text-[68px] lg:text-[76px]">
            Pause before
            <br />
            you <span className="text-brand">pay.</span>
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-secondary-fg sm:text-xl">
            Pause &amp; Verify sits quietly at the bottom of your browser. When a message tries to rush, scare or trick you, it stops you — and shows you how to check, in plain words.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/demo" className="inline-flex h-14 items-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition-transform duration-[120ms] active:scale-[0.97]">
              Try the live demo<ArrowRight className="size-[18px]" />
            </Link>
            <Link href="/check" className="inline-flex h-14 items-center rounded-full border border-border-strong px-7 text-base font-semibold transition-colors duration-[120ms] hover:border-foreground">
              Check a message
            </Link>
          </div>
          <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4" strokeWidth={1.75} />Checks run on your device. Nothing you read is stored.
          </p>
        </div>
        <HeroDemo />
      </section>

      <section className="border-t border-border">
        <div className="container-page py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-xl text-balance font-display text-[34px] font-semibold leading-tight sm:text-[42px]">The tricks it knows by heart</h2>
            <p className="max-w-sm text-secondary-fg">Written from the scams people in India actually receive — by SMS, on WhatsApp and in email.</p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATCHES.map(({ Icon, title, quote }) => (
              <li key={title} className="group rounded-[20px] bg-subtle p-6 transition-colors duration-[180ms] hover:bg-muted">
                <Icon className="size-8 text-foreground" strokeWidth={1.4} />
                <h3 className="mt-8 font-display text-xl font-semibold tracking-[-0.02em]">{title}</h3>
                <p className="mt-1.5 text-[15px] text-muted-foreground">“{quote}”</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-border bg-subtle">
        <div className="container-page grid gap-10 py-20 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div>
            <h2 className="text-balance font-display text-[34px] font-semibold leading-tight sm:text-[42px]">Speaks the Northeast</h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-secondary-fg">
              Scams don’t only arrive in English. Every warning, explanation and answer is available in seven Northeast languages — including low-resource ones like Bodo, Khasi and Mizo that big apps leave out — through Bhashini, the Government of India’s language platform.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">Read-aloud in English, Hindi, Assamese, Bodo, Bengali and Nepali, for people who find reading hard.</p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["অসমীয়া", "Assamese", "Assam"],
              ["बड़ो", "Bodo", "Assam · BTR"],
              ["ꯃꯤꯇꯩꯂꯣꯟ", "Manipuri", "Manipur"],
              ["Khasi", "Khasi", "Meghalaya"],
              ["Mizo", "Mizo", "Mizoram"],
              ["नेपाली", "Nepali", "Sikkim"],
              ["বাংলা", "Bengali", "Tripura · Barak"],
              ["हिन्दी", "Hindi", "Across India"],
              ["English", "English", "Everywhere"],
            ].map(([native, name, where]) => (
              <li key={name} className="rounded-[20px] bg-background p-5 shadow-card">
                <p className="font-display text-2xl font-semibold leading-tight" lang="und">{native}</p>
                <p className="mt-2 text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{where}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how" className="scroll-mt-24 border-t border-border">
        <div className="container-page py-20">
          <h2 className="font-display text-[34px] font-semibold leading-tight sm:text-[42px]">How it works</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {[
              { n: "1", title: "Watches quietly", body: "A small pill at the bottom of the page. It reads messages as they appear — on your computer, not on a server.", Icon: Clock },
              { n: "2", title: "Stops you at the risky moment", body: "Rushing, threats, OTP requests, fake links and QR “refunds” turn it red, with each warning sign underlined right in the message.", Icon: EyeOff },
              { n: "3", title: "Shows you a safe way to check", body: "Plain words on why it’s suspicious, and what to do instead: open the real app yourself, never share an OTP, call 1930 if money moved.", Icon: Phone },
            ].map(({ n, title, body }) => (
              <li key={n} className="border-t-2 border-foreground pt-6">
                <span className="font-display text-sm font-semibold text-muted-foreground">0{n}</span>
                <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em]">{title}</h3>
                <p className="mt-3 leading-relaxed text-secondary-fg">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page pb-24">
        <div className="grid gap-8 rounded-[32px] bg-brand-subtle p-8 sm:p-12 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <h2 className="font-display text-[30px] font-semibold leading-tight sm:text-[38px]">Already clicked, shared or paid?</h2>
            <p className="mt-3 max-w-lg text-lg text-secondary-fg">Don’t wait. Reporting in the first hours gives the best chance of stopping the money.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <a href="tel:1930" className="inline-flex h-14 items-center gap-2 rounded-full bg-brand px-7 text-base font-semibold text-white"><Phone className="size-[18px]" />Call 1930</a>
            <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="inline-flex h-14 items-center rounded-full border border-foreground/20 bg-background px-7 text-base font-semibold">cybercrime.gov.in</a>
          </div>
        </div>
      </section>
    </>
  );
}
