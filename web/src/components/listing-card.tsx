import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ListingModel } from "@/lib/models/Listing";
import { Heart } from "lucide-react";

interface ListingCardProps {
  listing: ListingModel;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm hover:shadow-lg transition-all border-border hover-lift">
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {listing.image ? (
          <Image
            src={listing.image}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-secondary">
            No Image
          </div>
        )}
        <button className="absolute right-3 top-3 rounded-full bg-white/80 p-1.5 text-muted-foreground transition-colors hover:bg-white hover:text-motovotive-red">
          <Heart className="h-5 w-5" />
        </button>
        
        {listing.sellerType === "private" && (
           <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-motovotive-carbon-black font-display backdrop-blur-sm">
             Private seller
           </span>
        )}

        <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-bold text-white font-mono backdrop-blur-sm">
           1/1
        </span>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2">
            <div className="flex items-center gap-2">
                 <span className="text-xs font-bold uppercase text-motovotive-red font-display tracking-wider">
                    {listing.website}
                 </span>
            </div>
            <h3 className="text-lg font-bold text-foreground line-clamp-1 font-display group-hover:text-motovotive-red transition-colors">
                {listing.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5em] font-sans">
                {listing.subtitle}
            </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
             {listing.valuationSummary && (
                <Badge variant="success" className="rounded-sm">
                    Fair price
                </Badge>
             )}
             <Badge variant="outline" className="rounded-sm font-normal text-muted-foreground font-mono bg-secondary border-transparent">
                 {listing.formattedMileage}
             </Badge>
        </div>

        <div className="mt-auto">
            <div className="mb-1 flex items-end gap-1">
                <span className="text-xl font-bold text-foreground font-display">{listing.formattedPrice}</span>
            </div>
            
            {listing.valuationSummary && (
                <div className="mb-3 text-xs text-muted-foreground font-mono">
                   <span className="block">Est: {listing.valuationSummary.fairPrice}</span>
                </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground font-sans">
                <span className="truncate max-w-[150px]">{listing.location}</span>
                <span className="flex items-center gap-1">
                    {/* Distance could go here */}
                </span>
            </div>
        </div>
      </div>
      
      <a href={listing.link} target="_blank" rel="noreferrer" className="absolute inset-0 z-10" aria-label={`View ${listing.title}`}></a>
    </div>
  );
}

