import { Modal } from "antd";
import type { Dispatch, SetStateAction } from "react";
import type { RubricDetail } from "../../../../types/activity-type.type";
import RubricTable from "../../../student/course/components/classwork-detail/rubric-table";

type Props = {
  openRubricModal: boolean;
  setOpenRubricModal: Dispatch<SetStateAction<boolean>>;
  rubrics: RubricDetail[];
  expected_level: number;
};

const RubricModal = (props: Props) => {
  return (
    <Modal
      open={props.openRubricModal}
      onCancel={() => props.setOpenRubricModal(false)}
      width={1500}
      footer={null}
      centered
    >
      <RubricTable
        rubrics={props.rubrics}
        expected_level={props.expected_level}
        color="blue"
      />
    </Modal>
  );
};

export default RubricModal;
