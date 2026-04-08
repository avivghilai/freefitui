import type { ReactNode } from "react";

interface SplitViewProps {
  list: ReactNode;
  map: ReactNode;
}

export default function SplitView({ list, map }: SplitViewProps) {
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] mt-16">
      {/* List panel */}
      <div className="order-2 lg:order-1 flex-1 lg:flex-none lg:w-[38%] xl:w-[35%] overflow-y-auto bg-warm-50 smooth-scroll">
        {list}
      </div>
      {/* Drag handle (mobile only) */}
      <div className="order-1 lg:hidden flex justify-center items-center py-1.5 bg-warm-50 border-b border-warm-200/40">
        <div className="w-10 h-1 rounded-full bg-warm-200" />
      </div>
      {/* Map panel */}
      <div className="order-1 lg:order-2 h-[35vh] lg:h-auto shrink-0 lg:flex-1 relative">
        {map}
      </div>
    </div>
  );
}
