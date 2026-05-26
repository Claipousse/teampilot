import MessagerieDesktop from './MessagerieDesktop';
import MessagerieMobile from './MessagerieMobile';

export default function MessageriePage() {
  return (
    <>
      <div className="hidden lg:block h-full">
        <MessagerieDesktop />
      </div>
      <div className="lg:hidden">
        <MessagerieMobile />
      </div>
    </>
  );
}