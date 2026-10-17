export default function Preloader() {
  return (
    <div className="preloader" id="preloader" aria-hidden="true">
      <div className="preloader__panel preloader__panel--top"></div>
      <div className="preloader__panel preloader__panel--bottom"></div>
      <div className="preloader__inner">
        <svg className="preloader__mark" viewBox="0 0 132 80" fill="none">
          <path d="M8 8v64M8 40h40M48 8v64" />
          <path d="M68 72V8l28 40 28-40v64" />
        </svg>
        <p className="preloader__count mono"><span>0</span>%</p>
      </div>
    </div>
  );
}