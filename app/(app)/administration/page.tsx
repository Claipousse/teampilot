import DashboardDesktop from './DashboardDesktop';
import DashboardMobile from './DashboardMobile';

export default function DashboardPage() {
  return (
    <>
      <div className="hidden lg:block h-full">
        <DashboardDesktop />
      </div>
      <div className="lg:hidden">
        <DashboardMobile />
      </div>
    </>
  );
}