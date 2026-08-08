import type { RubricDetail } from "../../../../types/activity-type.type";
import { Form, type FormInstance } from "antd";
import type { GradingFormType } from "../types/activity-type.type";
import FormItem from "antd/es/form/FormItem";

type Props = {
  rubric: RubricDetail;
  gradingForm: FormInstance<GradingFormType>;

  action?: boolean;
  color?: "blue" | "orange";
};

const RubricCard = (props: Props) => {
  const rubricDetail = Form.useWatch("rubric_detail", props.gradingForm) || [];

  const orangeStyle = {};

  const selectedLevel = rubricDetail.find(
    (r: any) => r.rubric_id === props.rubric.id,
  )?.rubric_level_id;

  const levels = () => {
    if (!props.rubric.rubric_levels) return [];

    let level_no = [];
    let index = props.rubric.rubric_levels.length;
    while (index > 0) {
      level_no.push({
        level_no: props.rubric.rubric_levels[index - 1].level_no,
        id: props.rubric.rubric_levels[index - 1].id,
      });
      index--;
    }

    return level_no;
  };

  const handleOnClick = (levelId: number, levelNo: number) => {
    // setIsSelected(levelId);

    const currentData = props.gradingForm.getFieldValue("rubric_detail") || [];

    const filtered = currentData.filter(
      (r: any) => r.rubric_id !== props.rubric.id,
    );

    props.gradingForm.setFieldsValue({
      rubric_detail: [
        ...filtered,
        {
          rubric_id: props.rubric.id,
          rubric_level_id: levelId,
          rubric_level_no: levelNo,
        },
      ],
    });
  };

  return (
    <div className="bg-background py-5 px-6 rounded-md flex flex-col gap-4">
      <div>
        {props.rubric.weight}% - {props.rubric.criteria}
      </div>

      <FormItem name="rubric_detail">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${levels().length},1fr)` }}
        >
          {levels().map((level) => (
            <div
              key={level.id}
              className={`bg-white px-4 py-2 text-center ${props.action === true ? "cursor-pointer" : ""}`}
              style={{
                backgroundColor:
                  selectedLevel === level.id
                    ? props.color === "blue"
                      ? "#3068D9"
                      : "#F4632A"
                    : "#FFFFFF",
                color: selectedLevel === level.id ? "#FFFFFF" : "#2C3142",
              }}
              onClick={() =>
                props.action && handleOnClick(level.id, level.level_no)
              }
            >
              {level.level_no}
            </div>
          ))}
        </div>
      </FormItem>
    </div>
  );
};

export default RubricCard;
