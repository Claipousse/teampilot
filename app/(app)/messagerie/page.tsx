import MessagerieDesktop from './MessagerieDesktop';
import MessagerieMobile from './MessagerieMobile';

export default async function MessageriePage({
  searchParams,
}: {
  searchParams: Promise<{ convId?: string }>;
}) {
  const params = await searchParams;
  const openConvId = params?.convId ? parseInt(params.convId) : undefined;

  return (
    <>
      <div className="hidden lg:block h-full">
        <MessagerieDesktop openConvId={openConvId} />
      </div>
      <div className="lg:hidden">
        <MessagerieMobile openConvId={openConvId} />
      </div>
    </>
  );
}
