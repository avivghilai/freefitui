import type { ReactNode } from "react";

interface SplitViewProps {
  list: ReactNode;
  map: ReactNode;
}

export default function SplitView({ list, map }: SplitViewProps) {
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] mt-16">
      {/* List panel */}
      <div className="order-2 lg:order-1 flex-1 lg:flex-none lg:w-[40%] overflow-y-auto border-l border-stone-200 bg-stone-50">
        {list}
      </div>
      {/* Map panel */}
      <div className="order-1 lg:order-2 h-[50vh] lg:h-auto shrink-0 lg:flex-1 relative bg-stone-100">
        {map}
      </div>
    </div>
  );
}
