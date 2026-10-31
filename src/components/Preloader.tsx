export default function Preloader() {
  return (
    <div className="preloader" id="preloader" aria-hidden="true">
      <p className="preloader__mark">HM<span>.</span></p>
      <p className="preloader__count"><span id="preCount">0</span></p>
    </div>
  );
}