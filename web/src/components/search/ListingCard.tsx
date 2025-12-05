
import { memo, useMemo } from "react";
import Image from "next/image";
import { Heart, MapPin, ScanEye } from "lucide-react";
import { ListingViewModel } from "@/view-models/ListingViewModel";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Listing } from "@/lib/types";

interface ListingCardProps {
  listing: Listing;
  className?: string;
}

export const ListingCard = memo(function ListingCard({ listing, className }: ListingCardProps) {
  const viewModel = useMemo(() => new ListingViewModel(listing), [listing]);
  const rating = viewModel.priceRating;
  const isAnalyzing = viewModel.isAnalyzing;

  return (
    <div
      className={cn(
        "group flex flex-col rounded-xl bg-card shadow-sm border border-border hover:shadow-lg transition-all overflow-hidden h-full relative hover-lift",
        className
      )}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {viewModel.imageUrl ? (
          <Image
            src={viewModel.imageUrl}
            alt={viewModel.title}
            fill
            className={cn(
              "object-cover transition-transform duration-500",
              isAnalyzing ? "opacity-80" : "group-hover:scale-105"
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground bg-secondary/50">
            <span className="text-xs font-medium">No Image</span>
          </div>
        )}

        {/* Analyzing Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
            <div className="bg-black/80 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1.5 font-medium backdrop-blur-md border border-white/20 animate-pulse">
              <ScanEye className="w-3 h-3" />
              <span>SCANNING PLATE</span>
            </div>
          </div>
        )}

        {/* Seller Badge */}
        {viewModel.sellerType && (
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md text-motovotive-carbon-black shadow-sm border border-white/50 font-display">
              {viewModel.sellerType}
            </span>
          </div>
        )}

        {/* Heart Button */}
        <button className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white text-muted-foreground hover:text-motovotive-red transition-colors shadow-sm">
          <Heart className="w-4 h-4" />
        </button>

        {/* Image Count (Mock) */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-[2px] text-white text-[10px] px-1.5 py-0.5 rounded font-medium font-mono">
          1/1
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-motovotive-red uppercase tracking-wider font-display">
              {viewModel.website}
            </span>
          </div>
          <h3 className="font-bold text-lg text-foreground line-clamp-1 leading-tight font-display group-hover:text-motovotive-red transition-colors">
            {viewModel.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5 font-sans">
            {viewModel.subtitle}
          </p>
        </div>

        {/* Specs Tags */}
        <div className="flex flex-wrap gap-2 min-h-[24px]">
          {isAnalyzing ? (
            <div className="flex items-center gap-2 w-full">
              <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-motovotive-red w-2/3 animate-[shimmer_1s_infinite]" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground animate-pulse font-mono">
                Valuating...
              </span>
            </div>
          ) : (
            <>
              {rating && (
                <Badge
                  variant={rating.type === "great" ? "success" : rating.type === "good" ? "success" : rating.type === "fair" ? "info" : "warning"}
                  className="rounded-md text-[10px] font-bold uppercase tracking-wide border-0"
                >
                  {rating.label}
                </Badge>
              )}
              {viewModel.mileage && (
                <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-[11px] font-bold border border-border font-mono">
                  {viewModel.mileage}
                </span>
              )}
            </>
          )}
        </div>

        {/* Price */}
        <div className="mt-auto pt-3 border-t border-border flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-foreground leading-none font-display">
              {viewModel.price}
            </span>
            <span className="text-xs text-muted-foreground mt-1 h-4 block font-mono">
              {isAnalyzing ? (
                <span className="animate-pulse">Checking market...</span>
              ) : (
                <span>Fair: £{viewModel.plate ? "Checked" : "Unknown"}</span>
              )}
            </span>
          </div>

          {viewModel.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1 font-sans">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[80px]">
                {viewModel.location}
              </span>
            </div>
          )}
        </div>

        <a
          href={viewModel.link}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-bold text-center w-full py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-motovotive-red hover:text-white transition-all duration-200 uppercase tracking-wide font-display"
        >
          View Details
        </a>
      </div>
    </div>
  );
});
