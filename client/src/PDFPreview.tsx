import { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.min";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type Props = {
  file: File;
};

const PDFPreview = ({ file }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    const renderPDF = async () => {
      if (!file || !canvasRef.current) return;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);

      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Cancel previous render task if still running
      if (renderTaskRef.current && renderTaskRef.current.cancel) {
        renderTaskRef.current.cancel();
      }

      // Assign new render task
      renderTaskRef.current = page.render({
        canvasContext: context,
        viewport,
      });

      try {
        await renderTaskRef.current.promise;
        } catch (err) {
            const error = err as { name?: string };
            if (error?.name !== "RenderingCancelledException") {
            console.error("Render error", err);
            }
        }
    };

    renderPDF();

    return () => {
      if (renderTaskRef.current && renderTaskRef.current.cancel) {
        renderTaskRef.current.cancel();
      }
    };
  }, [file]);

  return (
    <div style={{ maxWidth: "180px", margin: "0 auto" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "auto",
          borderRadius: "8px",
          boxShadow: "0 0 8px rgba(0, 0, 0, 0.1)",
        }}
      />
    </div>
  );
  };

export default PDFPreview;
