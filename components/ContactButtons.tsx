export function ContactButtons({
  lineUrl,
  instagramUrl,
  inverted = false,
}: {
  lineUrl: string;
  instagramUrl: string;
  inverted?: boolean;
}) {
  const ghost = inverted ? "btn btn-ig" : "btn btn-ghost btn-ig";
  return (
    <div className="contact-row">
      {lineUrl ? (
        <a className="btn btn-line" href={lineUrl} target="_blank" rel="noopener noreferrer">
          LINE 諮詢
        </a>
      ) : null}
      {instagramUrl ? (
        <a className={ghost} href={instagramUrl} target="_blank" rel="noopener noreferrer">
          Instagram
        </a>
      ) : null}
    </div>
  );
}
