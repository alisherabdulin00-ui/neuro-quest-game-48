interface VideoContentProps {
  videoUrl: string;
  title: string;
}

export const VideoContent = ({ videoUrl, title }: VideoContentProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="aspect-[9/16] max-h-[70vh] mx-auto bg-background rounded-xl overflow-hidden shadow-lg">
        <iframe
          src={videoUrl}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};