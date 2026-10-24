import { ContactButtons } from "@/components/ContactButtons";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { InquiryPicker } from "@/components/InquiryPicker";
import { getSettings } from "@/lib/settings";
import { getPublishedCar, listPublicStaff } from "@/lib/store";

export const revalidate = 60;

export default async function InquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ car?: string }>;
}) {
  const { car: slug } = await searchParams;
  const [staff, settings, car] = await Promise.all([
    listPublicStaff(),
    getSettings(),
    slug ? getPublishedCar(slug) : Promise.resolve(undefined),
  ]);

  return (
    <>
      <Header />
      <main className="inquiry">
        <p className="engraved">Appointment</p>
        <h1>預約賞車</h1>
        <p className="inquiry-lead">
          {car
            ? `您正在詢問 ${car.make} ${car.year} ${car.model}。請由 LINE 或 Instagram 與我們聯繫，或選擇顧問開啟聊天室。`
            : "告訴我們想看的車款與方便時段。LINE、Instagram 皆可。"}
        </p>
        <ContactButtons lineUrl={settings.lineUrl} instagramUrl={settings.instagramUrl} />
        {staff.length ? (
          <div style={{ marginTop: 48 }}>
            <p className="engraved">或指定顧問</p>
            <InquiryPicker staff={staff} carLabel={car ? `${car.make} ${car.model}` : ""} />
          </div>
        ) : null}
      </main>
      <Footer staff={staff} />
    </>
  );
}
