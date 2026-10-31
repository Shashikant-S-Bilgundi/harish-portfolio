/** Scroll progress bar along the top, and the cursor ring that trails the pointer. */
export default function PageFx() {
  return (
    <>
      <div className="progress" aria-hidden="true"><span></span></div>
      <div className="cursor" aria-hidden="true"></div>
    </>
  );
}