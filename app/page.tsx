import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Intro } from "@/components/Intro";
import { HomeFinder } from "@/components/HomeFinder";
import { getSettings } from "@/lib/settings";
import { listPublishedCars, listPublicStaff } from "@/lib/store";

export const revalidate = 60;

export default async function HomePage() {
  const [published, staff, settings] = await Promise.all([
    listPublishedCars(),
    listPublicStaff(),
    getSettings(),
  ]);

  return (
    <>
      <Intro />
      <Header />
      <HomeFinder cars={published} lineUrl={settings.lineUrl} instagramUrl={settings.instagramUrl} />
      <Footer staff={staff} />
    </>
  );
}
