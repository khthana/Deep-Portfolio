import WhiteContainer from "../../../../../components/container/white-container";
import TitleWithEditIcon from "../title-with-edit-icon";
import { getFile } from "../../../../../utils/get-file";

type ImageSectionProps = {
  imageUrl?: string | null;
  onEdit: () => void;
};

const ImageSection = ({ imageUrl, onEdit }: ImageSectionProps) => {
  return (
    <WhiteContainer>
      <TitleWithEditIcon title="รูปภาพ" onEdit={onEdit} />
      <div className="flex justify-center md:justify-start">
        <img
          src={imageUrl ? getFile(imageUrl) : "/assets/user/fallback-user.png"}
          alt="user image"
          className="max-h-64 md:max-h-full object-contain rounded-lg"
        />
      </div>
    </WhiteContainer>
  );
};

export default ImageSection;
