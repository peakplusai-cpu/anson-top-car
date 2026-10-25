import { createCar } from "@/app/actions/cars";
import { CarForm } from "@/components/CarForm";

export default async function NewCarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <>
      <p className="engraved">New</p>
      <h1>新增車輛</h1>
      {error === "save" ? (
        <p className="flash">沒存成功。請再按一次；若還是失敗，稍後再試。</p>
      ) : null}
      <CarForm action={createCar} />
    </>
  );
}
