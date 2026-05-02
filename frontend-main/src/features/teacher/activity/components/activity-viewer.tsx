import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import PDFViewer from "../../../../components/display/pdf-viewer";
import Toolbar from "../../../../components/display/toolbar";
import ImageViewer from "../../../../components/display/image-viewer";
import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  isBookmark: boolean;
  handleAddBookmark?: () => void;
};

const ActivityViewer = (props: Props) => {
  const transformComponentRef = useRef<ReactZoomPanPinchRef | null>(null);

  const [totalPage, setTotalPage] = useState<number | null>(null);
  const [goToPage, setGoToPage] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const isPdf = props.src.split("?")[0].toLowerCase().endsWith(".pdf");
  const isImg =
    props.src.split("?")[0].toLowerCase().endsWith(".jpg") ||
    props.src.split("?")[0].toLowerCase().endsWith(".png") ||
    props.src.split("?")[0].toLowerCase().endsWith(".jpeg");

  const handleGoToPage = (pageNumber: number) => {
    setGoToPage(pageNumber);
    setCurrentPage(pageNumber);
  };

  const handleZoomIn = () => transformComponentRef.current?.zoomIn();
  const handleZoomOut = () => transformComponentRef.current?.zoomOut();

  useEffect(() => {
    if (isPdf) {
      setGoToPage(currentPage);
    }
  }, [isPdf]);

  useEffect(() => {
    console.log("src : ", props.src);
  }, [props.src]);

  return (
    <div className="h-full w-full relative bg-black overflow-hidden">
      <div className="flex flex-col h-full w-full">
        <Toolbar
          handleAddBookmark={props.handleAddBookmark}
          bookmark={props.isBookmark}
          totalPage={isPdf ? totalPage : 1}
          currentPage={isPdf ? currentPage : 1}
          handleGoToPage={handleGoToPage}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          fileSrc={props.src}
        />
        <div className="flex-1 overflow-hidden relative">
          <TransformWrapper
            ref={transformComponentRef}
            minScale={0.5}
            maxScale={3}
            centerOnInit
            centerZoomedOut={true}
            wheel={{ wheelDisabled: true }}
          >
            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "100%",
                overflow: "auto",
              }}
              contentStyle={{
                width: "100%",
                // display: "flex",
                // justifyContent: "center",
                // alignItems: "flex-start",
                // paddingTop: "20px",
                backgroundColor: "#2C3142",
              }}
            >
              <div className="flex flex-col items-center pt-5 min-h-full w-full">
                {isPdf ? (
                  <PDFViewer
                    isPDF={isPdf}
                    src={props.src}
                    totalPage={totalPage}
                    setTotalPage={setTotalPage}
                    goToPage={goToPage}
                    setCurrentPage={setCurrentPage}
                  />
                ) : isImg ? (
                  <ImageViewer src={props.src} />
                ) : (
                  <div className="text-white">
                    ไม่สามารถ Preview เอกสารได้ กรุณาดาวน์โหลด
                  </div>
                )}
              </div>
            </TransformComponent>
          </TransformWrapper>
        </div>
      </div>
    </div>
  );
};

export default ActivityViewer;
