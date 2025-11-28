import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Slider } from "@/components/ui/slider";
import { SORT_OPTIONS } from "@/lib/constants";
import type { SearchCriteria, Website, SearchOptions, SearchOption } from "@/lib/types";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCriteria: SearchCriteria;
  onApply: (criteria: SearchCriteria) => void;
  searchOptions?: SearchOptions;
}

const SOURCE_OPTIONS: { label: string; value: Website }[] = [
  { label: "AutoTrader", value: "autotrader" },
  { label: "eBay", value: "ebay" },
  { label: "Gumtree", value: "gumtree" },
];

export function FilterModal({
  isOpen,
  onClose,
  initialCriteria,
  onApply,
  searchOptions,
}: FilterModalProps) {
  const [criteria, setCriteria] = useState<SearchCriteria>(initialCriteria);

  // Initialize slider states
  const [yearRange, setYearRange] = useState([
    criteria.minYear ?? 1990,
    criteria.maxYear ?? new Date().getFullYear(),
  ]);
  const [priceRange, setPriceRange] = useState([
    criteria.minPrice ?? 0,
    criteria.maxPrice ?? 100000,
  ]);
  const [mileageRange, setMileageRange] = useState([
    criteria.minMileage ?? 0,
    criteria.maxMileage ?? 200000,
  ]);

  const modelOptions = useMemo(() => {
    if (!searchOptions?.models) return [];
    if (!criteria.make) return [];
    
    // Find the selected make object to get its ID
    const selectedMakeOption = searchOptions.makes.find(m => m.value === criteria.make);
    if (!selectedMakeOption?.id) return [];

    // Filter models by make_id
    return searchOptions.models.filter(model => model.make_id === selectedMakeOption.id);
  }, [criteria.make, searchOptions]);

  const handleInput =
    (field: keyof SearchCriteria) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setCriteria((prev) => ({
        ...prev,
        [field]: value.trim() === "" ? undefined : value,
      }));
    };

  const handleMakeChange = (value: string) => {
    setCriteria((prev) => ({
      ...prev,
      make: value === "any" ? undefined : value,
      model: undefined,
    }));
  };

  const handleSelectNumber =
    (
      field: keyof SearchCriteria,
      options?: {
        allowFloat?: boolean;
      }
    ) =>
    (value: string) => {
      if (value === "any") {
        setCriteria((prev) => ({ ...prev, [field]: undefined }));
        return;
      }
      const parsed = options?.allowFloat
        ? parseFloat(value)
        : parseInt(value, 10);
      setCriteria((prev) => ({
        ...prev,
        [field]: Number.isNaN(parsed) ? undefined : parsed,
      }));
    };

  const handleSelectString =
    (field: keyof SearchCriteria) => (value: string) => {
      setCriteria((prev) => ({
        ...prev,
        [field]: value === "any" ? undefined : value,
      }));
    };

  const handleTransmissionChange = (value: string) => {
    setCriteria((prev) => ({
      ...prev,
      transmissions: value === "any" ? undefined : [value],
    }));
  };

  const toggleSource = (source: Website) => {
    setCriteria((prev) => {
      const current = prev.sources ?? [];
      if (current.includes(source)) {
        return { ...prev, sources: current.filter((s) => s !== source) };
      }
      return { ...prev, sources: [...current, source] };
    });
  };

  const handleApply = () => {
    onApply({
      ...criteria,
      minYear: yearRange[0],
      maxYear: yearRange[1],
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      minMileage: mileageRange[0],
      maxMileage: mileageRange[1],
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filter & Sort">
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sources */}
          <div className="space-y-2 md:col-span-3">
            <Label>Sources</Label>
            <div className="flex gap-2 flex-wrap">
              {SOURCE_OPTIONS.map((source) => {
                const isSelected =
                  !criteria.sources ||
                  criteria.sources.length === 0 ||
                  criteria.sources.includes(source.value);
                return (
                  <Button
                    key={source.value}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => toggleSource(source.value)}
                    className="h-8"
                  >
                    {source.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Postcode */}
          <div className="space-y-2">
            <Label htmlFor="modal-postcode">Postcode</Label>
            <div className="relative">
              <Input
                id="modal-postcode"
                placeholder="e.g. EC1A 1BB"
                value={criteria.postcode ?? ""}
                onChange={handleInput("postcode")}
                className="pl-9"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Make */}
          <div className="space-y-2">
            <Label htmlFor="modal-make">Make</Label>
            <Select
              value={criteria.make ?? undefined}
              onValueChange={handleMakeChange}
            >
              <SelectTrigger id="modal-make">
                <SelectValue placeholder="Any make" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any make</SelectItem>
                {searchOptions?.makes.map((make) => (
                  <SelectItem key={make.value} value={make.value}>
                    {make.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="modal-model">Model</Label>
            <Select
              value={criteria.model ?? undefined}
              onValueChange={(val) =>
                setCriteria((prev) => ({
                  ...prev,
                  model: val === "any" ? undefined : val,
                }))
              }
              disabled={!criteria.make}
            >
              <SelectTrigger id="modal-model">
                <SelectValue
                  placeholder={criteria.make ? "Any model" : "Select make first"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any model</SelectItem>
                {modelOptions.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Body Type */}
          <div className="space-y-2">
            <Label htmlFor="modal-bodyType">Body type</Label>
            <Select
              value={criteria.bodyType ?? undefined}
              onValueChange={handleSelectString("bodyType")}
            >
              <SelectTrigger id="modal-bodyType">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {searchOptions?.bodyTypes.map((body) => (
                  <SelectItem key={body.value} value={body.value}>
                    {body.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Range */}
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <div className="flex justify-between">
              <Label>Year Range</Label>
              <span className="text-sm text-slate-500">
                {yearRange[0]} - {yearRange[1]}
              </span>
            </div>
            <Slider
              min={1990}
              max={new Date().getFullYear()}
              step={1}
              value={yearRange}
              onValueChange={setYearRange}
              minStepsBetweenThumbs={1}
            />
          </div>

          {/* Price Range */}
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <div className="flex justify-between">
              <Label>Price Range (£)</Label>
              <span className="text-sm text-slate-500">
                £{priceRange[0].toLocaleString()} - £
                {priceRange[1].toLocaleString()}
              </span>
            </div>
            <Slider
              min={0}
              max={100000}
              step={500}
              value={priceRange}
              onValueChange={setPriceRange}
              minStepsBetweenThumbs={1}
            />
          </div>

          {/* Mileage Range */}
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <div className="flex justify-between">
              <Label>Mileage Range</Label>
              <span className="text-sm text-slate-500">
                {mileageRange[0].toLocaleString()} -{" "}
                {mileageRange[1].toLocaleString()} miles
              </span>
            </div>
            <Slider
              min={0}
              max={200000}
              step={1000}
              value={mileageRange}
              onValueChange={setMileageRange}
              minStepsBetweenThumbs={1}
            />
          </div>

          {/* Fuel Type */}
          <div className="space-y-2">
            <Label htmlFor="modal-fuelType">Fuel type</Label>
            <Select
              value={criteria.fuelType ?? undefined}
              onValueChange={handleSelectString("fuelType")}
            >
              <SelectTrigger id="modal-fuelType">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {searchOptions?.fuelTypes.map((fuel) => (
                  <SelectItem key={fuel.value} value={fuel.value}>
                    {fuel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transmission */}
          <div className="space-y-2">
            <Label htmlFor="modal-transmission">Transmission</Label>
            <Select
              value={
                criteria.transmissions?.[0]
                  ? criteria.transmissions[0]
                  : undefined
              }
              onValueChange={handleTransmissionChange}
            >
              <SelectTrigger id="modal-transmission">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {searchOptions?.transmissionTypes.map((transmission) => (
                  <SelectItem key={transmission.value} value={transmission.value}>
                    {transmission.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seller Type */}
          <div className="space-y-2">
            <Label htmlFor="modal-sellerType">Seller</Label>
            <Select
              value={criteria.sellerType ?? undefined}
              onValueChange={handleSelectString("sellerType")}
            >
              <SelectTrigger id="modal-sellerType">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="trade">Dealer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Doors */}
          <div className="space-y-2">
            <Label htmlFor="modal-doors">Doors</Label>
            <Select
              value={criteria.doors ? String(criteria.doors) : undefined}
              onValueChange={handleSelectNumber("doors")}
            >
              <SelectTrigger id="modal-doors">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {searchOptions?.doors
                  .filter((door) => door.value !== "any")
                  .map((door) => (
                  <SelectItem key={door.value} value={door.value}>
                    {door.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seats */}
          <div className="space-y-2">
            <Label htmlFor="modal-seats">Seats</Label>
            <Select
              value={criteria.seats ? String(criteria.seats) : undefined}
              onValueChange={handleSelectNumber("seats")}
            >
              <SelectTrigger id="modal-seats">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {searchOptions?.seats
                  .filter((seat) => seat.value !== "any")
                  .map((seat) => (
                  <SelectItem key={seat.value} value={seat.value}>
                    {seat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label htmlFor="modal-sort">Sort by</Label>
            <Select
              value={criteria.sort ?? undefined}
              onValueChange={handleSelectString("sort")}
            >
              <SelectTrigger id="modal-sort">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="bg-[#E60012] hover:bg-[#be000f] text-white"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </Modal>
  );
}
