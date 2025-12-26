import { useEffect, useRef, useState } from "react";

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const targetMousePos = useRef({ x: -1000, y: -1000 });
  const currentMousePos = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetMousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Graph nodes - distributed across the screen with varied sizes
    const nodes: Array<{
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
      pulseOffset: number;
    }> = [];

    // Create nodes spread across the entire canvas
    const nodeCount = 80;
    for (let i = 0; i < nodeCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      
      nodes.push({
        x,
        y,
        baseX: x,
        baseY: y,
        radius: Math.random() * 3 + 1.5,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        alpha: Math.random() * 0.4 + 0.2,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.008;

      // Smooth cursor following (lerp)
      currentMousePos.current.x += (targetMousePos.current.x - currentMousePos.current.x) * 0.03;
      currentMousePos.current.y += (targetMousePos.current.y - currentMousePos.current.y) * 0.03;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const heroRadius = 280; // Area to keep clearer for readability

      // Draw subtle cursor glow
      if (currentMousePos.current.x > 0) {
        const cursorGradient = ctx.createRadialGradient(
          currentMousePos.current.x,
          currentMousePos.current.y,
          0,
          currentMousePos.current.x,
          currentMousePos.current.y,
          300
        );
        cursorGradient.addColorStop(0, "rgba(255, 120, 60, 0.1)");
        cursorGradient.addColorStop(0.4, "rgba(255, 100, 50, 0.04)");
        cursorGradient.addColorStop(1, "transparent");
        ctx.fillStyle = cursorGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      
      // Update and draw graph nodes
      nodes.forEach((node) => {
        // Gentle drifting motion
        node.x += node.vx;
        node.y += node.vy;
        
        // Soft boundary bounce with drift back towards base position
        const driftStrength = 0.0008;
        node.vx += (node.baseX - node.x) * driftStrength;
        node.vy += (node.baseY - node.y) * driftStrength;
        
        // Add more random movement for more active motion
        node.vx += (Math.random() - 0.5) * 0.004;
        node.vy += (Math.random() - 0.5) * 0.004;
        
        // Keep within bounds
        if (node.x < 20 || node.x > canvas.width - 20) node.vx *= -0.8;
        if (node.y < 20 || node.y > canvas.height - 20) node.vy *= -0.8;
        
        // Calculate distance from hero center
        const distFromCenter = Math.sqrt(
          Math.pow(node.x - centerX, 2) + Math.pow(node.y - centerY, 2)
        );
        
        // Reduce opacity for nodes near hero center
        const centerFade = distFromCenter < heroRadius 
          ? Math.pow(distFromCenter / heroRadius, 2) * 0.4
          : 1;
        
        // Pulsing alpha effect
        const pulseAlpha = node.alpha * (0.7 + 0.3 * Math.sin(time * 2 + node.pulseOffset));
        const finalAlpha = pulseAlpha * centerFade;
        
        // Cursor proximity boost - enhanced brightening
        const distToCursor = Math.sqrt(
          Math.pow(node.x - currentMousePos.current.x, 2) +
          Math.pow(node.y - currentMousePos.current.y, 2)
        );
        const cursorBoost = distToCursor < 250 ? (1 - distToCursor / 250) * 0.45 : 0;
        
        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 130, 70, ${finalAlpha + cursorBoost})`;
        ctx.fill();
        
        // Subtle node glow
        if (finalAlpha > 0.1) {
          const nodeGlow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 3);
          nodeGlow.addColorStop(0, `rgba(255, 120, 60, ${(finalAlpha + cursorBoost) * 0.4})`);
          nodeGlow.addColorStop(1, "transparent");
          ctx.fillStyle = nodeGlow;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw graph connections
      nodes.forEach((n1, i) => {
        nodes.slice(i + 1).forEach((n2) => {
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 200;

          if (distance < maxDistance) {
            const midX = (n1.x + n2.x) / 2;
            const midY = (n1.y + n2.y) / 2;
            
            // Reduce connection visibility near hero center
            const distFromCenter = Math.sqrt(
              Math.pow(midX - centerX, 2) + Math.pow(midY - centerY, 2)
            );
            const centerFade = distFromCenter < heroRadius 
              ? Math.pow(distFromCenter / heroRadius, 2.5) * 0.3
              : 1;
            
            // Base opacity with distance falloff and pulsing
            const baseOpacity = 0.18 * (1 - distance / maxDistance);
            const pulseOpacity = baseOpacity * (0.6 + 0.4 * Math.sin(time * 1.5 + i * 0.1));
            
            // Cursor boost for connections - enhanced brightening
            const distToCursor = Math.sqrt(
              Math.pow(midX - currentMousePos.current.x, 2) +
              Math.pow(midY - currentMousePos.current.y, 2)
            );
            const cursorBoost = distToCursor < 280 ? (1 - distToCursor / 280) * 0.25 : 0;
            
            const finalOpacity = (pulseOpacity + cursorBoost) * centerFade;
            
            if (finalOpacity > 0.01) {
              ctx.beginPath();
              ctx.moveTo(n1.x, n1.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.strokeStyle = `rgba(255, 120, 60, ${finalOpacity})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "transparent" }}
    />
  );
};

export default AnimatedBackground;