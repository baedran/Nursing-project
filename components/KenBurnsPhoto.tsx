type Props = {
  src: string;
  alt?: string;
  position?: string; // e.g. "center 30%"
  className?: string;
};

export default function KenBurnsPhoto({
  src,
  alt = "",
  position = "center 30%",
  className = "",
}: Props) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`absolute inset-0 ${className}`}
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: position,
        animation: "kenburns 30s ease-in-out infinite alternate",
        filter: "saturate(1.05) contrast(1.02)",
      }}
    />
  );
}
