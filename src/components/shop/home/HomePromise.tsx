const STEPS: { title: string; body: string }[] = [
  {
    title: "Choose Your Size",
    body: "Pick the size that fits you best, every piece is then made to that size, never pulled ready-made off a rack.",
  },
  {
    title: "Stitched by hand",
    body: "Each piece is cut, embroidered, and finished by hand, with no two seams or fits alike.",
  },
  {
    title: "Sent when it’s right",
    body: "It ships only when the finishing meets our standard, made once, for the person wearing it.",
  },
];

export default function HomePromise() {
  return (
    <section className="mx-auto max-w-full px-4 pt-16 text-center md:px-8 md:py-24">
      <span className="border-rose-gold mb-6 inline-block w-15 border-t-2 border-dashed" />
      <blockquote className="font-serif-alt mx-auto max-w-3xl text-2xl leading-relaxed tracking-wide text-balance italic md:text-4xl">
        “There’s no mass production here. What you order is what gets made
        measured to you, stitched with intention, and sent out only when it’s
        right.”
      </blockquote>
      <p className="label-caps text-rose-gold mt-7 text-[0.7rem]">
        The shreeforstree promise
      </p>
      <div className="bg-ink-08 mx-auto mt-14 grid gap-px md:max-w-[90%] md:grid-cols-3">
        {STEPS.map((step, index) => (
          <div key={index} className="bg-paper p-7 text-left md:p-10">
            <p className="font-display text-rose-gold text-xl font-bold">
              0{index + 1}
            </p>
            <h3 className="font-display text-ink mt-4 text-2xl font-bold">
              {step.title}
            </h3>
            <p className="text-ink-55 mt-3 text-base leading-relaxed tracking-wide">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
