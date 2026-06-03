import JoueursDesktop from './JoueursDesktop';
import JoueursMobile from './JoueursMobile';

export default async function JoueursPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const params = await searchParams;
  const openCreate = params?.new === 'true';

  return (
    <>
      <div className="hidden lg:block h-full">
        <JoueursDesktop openCreate={openCreate} />
      </div>
      <div className="lg:hidden">
        <JoueursMobile openCreate={openCreate} />
      </div>
    </>
  );
}
