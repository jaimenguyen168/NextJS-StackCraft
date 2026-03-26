"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";

function cleanMermaid(content: string): string {
  return content.replace(/\|>\s/g, "| ").replace(/\|>/g, "|").trim();
}

interface MermaidDiagramProps {
  content: string;
}

export default function MermaidDiagram({ content }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!ref.current) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: resolvedTheme === "dark" ? "dark" : "neutral",
      securityLevel: "loose",
    });

    const render = async () => {
      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      try {
        const { svg } = await mermaid.render(id, cleanMermaid(content));
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (e) {
        if (ref.current) {
          ref.current.innerHTML = `<pre class="text-xs text-destructive p-3 bg-muted rounded-lg overflow-auto">${content}</pre>`;
        }
      }
    };

    render();
  }, [content, resolvedTheme]);

  return <div ref={ref} className="w-full overflow-auto" />;
}
