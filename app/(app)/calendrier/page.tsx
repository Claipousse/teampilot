import CalendrierDesktop from './CalendrierDesktop';
import CalendrierMobile from './CalendrierMobile';

export default function CalendrierPage() {
  return (
    <>
      <div className="hidden lg:block h-full">
        <CalendrierDesktop />
      </div>
      <div className="lg:hidden">
        <CalendrierMobile />
      </div>
    </>
  );
}