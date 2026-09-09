import Image from "next/image";

export default function OrderItemThumbnail({
  items,
}: {
  items?: { url: string; title?: string }[] | null;
}) {
  const THUMBNAIL_LIMIT = 3;
  const safeItems = items ?? [];
  const hasOverflow = safeItems.length > THUMBNAIL_LIMIT + 1;

  return (
    <div className="flex flex-col items-center select-none">
      <div className="h-15 w-40">
        <div className="relative h-15 w-full overflow-hidden">
          {safeItems
            .slice(0, hasOverflow ? THUMBNAIL_LIMIT : THUMBNAIL_LIMIT + 1)
            .map((item, index) => (
              <div
                key={index}
                className="border-paper absolute top-1 h-13 w-13 overflow-hidden rounded-lg border-2"
                style={{
                  left: `${index * 35}px`,
                  zIndex: index,
                  opacity: 0.8 + index * 0.1,
                }}
              >
                <Image
                  src={item.url}
                  alt={item.title ? item.title : `Thumbnail ${index + 1}`}
                  width={52}
                  height={52}
                  className="flex h-13 w-13 object-cover"
                />
              </div>
            ))}
          {hasOverflow && (
            <div
              className="bg-blush border-paper absolute top-1 flex h-13 w-13 items-center justify-center rounded-xl border-2 text-white"
              style={{
                left: `${THUMBNAIL_LIMIT * 35}px`,
                zIndex: THUMBNAIL_LIMIT,
              }}
            >
              <p className="text-ink text-xs">
                +{safeItems.length - THUMBNAIL_LIMIT}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
