import { createCar } from "@/app/actions/cars";
import { CarForm } from "@/components/CarForm";

export default function NewCarPage() {
  return (
    <>
      <p className="engraved">New</p>
      <h1>新增車輛</h1>
      <CarForm action={createCar} />
    </>
  );
}
