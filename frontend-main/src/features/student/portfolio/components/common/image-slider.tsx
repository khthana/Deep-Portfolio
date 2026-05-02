import React, { useRef } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { getFile } from "../../../../../utils/get-file";

interface ImageSliderProps {
  images: {
    id: string;
    url: string;
    alt?: string;
  }[];
  height?: string;
}

export const ImageSlider: React.FC<ImageSliderProps> = ({
  images,
  height = "387px",
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll =
        direction === "left"
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="relative group w-full">
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto pb-4 scroll-smooth hide-scrollbar w-full"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div className="flex gap-4 w-fit mx-auto px-4">
          {images.map((image) => (
            <div key={image.id} className="flex-shrink-0" style={{ height }}>
              <img
                src={
                  image.url
                    ? image.url.startsWith("http")
                      ? image.url
                      : getFile(image.url)
                    : "/placeholder-image.jpg"
                }
                alt={image.alt || "Experience image"}
                className="h-full w-auto object-cover rounded-lg shadow-sm"
                style={{
                  maxWidth: "800px",
                  minWidth: "200px",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={() => scroll("left")}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-12 h-12 flex items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 focus-visible:opacity-100 z-10"
            aria-label="Scroll left"
          >
            <LeftOutlined style={{ fontSize: "20px" }} />
          </button>

          <button
            onClick={() => scroll("right")}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-12 h-12 flex items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 focus-visible:opacity-100 z-10"
            aria-label="Scroll right"
          >
            <RightOutlined style={{ fontSize: "20px" }} />
          </button>
        </>
      )}
    </div>
  );
};
