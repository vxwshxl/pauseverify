import { FAQ } from "@/lib/site";

/** Plain questions and answers — for people, and for answer engines (with FAQPage data in page.tsx). */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 border-t border-border">
      <div className="container-page grid gap-10 py-20 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div>
          <h2 id="faq-title" className="font-display text-[34px] font-semibold leading-tight sm:text-[42px]">Questions people ask</h2>
          <p className="mt-3 max-w-sm text-lg text-secondary-fg">Free, private, and it keeps working when the internet doesn’t.</p>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[18px] font-semibold">
                {q}
                <span aria-hidden className="grid size-8 flex-none place-items-center rounded-full border border-border text-lg transition-transform duration-200 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-2xl leading-relaxed text-secondary-fg">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
