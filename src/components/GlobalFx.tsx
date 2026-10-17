export default function GlobalFx() {
  return (
    <>
      <div className="grain" aria-hidden="true"></div>
      <div className="progress" aria-hidden="true"><span></span></div>
      <div className="cursor" aria-hidden="true">
        <div className="cursor__ring"><span className="cursor__label"></span></div>
        <div className="cursor__dot"></div>
      </div>
    </>
  );
}