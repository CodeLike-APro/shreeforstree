import Image from "next/image";

export default function OrderItemThumbnail({
  items,
}: {
  items?: { url: string; title?: string }[];
}) {
  const THUMBNAIL_LIMIT = 3;
  const safeItems = items ?? [];
  const hasOverflow = safeItems.length > THUMBNAIL_LIMIT + 1;
  const visible = safeItems.slice(
    0,
    hasOverflow ? THUMBNAIL_LIMIT : THUMBNAIL_LIMIT + 1,
  );
  const frontIndex = hasOverflow ? THUMBNAIL_LIMIT : visible.length - 1;

  return (
    <div className="select-none">
      <div className="h-15">
        <div className="flex h-15">
          {safeItems
            .slice(0, hasOverflow ? THUMBNAIL_LIMIT : THUMBNAIL_LIMIT + 1)
            .map((item, index) => (
              <div
                key={index}
                className={[
                  "border-paper h-13 w-13 overflow-hidden rounded-lg border-2",
                  index === 0 ? "" : "-ml-4.25",
                ].join(" ")}
                style={{
                  zIndex: index,
                  opacity: Math.max(0.6, 1 - (frontIndex - index) * 0.1),
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
              className={[
                "bg-blush border-paper flex h-13 w-13 items-center justify-center rounded-lg border-2 text-white",
                "-ml-4.25",
              ].join(" ")}
              style={{
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
