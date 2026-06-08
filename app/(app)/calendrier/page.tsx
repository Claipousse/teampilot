import CalendrierDesktop from './CalendrierDesktop';
import CalendrierMobile from './CalendrierMobile';

export default async function CalendrierPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; eventId?: string }>;
}) {
  const params = await searchParams;
  const openCreate = params?.new === 'true';
  const openEventId = params?.eventId ? parseInt(params.eventId) : undefined;

  return (
    <>
      <div className="hidden lg:block h-full">
        <CalendrierDesktop openCreate={openCreate} openEventId={openEventId} />
      </div>
      <div className="lg:hidden">
        <CalendrierMobile openCreate={openCreate} openEventId={openEventId} />
      </div>
    </>
  );
}
