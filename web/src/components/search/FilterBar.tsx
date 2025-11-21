import { Button } from "@/components/ui/button";
import { ChevronDown, Heart, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { FilterModal } from "./FilterModal";
import { SearchCriteria } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "make", label: "Make" },
  { key: "model", label: "Model" },
  { key: "price", label: "Price" },
  { key: "year", label: "Year" },
  { key: "mileage", label: "Mileage" },
  { key: "gearbox", label: "Gearbox" },
];

interface FilterBarProps {
  currentCriteria?: SearchCriteria;
  onApplyFilters?: (criteria: SearchCriteria) => void;
}

export function FilterBar({ currentCriteria, onApplyFilters }: FilterBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleApply = (newCriteria: SearchCriteria) => {
    if (onApplyFilters) {
      onApplyFilters(newCriteria);
    }
  };

  const getFilterState = (key: string) => {
    if (!currentCriteria) return { isActive: false, label: null };

    switch (key) {
      case "make":
        return {
          isActive: !!currentCriteria.make,
          label: currentCriteria.make,
        };
      case "model":
        return {
          isActive: !!currentCriteria.model,
          label: currentCriteria.model,
        };
      case "price":
        if (currentCriteria.minPrice || currentCriteria.maxPrice) {
          const min = currentCriteria.minPrice
            ? `£${currentCriteria.minPrice}`
            : "£0";
          const max = currentCriteria.maxPrice
            ? `£${currentCriteria.maxPrice}`
            : "Any";
          return { isActive: true, label: `${min} - ${max}` };
        }
        return { isActive: false, label: null };
      case "year":
        if (currentCriteria.minYear || currentCriteria.maxYear) {
          const min = currentCriteria.minYear || "Any";
          const max = currentCriteria.maxYear || "Any";
          return { isActive: true, label: `${min} - ${max}` };
        }
        return { isActive: false, label: null };
      case "mileage":
        if (currentCriteria.maxMileage) {
          return {
            isActive: true,
            label: `Up to ${currentCriteria.maxMileage} miles`,
          };
        }
        return { isActive: false, label: null };
      case "gearbox":
        if (
          currentCriteria.transmissions &&
          currentCriteria.transmissions.length > 0
        ) {
          return {
            isActive: true,
            label: currentCriteria.transmissions[0],
          };
        }
        return { isActive: false, label: null };
      default:
        return { isActive: false, label: null };
    }
  };

  return (
    <div className="w-full pb-4">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        {/* Mobile Top Row: Filter Button + Save Search (Optional on mobile, or icon) */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2 md:order-2">
          <Button
            variant="default"
            className="rounded-full h-10 bg-[#001B5B] text-white hover:bg-[#002680] px-6 flex-1 md:flex-none"
            onClick={handleOpenModal}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filter and sort
          </Button>
          <Button
            variant="ghost"
            className="h-10 text-[#E60012] hover:bg-red-50 rounded-full px-4 md:hidden"
          >
            <Heart className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:flex-1 md:order-1 pb-2 md:pb-0">
          {FILTERS.map((filter) => {
            const { isActive, label } = getFilterState(filter.key);
            return (
              <Button
                key={filter.key}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "rounded-full h-10 whitespace-nowrap px-5 transition-colors",
                  isActive
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent font-semibold"
                    : "border-slate-300 text-slate-700 font-medium bg-white hover:bg-slate-50"
                )}
                onClick={handleOpenModal}
              >
                {label || filter.label}
                {!isActive && (
                  <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
                )}
              </Button>
            );
          })}
        </div>

        {/* Desktop Save Search */}
        <div className="hidden md:block md:order-3">
          <Button
            variant="ghost"
            className="h-10 text-[#E60012] hover:bg-red-50 rounded-full px-4"
          >
            Save search
            <Heart className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {currentCriteria && (
        <FilterModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          initialCriteria={currentCriteria}
          onApply={handleApply}
        />
      )}
    </div>
  );
}
