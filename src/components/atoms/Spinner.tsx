interface SpinnerProps {
  size?: number;      
  color?: string;     
  className?: string;  
  label?: string;   
}

export default function Spinner({
  size = 28,
  color = "#228EE5",
  className,
  label,
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`flex items-center justify-center ${className ?? ""}`}
    >
      <div
        className="border-2 border-t-transparent rounded-full animate-spin"
        style={{
          width: size,
          height: size,
          borderColor: color,
          borderTopColor: "transparent",
        }}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
