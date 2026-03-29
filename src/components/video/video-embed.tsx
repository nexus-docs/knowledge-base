interface VideoEmbedProps {
  src: string;
  title?: string;
}

export function VideoEmbed({ src, title = "Video" }: VideoEmbedProps) {
  // Convert YouTube watch URLs to embed URLs
  const embedUrl = src.includes("youtube.com/watch")
    ? src.replace("watch?v=", "embed/")
    : src.includes("youtu.be/")
      ? `https://www.youtube.com/embed/${src.split("youtu.be/")[1]}`
      : src;

  return (
    <div className="my-6 not-prose">
      <div className="relative aspect-video overflow-hidden rounded-lg border border-[var(--color-border)]">
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          loading="lazy"
        />
      </div>
    </div>
  );
}
