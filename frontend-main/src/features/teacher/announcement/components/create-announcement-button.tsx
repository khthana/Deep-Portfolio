import { generatePath, useNavigate, useParams } from "react-router-dom";
import { paths } from "../../../../routes/paths.config";
import Button from "../../../../components/button/button";

const CreateAnnouncementButton = () => {
  const { secId } = useParams();
  const navigate = useNavigate();

  const handleOnClick = () => {
    const path = generatePath(paths.teacher.course.announcement.new, {
      secId: secId,
    });

    navigate(path);
  };

  return (
    <Button
      onClick={handleOnClick}
      iconSrc="/assets/announcement/add-icon.svg"
      className="absolute 2xl:right-25 bottom-12 right-14 rounded-4xl py-4"
    >
      เพิ่มประกาศ
    </Button>
  );
};

export default CreateAnnouncementButton;
