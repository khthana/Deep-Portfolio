import { useEffect, useState } from "react";
import Button from "../../../../components/button/button";
import LearningActivityCard from "./learning-activity-card";
import { Select } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import type { Options } from "../../../../types/global-type";
import { fetchLearningActivityOptions } from "../../learning-activity/stores/teacher-learning-activity-action";
import type {
  LearningActivityDetail,
  LearningActivityFormType,
} from "../types/mapping-type.type";
import AddLearningActivityForm from "./add-learning-activity-form";

type Props = {
  onAddLearningActivity: (values: LearningActivityFormType) => void;
  learningActivityData: LearningActivityDetail[];
};

const LearningActivitySection = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.teacherHome);

  const [isAdding, setIsAdding] = useState<boolean>(false);

  const [options, setOptions] = useState<Options[]>();

  const fetchOptions = async () => {
    if (!homeSlice.selectedCourse) return;

    const { data } = await dispatch(
      fetchLearningActivityOptions(homeSlice.selectedCourse.section_id),
    ).unwrap();

    if (data) {
      setOptions(data);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [homeSlice.selectedCourse]);

  return (
    <div className="2xl:p-8 p-4 rounded-2xl bg-white flex flex-col 2xl:gap-8 gap-4">
      <div className="pb-5 border-b border-light-grey body-bold-3 text-center">
        กิจกรรมการเรียนรู้
      </div>

      {props.learningActivityData.length > 0 && (
        <div className="flex flex-col gap-4">
          {props.learningActivityData.map((learningActivity) => (
            <LearningActivityCard learningActivity={learningActivity} />
          ))}
        </div>
      )}

      {isAdding ? (
        <AddLearningActivityForm
          options={options}
          setIsAdding={setIsAdding}
          onAddLearningActivity={props.onAddLearningActivity}
        />
      ) : (
        <div>
          <Button
            iconSrc="/assets/course/add-icon.svg"
            className="rounded-4xl py-2"
            variant="secondary"
            onClick={() => setIsAdding(true)}
          >
            เพิ่มกิจกรรมการเรียนรู้
          </Button>
        </div>
      )}
    </div>
  );
};

export default LearningActivitySection;
