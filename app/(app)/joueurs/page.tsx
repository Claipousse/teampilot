import JoueursDesktop from './JoueursDesktop';
import JoueursMobile from './JoueursMobile';

export default function JoueursPage() {
  return (
    <>
      <div className="hidden lg:block h-full">
        <JoueursDesktop />
      </div>
      <div className="lg:hidden">
        <JoueursMobile />
      </div>
    </>
  );
}