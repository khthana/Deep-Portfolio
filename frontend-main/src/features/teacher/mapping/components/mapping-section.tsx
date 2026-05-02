import CLOSection from "./clo-section";
import ActivitySection from "./activity-section";
import LearningActivitySection from "./learning-activity-section";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../../stores/stores";
import { useState, useEffect } from "react";
import type {
  ActivityFormType,
  ActivityMappingDetailResp,
  CreateActivityCLOMappingBodyReq,
  CreateLearningActivityCLOMappingBodyReq,
  LearningActivityDetail,
  LearningActivityFormType,
} from "../types/mapping-type.type";
import {
  fetchActivity,
  fetchLearningActivity,
  postActivityCLOMapping,
  postLearningActivityCLOMapping,
} from "../stores/teacher-mapping-action";
import { message } from "antd";

type Props = {
  cloData: {
    cloNumber: string;
    detail: string;
    id: number;
  };
};

const MappingSection = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const [messageApi, contextHolder] = message.useMessage();

  const [activityData, setActivityData] = useState<ActivityMappingDetailResp[]>(
    []
  );
  const [learningActivityData, setLearningActivityData] = useState<
    LearningActivityDetail[]
  >([]);

  const onAddActivity = async (values: ActivityFormType) => {
    try {
      const body: CreateActivityCLOMappingBodyReq = {
        activity_id: parseInt(values.activity),
        clo_id: props.cloData.id,
        weight: values.weight,
      };

      const { data } = await dispatch(postActivityCLOMapping(body)).unwrap();

      if (data) {
        messageApi.success("เพิ่มกิจกรรมสำเร็จ");
        fetchActivityData();
      }
    } catch (error) {
      messageApi.error("ไม่สามารถเพิ่มกิจกรรมได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const onAddLearningActivity = async (values: LearningActivityFormType) => {
    try {
      const body: CreateLearningActivityCLOMappingBodyReq = {
        learning_activity_id: parseInt(values.learning_activity),
        clo_id: props.cloData.id,
      };

      const { data } = await dispatch(
        postLearningActivityCLOMapping(body)
      ).unwrap();

      if (data) {
        messageApi.success("เพิ่มกิจกรรมสำเร็จ");
        fetchLearningActivityData();
      }
    } catch (error) {
      messageApi.error("ไม่สามารถเพิ่มกิจกรรมได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const fetchActivityData = async () => {
    try {
      const { data } = await dispatch(fetchActivity(props.cloData.id)).unwrap();

      if (data) {
        setActivityData(data);
      }
    } catch (error) {}
  };

  const fetchLearningActivityData = async () => {
    try {
      const { data } = await dispatch(
        fetchLearningActivity(props.cloData.id)
      ).unwrap();

      if (data) {
        setLearningActivityData(data);
      }
    } catch (error) {}
  };

  useEffect(() => {
    fetchActivityData();
    fetchLearningActivityData();
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      {contextHolder}

      <CLOSection cloData={props.cloData} />
      <ActivitySection
        onAddActivity={onAddActivity}
        activityData={activityData}
      />
      <LearningActivitySection
        onAddLearningActivity={onAddLearningActivity}
        learningActivityData={learningActivityData}
      />
    </div>
  );
};

export default MappingSection;
