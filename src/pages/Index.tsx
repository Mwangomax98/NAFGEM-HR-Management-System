import { HRLayout } from "@/components/hr/HRLayout";
import { Outlet } from "react-router-dom";

const Index = () => {
  return (
    <HRLayout>
      <Outlet />
    </HRLayout>
  );
};

export default Index;
