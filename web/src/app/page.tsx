"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { signout } from "@/app/auth/actions";
import {
  SlidersHorizontal,
  Heart,
  User,
  Menu,
  Search,
} from "lucide-react";

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
import type { SearchCriteria, Website, SearchOptions } from "@/lib/types";
import { SearchService } from "@/lib/services/search-service";
import {
  PRICE_OPTIONS,
  RADIUS_OPTIONS,
  SORT_OPTIONS,
  YEAR_OPTIONS,
  MILEAGE_OPTIONS,
} from "@/lib/constants";

const DEFAULT_CRITERIA: SearchCriteria = {
  postcode: "EC1A 1BB",
  limit: 12,
  radius: 25,
  sort: "most-recent",
  sellerType: "private",
  sources: ["autotrader", "ebay", "gumtree"],
};

const SOURCE_OPTIONS: { label: string; value: Website }[] = [
  { label: "AutoTrader", value: "autotrader" },
  { label: "eBay", value: "ebay" },
  { label: "Gumtree", value: "gumtree" },
];

export default function HomePage() {
  const router = useRouter();
  const [criteria, setCriteria] = useState<SearchCriteria>({
    ...DEFAULT_CRITERIA,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOptions | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const options = await SearchService.getInstance().getSearchOptions();
        setSearchOptions(options);
      } catch (error) {
        console.error("Failed to fetch search options:", error);
      }
    };
    fetchOptions();
  }, []);

  const modelOptions = useMemo(() => {
    if (!searchOptions?.models) return [];
    if (!criteria.make) return [];
    
    const selectedMakeOption = searchOptions.makes.find(m => m.value === criteria.make);
    if (!selectedMakeOption?.id) return [];

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!criteria.postcode) {
      // Optionally show an error toast here
      alert("Please provide a postcode before searching.");
      return;
    }

    const queryString = encodeURIComponent(JSON.stringify(criteria));
    router.push(`/search?criteria=${queryString}`);
  };

  const handleReset = () => {
    setCriteria({ ...DEFAULT_CRITERIA });
    setShowAdvanced(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans">
      {/* Header */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a
              href="#"
              className="text-2xl font-bold text-[#E60012] tracking-tighter"
            >
              AutoTrader
            </a>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="#" className="text-slate-900 font-semibold">
                Cars
              </a>
              <a href="#" className="hover:text-[#E60012] transition-colors">
                Vans
              </a>
              <a href="#" className="hover:text-[#E60012] transition-colors">
                Bikes
              </a>
              <a href="#" className="hover:text-[#E60012] transition-colors">
                Motorhomes
              </a>
              <a href="#" className="hover:text-[#E60012] transition-colors">
                Caravans
              </a>
              <a href="#" className="hover:text-[#E60012] transition-colors">
                Trucks
              </a>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <div className="flex flex-col items-center gap-1 hover:text-[#E60012] cursor-pointer transition-colors">
              <Heart className="w-5 h-5" />
              <span className="text-[10px]">Saved</span>
            </div>
            {user ? (
              <Link
                href="/dashboard"
                className="flex flex-col items-center gap-1 hover:text-[#E60012] cursor-pointer transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="text-[10px]">Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex flex-col items-center gap-1 hover:text-[#E60012] cursor-pointer transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="text-[10px]">Sign In</span>
              </Link>
            )}
            <div className="md:hidden">
              <Menu className="w-6 h-6" />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#E60012] text-white relative overflow-hidden min-h-[500px] flex items-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-multiply pointer-events-none"></div>
        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-6 max-w-xl flex-1">
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wider shadow-sm">
              New Arrival
            </div>
            <div>
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none drop-shadow-md">
                WIN
              </h1>
              <h2 className="text-3xl md:text-5xl font-bold mt-2 drop-shadow-sm">
                Alfa Romeo Junior Speciale
              </h2>
              <p className="text-xl md:text-3xl opacity-90 font-medium mt-2">
                worth £35,705
              </p>
            </div>
            <Button className="bg-white text-[#E60012] hover:bg-slate-100 rounded-full px-8 py-7 text-xl font-bold shadow-lg border-2 border-transparent hover:border-white/50 transition-all">
              Enter on App
            </Button>
            <p className="text-xs opacity-70 max-w-xs">
              Entrants must be 17+ and a resident of the UK. Closing date
              30/11/25. Other T&Cs apply.
            </p>
          </div>
          {/* Car Image Placeholder */}
          <div className="hidden md:block flex-1 h-[400px] relative">
            <Image
              src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1000&auto=format&fit=crop"
              alt="Car"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl shadow-2xl p-1">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-4 md:p-6 rounded-[1.4rem] border border-slate-100"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
              {/* Postcode */}
              <div className="w-full lg:flex-1 space-y-2">
                <Label
                  htmlFor="postcode"
                  className="text-sm font-bold text-slate-700 pl-1"
                >
                  Postcode
                </Label>
                <div className="relative">
                  <Input
                    id="postcode"
                    placeholder="e.g. EC1A 1BB"
                    value={criteria.postcode ?? ""}
                    onChange={handleInput("postcode")}
                    required
                    className="h-12 rounded-xl border-slate-300 pl-10 bg-slate-50 focus:bg-white focus:ring-[#E60012] transition-all text-base"
                  />
                  <div className="absolute left-3 top-3.5 text-slate-400">
                    <Search className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Make */}
              <div className="w-full lg:flex-1 space-y-2">
                <Label
                  htmlFor="make"
                  className="text-sm font-bold text-slate-700 pl-1"
                >
                  Make
                </Label>
                <Select
                  value={criteria.make ?? undefined}
                  onValueChange={handleMakeChange}
                >
                  <SelectTrigger
                    id="make"
                    className="h-12 rounded-xl border-slate-300 bg-slate-50 focus:bg-white focus:ring-[#E60012] text-base"
                  >
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
              <div className="w-full lg:flex-1 space-y-2">
                <Label
                  htmlFor="model"
                  className="text-sm font-bold text-slate-700 pl-1"
                >
                  Model
                </Label>
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
                  <SelectTrigger
                    id="model"
                    className="h-12 rounded-xl border-slate-300 bg-slate-50 focus:bg-white focus:ring-[#E60012] text-base"
                  >
                    <SelectValue
                      placeholder={
                        criteria.make ? "Any model" : "Select make first"
                      }
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

              {/* Submit Button */}
              <div className="w-full lg:w-auto">
                <Button
                  type="submit"
                  className="w-full lg:w-auto h-12 rounded-full bg-[#E60012] hover:bg-[#be000f] text-white px-8 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <span className="mr-2">Search</span>{" "}
                  <span className="bg-white/20 rounded px-1.5 py-0.5 text-xs font-normal">
                    4,000+ cars
                  </span>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[#E60012] hover:text-[#be000f] hover:bg-red-50 px-2 rounded-lg font-medium"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {showAdvanced ? "Hide advanced options" : "More options"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                className="text-slate-500 hover:text-slate-700 px-2"
              >
                Reset all
              </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4">
                {/* Sources */}
                <div className="space-y-2 lg:col-span-4">
                  <Label>Sources</Label>
                  <div className="flex gap-2 flex-wrap">
                    {SOURCE_OPTIONS.map((source) => {
                      const isSelected =
                        !criteria.sources ||
                        criteria.sources.length === 0 ||
                        criteria.sources.includes(source.value);
                      return (
                        <Button
                          type="button"
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

                <div className="space-y-2">
                  <Label htmlFor="bodyType">Body type</Label>
                  <Select
                    value={criteria.bodyType ?? undefined}
                    onValueChange={handleSelectString("bodyType")}
                  >
                    <SelectTrigger id="bodyType" className="rounded-lg">
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
                <div className="space-y-2">
                  <Label htmlFor="radius">Radius</Label>
                  <Select
                    value={
                      criteria.radius !== undefined
                        ? String(criteria.radius)
                        : undefined
                    }
                    onValueChange={handleSelectNumber("radius")}
                  >
                    <SelectTrigger id="radius" className="rounded-lg">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {RADIUS_OPTIONS.map((radius) => (
                        <SelectItem key={radius} value={String(radius)}>
                          {radius} miles
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minYear">Min year</Label>
                  <Select
                    value={
                      criteria.minYear ? String(criteria.minYear) : undefined
                    }
                    onValueChange={handleSelectNumber("minYear")}
                  >
                    <SelectTrigger id="minYear" className="rounded-lg">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {YEAR_OPTIONS.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxYear">Max year</Label>
                  <Select
                    value={
                      criteria.maxYear ? String(criteria.maxYear) : undefined
                    }
                    onValueChange={handleSelectNumber("maxYear")}
                  >
                    <SelectTrigger id="maxYear" className="rounded-lg">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {YEAR_OPTIONS.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceFrom">Price from (£)</Label>
                  <Select
                    value={
                      criteria.minPrice ? String(criteria.minPrice) : undefined
                    }
                    onValueChange={handleSelectNumber("minPrice")}
                  >
                    <SelectTrigger id="priceFrom" className="rounded-lg">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {PRICE_OPTIONS.map((price) => (
                        <SelectItem key={price} value={String(price)}>
                          £{price.toLocaleString("en-GB")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceTo">Price to (£)</Label>
                  <Select
                    value={
                      criteria.maxPrice ? String(criteria.maxPrice) : undefined
                    }
                    onValueChange={handleSelectNumber("maxPrice")}
                  >
                    <SelectTrigger id="priceTo" className="rounded-lg">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {PRICE_OPTIONS.map((price) => (
                        <SelectItem key={price} value={String(price)}>
                          £{price.toLocaleString("en-GB")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileageFrom">Mileage from</Label>
                  <Select
                    value={
                      criteria.minMileage
                        ? String(criteria.minMileage)
                        : undefined
                    }
                    onValueChange={handleSelectNumber("minMileage")}
                  >
                    <SelectTrigger id="mileageFrom" className="rounded-lg">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {MILEAGE_OPTIONS.map((mileage) => (
                        <SelectItem key={mileage} value={String(mileage)}>
                          {mileage.toLocaleString("en-GB")} miles
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileageTo">Mileage to</Label>
                  <Select
                    value={
                      criteria.maxMileage
                        ? String(criteria.maxMileage)
                        : undefined
                    }
                    onValueChange={handleSelectNumber("maxMileage")}
                  >
                    <SelectTrigger id="mileageTo" className="rounded-lg">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {MILEAGE_OPTIONS.map((mileage) => (
                        <SelectItem key={mileage} value={String(mileage)}>
                          {mileage.toLocaleString("en-GB")} miles
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel type</Label>
                  <Select
                    value={criteria.fuelType ?? undefined}
                    onValueChange={handleSelectString("fuelType")}
                  >
                    <SelectTrigger id="fuelType" className="rounded-lg">
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
                <div className="space-y-2">
                  <Label htmlFor="transmission">Transmission</Label>
                  <Select
                    value={
                      criteria.transmissions?.[0]
                        ? criteria.transmissions[0]
                        : undefined
                    }
                    onValueChange={handleTransmissionChange}
                  >
                    <SelectTrigger id="transmission" className="rounded-lg">
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
                <div className="space-y-2">
                  <Label htmlFor="sellerType">Seller</Label>
                  <Select
                    value={criteria.sellerType ?? undefined}
                    onValueChange={handleSelectString("sellerType")}
                  >
                    <SelectTrigger id="sellerType" className="rounded-lg">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="trade">Dealer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doors">Doors</Label>
                  <Select
                    value={criteria.doors ? String(criteria.doors) : undefined}
                    onValueChange={handleSelectNumber("doors")}
                  >
                    <SelectTrigger id="doors" className="rounded-lg">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {searchOptions?.doors
                        .filter((door) => door.value !== "any")
                        .map((door) => (
                        <SelectItem key={door.value} value={String(door.value)}>
                          {door.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seats">Seats</Label>
                  <Select
                    value={criteria.seats ? String(criteria.seats) : undefined}
                    onValueChange={handleSelectNumber("seats")}
                  >
                    <SelectTrigger id="seats" className="rounded-lg">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {searchOptions?.seats
                        .filter((seat) => seat.value !== "any")
                        .map((seat) => (
                        <SelectItem key={seat.value} value={String(seat.value)}>
                          {seat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sort">Sort by</Label>
                  <Select
                    value={criteria.sort ?? undefined}
                    onValueChange={handleSelectString("sort")}
                  >
                    <SelectTrigger id="sort" className="rounded-lg">
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
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
