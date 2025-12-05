"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Heart, User, Menu, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { SearchCriteria, Listing } from "@/lib/types";
import { SearchService } from "@/lib/services/search-service";
import { ListingCard } from "@/components/search/ListingCard";
import { FilterBar } from "@/components/search/FilterBar";
import { Button } from "@/components/ui/button";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCriteria, setCurrentCriteria] = useState<SearchCriteria>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchOptions, setSearchOptions] = useState<any>(null); // Using any for now to avoid import cycle or complex types, will fix types later

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const searchService = SearchService.getInstance();
        const options = await searchService.getSearchOptions();
        setSearchOptions(options);
      } catch (err) {
        console.error("Failed to fetch search options", err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      setListings([]);

      try {
        const criteriaParam = searchParams.get("criteria");
        if (!criteriaParam) {
          setLoading(false);
          return;
        }

        const criteria = JSON.parse(
          decodeURIComponent(criteriaParam)
        ) as SearchCriteria;
        
        // Ensure page is at least 1
        if (!criteria.page || criteria.page < 1) {
            criteria.page = 1;
        }

        setCurrentCriteria(criteria);

        const searchService = SearchService.getInstance();
        await searchService.search(criteria, (updatedListings) => {
          setListings(updatedListings);
          if (updatedListings.length > 0) {
            setLoading(false);
          }
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [searchParams]);

  const handleApplyFilters = (newCriteria: SearchCriteria) => {
      // Reset to page 1 when filters change
      const criteriaWithPage = { ...newCriteria, page: 1 };
      const queryString = encodeURIComponent(JSON.stringify(criteriaWithPage));
      router.push(`/search?criteria=${queryString}`);
  };

  const handlePageChange = (newPage: number) => {
      const newCriteria = { ...currentCriteria, page: newPage };
      const queryString = encodeURIComponent(JSON.stringify(newCriteria));
      router.push(`/search?criteria=${queryString}`);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && listings.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-motovotive-red" />
        <p className="mt-4 text-slate-500 font-medium font-mono animate-pulse">
          SCANNING MARKETPLACE...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="bg-red-50 p-6 rounded-full mb-4 animate-bounce">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-display">
          Something went wrong
        </h2>
        <p className="text-slate-500 mt-2 max-w-md">{error}</p>
      </div>
    );
  }

  const handleRecommendedSearch = (make: string, model: string) => {
    const newCriteria: SearchCriteria = {
      make,
      model,
      page: 1,
      sort: "most-recent"
    };
    const queryString = encodeURIComponent(JSON.stringify(newCriteria));
    router.push(`/search?criteria=${queryString}`);
  };

  if (!loading && listings.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-6 rounded-full mb-6 shadow-inner">
          <Search className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2 font-display">
          No results found
        </h2>
        <p className="text-slate-500 mb-8 max-w-md">
          We couldn&apos;t find any cars matching your criteria. Try adjusting your filters or check out these popular searches:
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => handleRecommendedSearch("BMW", "3 Series")}
            className="hover:border-motovotive-red hover:text-motovotive-red rounded-full px-6 font-bold"
          >
            BMW 3 Series
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleRecommendedSearch("Audi", "A3")}
            className="hover:border-motovotive-red hover:text-motovotive-red rounded-full px-6 font-bold"
          >
            Audi A3
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleRecommendedSearch("Mercedes-Benz", "C Class")}
            className="hover:border-motovotive-red hover:text-motovotive-red rounded-full px-6 font-bold"
          >
            Mercedes-Benz C Class
          </Button>
        </div>
      </div>
    );
  }

  const currentPage = currentCriteria.page || 1;

  return (
    <div className="space-y-6">
      <FilterBar 
        currentCriteria={currentCriteria} 
        onApplyFilters={handleApplyFilters} 
        searchOptions={searchOptions}
      />

      <div className="flex items-center justify-between">
        {/* Removed Result Count */}
        <div /> 
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-display">Sorted by Relevance</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {listings.map((listing) => (
          <ListingCard key={listing.listingId} listing={listing} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 pt-8 pb-4">
          <Button
            variant="outline"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || loading}
            className="flex items-center gap-2 rounded-full hover:bg-slate-100 hover:text-motovotive-red"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <span className="text-base font-bold text-slate-900 font-mono">
              {currentPage}
          </span>

          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={loading || listings.length === 0} // Disable next if no results (or maybe we reached end)
            className="flex items-center gap-2 rounded-full hover:bg-slate-100 hover:text-motovotive-red"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans selection:bg-motovotive-red selection:text-white">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link
              href="/"
              className="flex items-center gap-1 group"
            >
              <span className="text-2xl font-black text-motovotive-red tracking-tighter transition-all duration-300 group-hover:tracking-normal">
                MOTOVOTIVE
              </span>
              <div className="w-2.5 h-2.5 rounded-full bg-motovotive-orange mt-2 animate-pulse" />
            </Link>
            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 font-display uppercase tracking-wider">
              <Link href="/" className="hover:text-motovotive-red transition-colors relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-0 after:h-0.5 after:bg-motovotive-red after:transition-all hover:after:w-full">
                Home
              </Link>
              <span className="text-motovotive-red cursor-default">Used cars</span>
              <Link href="#" className="hover:text-motovotive-red transition-colors relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-0 after:h-0.5 after:bg-motovotive-red after:transition-all hover:after:w-full">
                New cars
              </Link>
              <Link href="#" className="hover:text-motovotive-red transition-colors relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-0 after:h-0.5 after:bg-motovotive-red after:transition-all hover:after:w-full">
                Sell
              </Link>
              <Link href="#" className="hover:text-motovotive-red transition-colors relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-0 after:h-0.5 after:bg-motovotive-red after:transition-all hover:after:w-full">
                Valuation
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <div className="hidden sm:flex flex-col items-center gap-0.5 hover:text-motovotive-red cursor-pointer transition-colors group">
              <Heart className="w-5 h-5 group-hover:fill-current group-hover:animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wide">Saved</span>
            </div>
            <Link href="/login" className="flex flex-col items-center gap-0.5 hover:text-motovotive-red cursor-pointer transition-colors group">
              <User className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wide">Sign In</span>
            </Link>
            <div className="md:hidden">
              <Menu className="w-6 h-6 hover:text-motovotive-red cursor-pointer" />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-motovotive-red" />
            <p className="mt-4 text-slate-500 font-medium font-mono">LOADING...</p>
          </div>
        }>
          <SearchContent />
        </Suspense>
      </main>
    </div>
  );
}
