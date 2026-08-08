import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { getFile } from "../../utils/get-file";

// pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Props = {
  isPDF: boolean;
  src: string;
  goToPage: number | null;
  totalPage: number | null;
  setTotalPage: (numPages: number | null) => void;
  setCurrentPage: Dispatch<SetStateAction<number>>;
};

const PDFViewer = ({
  src,
  goToPage,
  totalPage,
  setTotalPage,
  setCurrentPage,
}: Props) => {
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [docReady, setDocReady] = useState<boolean>(false);

  /* -------------------- Document load -------------------- */

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPage(numPages);
    setDocReady(true);
  };

  /* -------------------- Reset when src changes -------------------- */

  useEffect(() => {
    pageRefs.current = [];
    observerRef.current?.disconnect();
  }, [src]);

  /* -------------------- Go to page (safe) -------------------- */

  useEffect(() => {
    if (!goToPage || !totalPage) return;

    const index = goToPage - 1;
    if (index < 0 || index >= totalPage) return;

    const target = pageRefs.current[index];
    if (!target) return;

    requestAnimationFrame(() => {
      let parent: HTMLElement | null = target.parentElement;

      while (parent) {
        const style = window.getComputedStyle(parent);
        if (style.overflowY === "auto" || style.overflowY === "scroll") {
          const containerTop = parent.getBoundingClientRect().top;
          const elementTop = target.getBoundingClientRect().top;

          parent.scrollTo({
            top: parent.scrollTop + (elementTop - containerTop),
            behavior: "smooth",
          });
          return;
        }
        parent = parent.parentElement;
      }

      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [goToPage, totalPage]);

  /* -------------------- IntersectionObserver -------------------- */

  useEffect(() => {
    if (!totalPage) return;

    observerRef.current?.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const index = pageRefs.current.findIndex((el) => el === entry.target);

          if (index !== -1) {
            setCurrentPage(index + 1);
          }
        });
      },
      { threshold: 0.5 },
    );

    observerRef.current = observer;

    pageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [totalPage, setCurrentPage]);

  useEffect(() => {
    setTotalPage(null);
    setDocReady(false);
    observerRef.current?.disconnect();
    pageRefs.current = [];
  }, [src]);

  /* -------------------- Render -------------------- */

  return (
    <div className="max-h-full bg-gray-100 p-4">
      <Document
        key={src}
        file={getFile(src)}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={() => {
          setTotalPage(0);
        }}
        className="flex flex-col gap-4"
      >
        {docReady &&
          totalPage &&
          Array.from({ length: totalPage }, (_, index) => (
            <div
              key={index}
              ref={(el) => {
                pageRefs.current[index] = el;
              }}
              style={{ minHeight: 990 }}
            >
              <Page
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={700}
                className="shadow-md"
                loading={
                  <div className="w-[700px] h-[990px] bg-white animate-pulse" />
                }
              />
            </div>
          ))}
      </Document>
    </div>
  );
};

export default PDFViewer;
