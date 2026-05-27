import AdministrationDesktop from './AdministrationDesktop';
import AdministrationMobile from './AdministrationMobile';

export default function AdministrationPage() {
  return (
    <>
      <div className="hidden lg:block h-full">
        <AdministrationDesktop />
      </div>
      <div className="lg:hidden">
        <AdministrationMobile />
      </div>
    </>
  );
}