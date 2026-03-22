import { useEffect, useRef } from "react";
import wireframeData from "../assets/wireframe.json";
import Logo from "../assets/logo.png";

// --- 3D Math ---

function rotateY(x: number, y: number, z: number, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: x * cos + z * sin, y, z: -x * sin + z * cos };
}

function rotateX(x: number, y: number, z: number, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x, y: y * cos - z * sin, z: y * sin + z * cos };
}

function project(
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  fov: number,
) {
  const perspective = fov / (fov + z + 2);
  const scale = Math.min(width, height) * 1.4;
  return {
    px: x * perspective * scale + width / 2,
    py: -y * perspective * scale + height / 2,
    depth: z,
  };
}

// --- Canvas ---

function WireframeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const mouse = { x: 0.5, y: 0.5 };
    let autoAngle = 0;

    const vertices: number[][] = wireframeData.vertices;
    const lines: number[][] = wireframeData.lines;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const animate = () => {
      const { width, height } = canvas;

      ctx.fillStyle = "rgba(245, 247, 245, 0.85)";
      ctx.fillRect(0, 0, width, height);

      autoAngle += 0.003;

      const mouseRotY = (mouse.x - 0.5) * Math.PI * 0.5;
      const mouseRotX = (mouse.y - 0.5) * Math.PI * 0.3;
      const rotYAngle = autoAngle + mouseRotY;
      const rotXAngle = -0.3 + mouseRotX;
      const fov = 3;

      const projected = vertices.map(([vx, vy, vz]) => {
        const r1 = rotateY(vx, vy, vz, rotYAngle);
        const r2 = rotateX(r1.x, r1.y, r1.z, rotXAngle);
        return project(r2.x, r2.y, r2.z, width, height, fov);
      });

      for (const [i, j] of lines) {
        const a = projected[i];
        const b = projected[j];
        if (!a || !b) continue;

        const avgDepth = (a.depth + b.depth) / 2;
        const alpha = Math.max(0.08, Math.min(0.5, 0.4 - avgDepth * 0.2));

        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(b.px, b.py);
        ctx.strokeStyle = `rgba(31, 111, 67, ${alpha})`;
        ctx.lineWidth = Math.max(0.5, 1.5 - avgDepth * 0.5);
        ctx.lineCap = "round";
        ctx.stroke();
      }

      for (const p of projected) {
        const alpha = Math.max(0.1, Math.min(0.6, 0.5 - p.depth * 0.2));
        ctx.beginPath();
        ctx.arc(p.px, p.py, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(31, 111, 67, ${alpha})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX / window.innerWidth;
      mouse.y = event.clientY / window.innerHeight;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      mouse.x = touch.clientX / window.innerWidth;
      mouse.y = touch.clientY / window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    resizeCanvas();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="wireframe-canvas" />;
}

// --- Corner brackets ---

function WireframeCorners({
  size = 20,
  color = "#1f6f43",
}: {
  size?: number;
  color?: string;
}) {
  const s = size;
  return (
    <>
      <svg className="absolute top-0 left-0" width={s} height={s}>
        <path d={`M0,${s} L0,0 L${s},0`} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
      <svg className="absolute top-0 right-0" width={s} height={s}>
        <path d={`M0,0 L${s},0 L${s},${s}`} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
      <svg className="absolute bottom-0 left-0" width={s} height={s}>
        <path d={`M0,0 L0,${s} L${s},${s}`} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
      <svg className="absolute bottom-0 right-0" width={s} height={s}>
        <path d={`M${s},0 L${s},${s} L0,${s}`} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    </>
  );
}

// --- Hero ---

export default function WireframeHero() {
  return (
    <div className="wireframe-container relative w-screen h-screen overflow-x-hidden">
      <WireframeCanvas />

      <div className="wireframe-vignette absolute inset-0 z-1 pointer-events-none" />

      <div className="wireframe-content relative z-2 text-center">
        <WireframeCorners size={28} color="rgba(31, 111, 67, 0.4)" />
        <div className="wireframe-scanlines absolute inset-0 pointer-events-none" />

        <div className="wireframe-inner">
          <img src={Logo} className="wireframe-logo" alt="PropertyLoop" />

          <div className="wireframe-divider w-16 sm:w-24 h-px mx-auto mb-4 sm:mb-6" />

          <p className="wireframe-description mb-5 sm:mb-8 mx-auto">
            PropertyLoop is a tech-powered real estate network where agents and
            building material vendors connect, showcase listings, and reach
            ready buyers through a modern online marketplace.
          </p>

          <div className="wireframe-cta-box relative mb-5 sm:mb-8 mx-auto max-w-lg">
            <WireframeCorners size={16} color="rgba(31, 111, 67, 0.35)" />
            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <div className="wireframe-cta-dot mx-auto mb-2 sm:mb-3" />
              <p className="wireframe-cta-heading font-bold mb-1 sm:mb-2">
                Secure your spot as a{" "}
                <span className="wireframe-highlight font-extrabold">
                  FOUNDING PARTNER
                </span>{" "}
                today!
              </p>
              <p className="wireframe-cta-sub">
                We're onboarding a limited number of agents, giving you early
                visibility, priority listing placement, and exclusive perks.
              </p>
            </div>
          </div>

          <button className="wireframe-btn inline-flex items-center gap-1 font-bold cursor-pointer">
            <span className="wireframe-btn-bracket">[</span>
            &nbsp;Join Our Network &nbsp;&#9654;&nbsp;
            <span className="wireframe-btn-bracket">]</span>
          </button>

          <div className="wireframe-socials flex items-center justify-center gap-4 mt-6 sm:mt-8">
            <a
              href="https://wa.me/YOUR_NUMBER"
              target="_blank"
              rel="noopener noreferrer"
              className="wireframe-social-icon"
              aria-label="WhatsApp"
            >
              <svg viewBox="0 0 32 32" width="40" height="40">
                <circle cx="16" cy="16" r="16" fill="#1f6f43" />
                <path
                  d="M23.3 18.6c-.4-.2-2.2-1.1-2.5-1.2-.3-.1-.6-.2-.8.2s-.9 1.2-1.1 1.4c-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.8-1.1-1-1.8-2.2-2-2.6-.2-.4 0-.6.2-.7.2-.2.4-.4.5-.6.2-.2.2-.4.3-.6.1-.2 0-.5 0-.6-.1-.2-.8-2-1.1-2.7-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.8s1.2 3.3 1.4 3.5c.2.2 2.4 3.6 5.7 5.1.8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 2.2-.9 2.5-1.7.3-.9.3-1.6.2-1.7-.1-.2-.4-.3-.7-.4z"
                  fill="white"
                />
              </svg>
            </a>
            <a
              href="mailto:your@email.com"
              className="wireframe-social-icon"
              aria-label="Email"
            >
              <svg viewBox="0 0 32 32" width="40" height="40">
                <circle cx="16" cy="16" r="16" fill="#1a3d2a" />
                <rect x="8" y="10" width="16" height="12" rx="2" fill="white" />
                <path
                  d="M8.5 10.5L16 17l7.5-6.5"
                  fill="none"
                  stroke="#1a3d2a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
