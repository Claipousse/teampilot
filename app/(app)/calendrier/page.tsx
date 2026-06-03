import CalendrierDesktop from './CalendrierDesktop';
import CalendrierMobile from './CalendrierMobile';

export default async function CalendrierPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const params = await searchParams;
  const openCreate = params?.new === 'true';

  return (
    <>
      <div className="hidden lg:block h-full">
        <CalendrierDesktop openCreate={openCreate} />
      </div>
      <div className="lg:hidden">
        <CalendrierMobile openCreate={openCreate} />
      </div>
    </>
  );
}
