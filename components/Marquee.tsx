const WORDS = ["Bryan's Garage", "Taichung", "By Appointment", "預約鑑賞"];

export function Marquee() {
  const run = WORDS.map((word) => (
    <span key={word}>
      <b>/</b>
      {word}
    </span>
  ));

  return (
    <div className="marquee" aria-hidden>
      <div className="marquee-track">
        {run}
        {run}
        {run}
        {run}
      </div>
    </div>
  );
}
