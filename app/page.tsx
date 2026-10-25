import { preload } from "react-dom";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Intro } from "@/components/Intro";
import { HomeFinder } from "@/components/HomeFinder";
import { getSettings } from "@/lib/settings";
import { listPublishedCars, listPublicStaff } from "@/lib/store";

export const revalidate = 60;

export default async function HomePage() {
  preload("/intro/logos.webp", { as: "image", fetchPriority: "high" });
  const [published, staff, settings] = await Promise.all([
    listPublishedCars(),
    listPublicStaff(),
    getSettings(),
  ]);

  return (
    <>
      <Intro />
      <Header />
      <HomeFinder
        cars={published}
        lineUrl={settings.lineUrl}
        instagramUrl={settings.instagramUrl}
        featuredVideoUrl={settings.featuredVideoUrl}
        featuredVideoCaption={settings.featuredVideoCaption}
      />
      <Footer staff={staff} settings={settings} />
    </>
  );
}
