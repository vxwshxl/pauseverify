import type { Analysis } from "@pv/engine";
import { HELP } from "@pv/engine";

// Offline answers to the questions people actually ask after a scare. They are built from
// the analysis, so they work without a network; the AI layer takes over free-form questions.

export const SUGGESTIONS = ["Is this really from them?", "I already clicked the link", "I shared my OTP", "I sent money", "How do I report it?"];

export function localAnswer(q: string, a: Analysis): string | null {
  const s = q.toLowerCase();
  const who = a.claimedEntity?.name;
  const fake = a.flags.some((f) => f.kind === "impersonation");
  const bad = a.links.find((l) => l.verdict === "lookalike" || l.verdict === "suspicious" || l.verdict === "shortener");

  if (/(real|genuine|really|legit|fake|from (them|the bank|sbi|my bank))/.test(s)) {
    if (fake && who) {
      return `I don’t think so. It uses ${who}’s name, ${bad ? `but the link goes to ${bad.domain}, which ${who} doesn’t own` : "but asks for things they never ask for"}. ${
        a.claimedEntity?.app ? `If you want to be sure, open the ${a.claimedEntity.app} app yourself — anything real will show up there.` : "Contact them through their official website, typed in yourself."
      }`;
    }
    if (a.level === "safe") return `Nothing in it looks like a scam. ${who ? `If you’re still unsure, check directly in ${a.claimedEntity?.app ? `the ${a.claimedEntity.app} app` : `${who}’s official website`}.` : "If in doubt, contact the sender through a number or app you already trust."}`;
    return "It has the signs of a scam, so treat it as fake until you’ve checked through an official app or website you open yourself.";
  }
  if (/(click|tap|open)(ed)? (the )?link|i clicked|visited/.test(s)) {
    return "Close that page and don’t type anything into it. If you entered a password, change it from the official app now. If you entered card details, block the card from your bank app. Clicking alone is usually fine — it’s what you type that matters.";
  }
  if (/otp|pin|password|cvv|shared|gave/.test(s)) {
    return `Act now: block your card and UPI from your bank app or by calling the number printed on your card. Then call ${HELP.helpline} — the faster you report, the better the chance the money can be stopped. Change any password you shared.`;
  }
  if (/paid|sent (the )?money|transferred|lost money|money (is )?gone/.test(s)) {
    return `Call ${HELP.helpline} right away — it’s the national cyber-fraud helpline, and reporting within the first hours gives the best chance of freezing the money. Keep screenshots of the messages and the transaction ID. You can also file at ${HELP.portal}.`;
  }
  if (/report|complain|police|helpline/.test(s)) {
    return `Report it at ${HELP.portal} or call ${HELP.helpline}. You can report the scam number or SMS on ${HELP.reportSpam} (Chakshu), which helps get it blocked for everyone.`;
  }
  return null;
}
