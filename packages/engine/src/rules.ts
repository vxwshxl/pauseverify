import type { FlagKind } from "./types.ts";

// Red-flag patterns in English, Hinglish, Hindi and Assamese. JavaScript's \b only
// understands ASCII, so Indic alternatives are written without word boundaries.
// Each rule is a warning sign people can recognise once it is pointed out.

export interface Rule {
  kind: FlagKind;
  title: string;
  detail: string;
  weight: number;
  patterns: RegExp[];
  /** A few plain examples of what triggers it, for the website's scoring table. */
  examples: string[];
  /**
   * Every word and phrase the patterns are written to catch, listed in full on the scoring page.
   * A test checks that each one really triggers this rule, so the page can't promise more than
   * the engine does.
   */
  words: string[];
}

const g = (src: string) => new RegExp(src, "gi");

/** Curly and backtick apostrophes → '. Phones type ’; the rules are written with '. Keeps length. */
export const straightQuotes = (s: string) => s.replace(/[’‘ʼ`]/g, "'");

export const RULES: Rule[] = [
  {
    kind: "urgency",
    title: "Rushing you",
    detail: "A short deadline is meant to make you act before you think. Real banks and offices give you time.",
    weight: 15,
    examples: ["immediately", "in 10 minutes", "last chance", "expires today", "turant"],
    words: [
      "urgent", "urgently", "immediately", "right now", "act now", "ASAP",
      "last chance", "last day", "last warning", "last reminder",
      "expires today", "expire tonight", "expires soon", "before midnight", "before tonight", "tonight at", "today itself",
      "within 24 hours", "within 48 hrs", "within 30 minutes", "in 10 minutes", "in 2 hours", "5 minutes left", "10 mins only",
      "turant", "jaldi", "abhi ke abhi",
      "तुरंत", "तुरन्त", "जल्दी", "अभी तुरंत", "आज ही",
      "লগে লগে", "তৎক্ষণাত", "আজিয়েই",
    ],
    patterns: [
      g(String.raw`\b(urgent(ly)?|immediately|right now|act now|asap|last (chance|day|warning|reminder)|expires? (today|tonight|soon)|before (midnight|tonight)|tonight at|today itself|within (\d+|24|48) ?(min(ute)?s?|hours?|hrs?)|in (\d+) ?(min(ute)?s?|hours?|hrs?)|(\d+) ?(min(ute)?s?) (left|only))\b`),
      g(String.raw`\b(turant|jaldi|abhi ke abhi)\b`),
      g("तुरंत|तुरन्त|जल्दी|अभी तुरंत|आज ही|तुरंत ही|লগে লগে|তৎক্ষণাত|আজিয়েই"),
    ],
  },
  {
    kind: "threat",
    title: "Scaring you",
    detail: "Talk of blocking, arrest, fines or cutting your power is designed to frighten you into doing what they say.",
    weight: 20,
    examples: ["account will be blocked", "power will be disconnected", "arrest warrant", "legal action"],
    words: [
      "will be blocked", "will be suspended", "will be deactivated", "will be closed", "will be frozen",
      "will be disconnected", "will be terminated", "will be cancelled",
      "account blocked", "account has been suspended", "card blocked", "SIM is blocked", "number deactivated",
      "connection disconnected", "power will be cut", "electricity disconnected",
      "arrest", "arrested", "warrant", "legal action", "money laundering", "drugs parcel", "illegal items", "illegal parcel",
      "penalty", "fine of", "disconnection",
      "बंद हो जाएगा", "बंद कर दिया", "ब्लॉक", "गिरफ्तार", "कानूनी कार्रवाई",
      "জব্দ", "বন্ধ হৈ যাব", "গ্ৰেপ্তাৰ",
    ],
    patterns: [
      g(String.raw`\b(will be (blocked|suspended|deactivated|closed|frozen|disconnected|terminated|cancelled)|(account|card|sim|number|connection|power|electricity) (is |has been |will be )?(blocked|suspended|deactivated|frozen|disconnected|cut)|arrest(ed)?|warrant|legal action|money laundering|drug(s)? parcel|illegal (items|parcel)|penalty|fine of|disconnect(ed|ion)?)\b`),
      g("बंद हो जाएगा|बंद कर दिया|ब्लॉक|गिरफ्तार|कानूनी कार्रवाई|জব্দ|বন্ধ হৈ যাব|গ্ৰেপ্তাৰ"),
    ],
  },
  {
    kind: "credentials",
    title: "Asking for secret details",
    detail: "OTP, PIN, password, card number or KYC through a link or a call. No real bank or company ever asks for these.",
    weight: 30,
    examples: ["share your OTP", "update KYC", "enter your PIN", "card details"],
    words: [
      "share your OTP", "share the PIN", "share password", "send your OTP", "send CVV", "tell me your OTP", "tell us your PIN",
      "enter your OTP", "enter your PIN", "enter your password", "enter your card",
      "update KYC", "complete your KYC", "verify PAN", "link your Aadhaar", "link Aadhar",
      "KYC update", "KYC pending", "KYC expired", "KYC verification",
      "card number", "card details", "net banking details", "netbanking password", "login details", "CVV",
      "ओटीपी बताएं", "ओटीपी भेजें", "केवाईसी अपडेट", "पिन बताएं",
      "পাছৱৰ্ড", "অটিপি দিয়ক", "কেৱাইচি আপডেট",
    ],
    patterns: [
      g(String.raw`\b(share (your |the )?(otp|pin|password|cvv)|send (your |the )?(otp|pin|password|cvv)|tell (me|us) (your |the )?(otp|pin)|enter (your |the )?(otp|pin|password|card)|(update|complete|verify|link) (your )?(kyc|pan|aadhaa?r)|kyc (update|pending|expired|verification)|card (number|details)|net ?banking (details|password)|login details|cvv)\b`),
      g("ओटीपी बताएं|ओटीपी भेजें|केवाईसी अपडेट|पिन बताएं|পাছৱৰ্ড|অটিপি দিয়ক|কেৱাইচি আপডেট"),
    ],
  },
  {
    kind: "payment",
    title: "Asking you to pay",
    detail: "A fee to receive money, or a payment to “unlock” something, is how refund, prize and job scams work.",
    weight: 12,
    examples: ["processing fee", "pay ₹99", "scan this QR", "enter your UPI PIN"],
    words: [
      "processing fee", "registration fee", "release fee", "clearance fee", "refundable fee", "refundable deposit",
      "pay a fee", "pay the charges", "pay a small fee", "pay verification fee", "pay security amount", "pay clearance charge",
      "pay ₹99", "pay Rs. 500", "pay INR 2000", "deposit ₹500", "send ₹1000", "transfer ₹5000",
      "scan this QR", "scan the QR", "enter UPI PIN", "enter your UPI PIN", "accept the collect request",
      "शुल्क जमा", "फीस भरें", "पैसे भेजें",
      "ফিচ জমা", "টকা পঠিয়াওক",
    ],
    patterns: [
      // Amounts take \d+ so "pay ₹99" matches: a single \d then \b failed between two digits.
      g(String.raw`\b(processing fee|registration fee|release fee|clearance fee|refundable (fee|deposit)|pay (a |the )?(small |verification |security |clearance )?(fee|charge|charges|amount)|pay (rs\.?|₹|inr) ?\d+|deposit (rs\.?|₹|inr)|send (rs\.?|₹|inr) ?\d+|transfer (rs\.?|₹|inr)|scan (the |this )?qr|enter (your )?upi pin|accept (the )?collect request)\b`),
      g("शुल्क जमा|फीस भरें|पैसे भेजें|ফিচ জমা|টকা পঠিয়াওক"),
    ],
  },
  {
    kind: "reward",
    title: "Too good to be true",
    detail: "Prizes, lotteries, cashback or easy daily earnings you never applied for are bait.",
    weight: 20,
    examples: ["you have won", "lottery", "claim your cashback", "earn ₹3,000 daily"],
    words: [
      "you won", "you have won", "winner", "lottery", "lucky draw", "jackpot", "prize money", "KBC",
      "free gift", "free iPhone", "free laptop",
      "claim your prize", "claim reward", "claim your cashback", "claim refund", "reward points expire", "reward points will expire",
      "earn ₹3,000 daily", "earn 500 per day", "earn Rs 2000 a day", "earn ₹10,000 weekly",
      "work from home", "part-time job", "part time job", "like videos", "like YouTube videos", "daily task", "guaranteed returns",
      "लॉटरी", "इनाम", "आपने जीता",
      "লটাৰী", "পুৰস্কাৰ",
    ],
    patterns: [
      g(String.raw`\b(you (have )?won|winner|lottery|lucky draw|jackpot|prize money|kbc|free (gift|iphone|laptop)|claim (your )?(prize|reward|cashback|refund)|reward points (will )?expire|earn (rs\.?|₹)? ?\d[\d,]* ?(daily|per day|a day|weekly)|work from home|part[- ]time job|like (youtube )?videos|daily task|guaranteed returns?)\b`),
      g("लॉटरी|इनाम|आपने जीता|লটাৰী|পুৰস্কাৰ"),
    ],
  },
  {
    kind: "secrecy",
    title: "Keeping you isolated",
    detail: "“Don’t tell anyone” or “stay on the call” is a trick to stop you from checking with someone you trust.",
    weight: 20,
    examples: ["don’t tell anyone", "stay on the video call", "keep this secret"],
    words: [
      "don't tell anyone", "dont tell anybody", "don't tell your family", "do not tell anyone", "do not tell anybody",
      "keep this secret", "keep it confidential", "stay on the call", "stay on video call", "stay on the video call",
      "do not disconnect", "don't disconnect", "don't cut the call",
      "किसी को मत बताना", "किसी को न बताएं",
      "কাকো নক'ব",
    ],
    patterns: [
      g(String.raw`\b(don'?t tell (anyone|anybody|your family)|do not tell (anyone|anybody)|keep (this|it) (secret|confidential)|stay on (the )?(video )?call|do not disconnect|don'?t disconnect|don'?t cut the call)\b`),
      g("किसी को मत बताना|किसी को न बताएं|কাকো নক'ব"),
    ],
  },
  {
    kind: "remote_access",
    title: "Asking you to install an app",
    detail: "Apps like AnyDesk or TeamViewer, or an APK file, let a stranger see and control your phone.",
    weight: 30,
    examples: ["AnyDesk", "TeamViewer", "install this app", "update.apk"],
    words: [
      "AnyDesk", "TeamViewer", "QuickSupport", "Quick Support", "RustDesk", "AirDroid", "screen share", "screen sharing", "screenshare",
      "download this app", "install the app", "install our APK", "download my application", "update.apk",
    ],
    patterns: [g(String.raw`\b(anydesk|teamviewer|quick ?support|rustdesk|airdroid|screen ?shar(e|ing)|(download|install) (this|the|our|my) (app|apk|application)|\.apk)\b`)],
  },
  {
    kind: "family",
    title: "A “family member” on a new number",
    detail: "Scammers pretend to be your child or relative with a lost phone, then ask for money urgently.",
    weight: 25,
    examples: ["this is my new number", "my phone is broken", "hi maa, it’s me"],
    words: [
      "this is my new number", "new number, save it", "my phone is broken", "my old phone lost", "my phone damaged", "my phone is not working",
      "hi mom, it's me", "hi maa, it's me", "hi papa this is me", "hi mummy! it's me",
    ],
    patterns: [g(String.raw`\b(this is my new number|my (old )?phone (is )?(broken|lost|damaged|not working)|new number,? save it|hi (mom|mum|maa|dad|papa|mummy)[,!]? (it'?s|this is) me)\b`)],
  },
  {
    kind: "unofficial_contact",
    title: "Moving you to a private chat or number",
    detail: "Real companies don’t ask you to call a personal mobile number or continue on WhatsApp or Telegram.",
    weight: 15,
    examples: ["call our officer at 98765 43210", "join our Telegram"],
    words: [
      "call our officer at 98765 43210", "contact the executive on 9876543210", "call our bank manager at +91 98765 43210",
      "WhatsApp us at 98765 43210", "whatsapp me on", "WhatsApp us on",
      "join our Telegram", "join Telegram", "Telegram group", "Telegram channel",
    ],
    patterns: [
      g(String.raw`\b((call|contact|whats ?app) (our |the )?(\w+ )?(officer|executive|agent|manager|us|me) (on|at)\s*(\+?91[ -]?)?[6-9]\d{4} ?\d{5}|join (our )?telegram|telegram (group|channel)|whats ?app (me|us) (on|at))\b`),
    ],
  },
];

/**
 * Words that show a text is *about* scams — advice, news, a bank's safety page — rather than a
 * scam itself. Scam messages never tell you to call 1930, change your password, or report them.
 * "fraud"/"fraudulent" are left out on purpose: real scams say "fraudulent activity on your account".
 */
export const ABOUT_SCAMS: RegExp[] = [
  /\b(scams?|scammers?|scammed|fraudsters?|cyber ?crimes?|cybercrime\.gov\.in|phishing|1930|victims?|beware|be alert|stay (safe|alert|vigilant)|red flags?|warning signs?)\b/i,
  /\b(never|do not|don'?t) (share|click|tap|install|give|pay|scan|reply|respond|call back)\b/i,
  /\bif you (have |had )?(already )?(shared|gave|given|installed|clicked|tapped|fell|lost|paid|sent|downloaded|received|get|got)\b/i,
  /\b(change|reset) your (\w+ ){0,2}(password|pin|passcode)\b|\b(block|freeze) your (card|account|upi)\b|\buninstall\b|\bfactory reset\b/i,
  /\b(report (it|this|them|the (fraud|number|incident|message)|to (the )?(police|bank|cyber))|how to (spot|avoid|identify|protect|stay|recogni[sz]e)|fraud (alert|awareness|prevention)|safe banking|awareness)\b/i,
  /साइबर अपराध|धोखेबाज़|धोखेबाज|ठगी से बचें|সাইবাৰ অপৰাধ|প্ৰতাৰকৰ পৰা সাৱধান/,
  // Fact-checks and news about fakes (BOOM, Alt News, PIB Fact Check…) describe misinformation; they aren't scams.
  /\b(fact[- ]?check(ed|ing)?|misinformation|disinformation|digitally (altered|edited|manipulated)|morphed|debunk(ed|s)?|fake news|viral (claim|video|image|post))\b/i,
];
/** A scam message pretending to be safe ("100% genuine, not a scam") doesn't count as advice. */
export const FAKE_REASSURANCE = /\b(not a scam|no scam|100% (genuine|real|legit)|this is (genuine|legit))\b/i;

/** Phrases that mark a genuine OTP delivery rather than a request for one. */
export const OTP_DELIVERY = /\b(do not|don'?t|never) share\b|\bis your (otp|one[- ]time password|verification code)\b|किसी के साथ साझा न करें|কাকো নজনাব/i;
