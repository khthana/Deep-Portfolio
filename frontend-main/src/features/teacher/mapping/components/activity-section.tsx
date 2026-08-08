import { useEffect, useState } from "react";
import Button from "../../../../components/button/button";
import ActivityCard from "./activity-card";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { fetchActivityOptions } from "../../activity/stores/teacher-activity-action";
import type { Options } from "../../../../types/global-type";
import AddActivityForm from "./add-activity-form";
import type {
  ActivityFormType,
  ActivityMappingDetailResp,
} from "../types/mapping-type.type";

type Props = {
  onAddActivity: (values: ActivityFormType) => void;
  activityData: ActivityMappingDetailResp[];
};

const ActivitySection = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.teacherHome);

  const [isAdding, setIsAdding] = useState<boolean>(false);

  const [options, setOptions] = useState<Options[]>();

  const fetchOptions = async () => {
    try {
      if (!homeSlice.selectedCourse) return;

      const { data } = await dispatch(
        fetchActivityOptions(homeSlice.selectedCourse.section_id),
      ).unwrap();

      if (data) {
        setOptions(data);
      }
    } catch (error) {}
  };

  useEffect(() => {
    fetchOptions();
  }, [homeSlice.selectedCourse]);

  return (
    <div className="p-4 2xl:p-8 rounded-2xl bg-white flex flex-col gap-4 2xl:gap-8">
      <div className="pb-5 border-b border-light-grey body-bold-3 text-center">
        กิจกรรมการประเมิน
      </div>

      {props.activityData.length > 0 && (
        <div className="flex flex-col gap-4">
          {props.activityData.map((activity) => (
            <ActivityCard activity={activity} />
          ))}
        </div>
      )}

      {isAdding ? (
        <AddActivityForm
          options={options}
          setIsAdding={setIsAdding}
          onAddActivity={props.onAddActivity}
        />
      ) : (
        <div>
          <Button
            iconSrc="/assets/course/add-icon.svg"
            className="rounded-4xl py-2"
            variant="secondary"
            onClick={() => setIsAdding(true)}
          >
            เพิ่มกิจกรรมการประเมิน
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivitySection;
