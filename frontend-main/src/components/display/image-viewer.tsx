import { getFile } from "../../utils/get-file";

const ImageViewer = ({ src }: { src: string }) => {
  return (
    <img
      src={getFile(src)}
      style={{
        height: "100%",
        width: "100%",
        // maxWidth: "none",
        // userSelect: "none",
      }}
    />
  );
};

export default ImageViewer;
