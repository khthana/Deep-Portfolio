import {
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Radio,
  type FormInstance,
} from "antd";
import { useEffect, useState } from "react";
import type { CreateRubricFormType } from "../types/rubric-type.type";

type Props = {
  rubricForm: FormInstance<CreateRubricFormType>;
  scores: number[];
  onDeleteScore: (score: number) => void;
  onDeleteRow: (index: number) => void;
  minScoresLength: number;

  expectedLevel?: number;
};

const RubricTable = (props: Props) => {
  const { TextArea } = Input;
  const [expectedLevel, setExpectedLevel] = useState<number>();

  const handleExpectedLevel = (score: number) => {
    setExpectedLevel(score);

    props.rubricForm.setFieldsValue({ expected_level: score });
  };

  useEffect(() => {
    if (props.expectedLevel) setExpectedLevel(props.expectedLevel);
  }, [props.expectedLevel]);

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="grid border  border-light-grey rounded-t-2xl caption-bold text-secondary-blue"
        style={{
          gridTemplateColumns: `100px 1fr ${props.scores.length}fr${
            props.rubricForm.getFieldValue("rubrics")?.length > 1 ? " 40px" : ""
          }`,

          backgroundColor: "rgb(48, 104, 217, 0.15)",
        }}
      >
        <div className="px-4 py-6 border-r border-light-grey flex items-end">
          น้ำหนัก
        </div>

        <div className="px-4 py-6 border-r border-light-grey flex items-end">
          เกณฑ์การประเมิน
        </div>
        <div className="flex flex-col">
          <div className="px-4 py-6  border-b border-light-grey text-center">
            คะแนน
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${props.scores.length}, 1fr)`,
            }}
          >
            {props.scores.map((score) => (
              <div
                key={score}
                className="flex gap-2 px-4 py-6 justify-center items-center border-r border-light-grey"
                style={{
                  backgroundColor: expectedLevel === score ? "#3B8B5C" : "",
                }}
              >
                <Form.Item
                  name="expected_level"
                  noStyle
                  rules={[{ required: true, message: "" }]}
                >
                  <Radio
                    onChange={() => handleExpectedLevel(score)}
                    checked={expectedLevel === score}
                    className="my-custom-radio"
                  />
                </Form.Item>

                <div
                  className={`rounded-[10px] bg-white px-4 py-2 border border-light-grey `}
                >
                  {score}
                </div>

                {props.scores.length > props.minScoresLength && (
                  <Popconfirm
                    title="ต้องการลบใช่หรือไม่"
                    onConfirm={() => props.onDeleteScore(score)}
                  >
                    <img
                      src="/assets/course/delete-icon.svg"
                      alt="delete icon"
                      width={16}
                      className="cursor-pointer"
                    />
                  </Popconfirm>
                )}
              </div>
            ))}
          </div>
        </div>

        {props.rubricForm.getFieldValue("rubrics")?.length > 1 && (
          <div className="px-4 py-6 border-l border-light-grey flex items-end justify-center">
            {/* <span className="text-xs text-gray-500">การกระทำ</span> */}
          </div>
        )}
      </div>

      <Form.List name="rubrics">
        {(fields) => (
          <div
            className="grid border border-light-grey"
            style={{
              gridTemplateColumns: `100px 1fr repeat(${props.scores.length}, 1fr)${
                fields.length > 1 ? " 40px" : ""
              }`,
            }}
          >
            {fields.map((field, index) => (
              <div key={field.key} className="contents">
                <div className="p-4 border-light-grey border-t border-r">
                  <Form.Item
                    name={[field.name, "weight"]}
                    rules={[
                      { required: true, message: "" },
                      {
                        validator: (_, v) =>
                          v > 0 ? Promise.resolve() : Promise.reject(""),
                      },
                    ]}
                    noStyle
                  >
                    <InputNumber
                      suffix="%"
                      style={{ width: "100%" }}
                      placeholder="20"
                      controls={false}
                      min={0}
                      max={100}
                      status={
                        props.rubricForm.getFieldError([
                          "rubrics",
                          field.name,
                          "weight",
                        ]).length > 0
                          ? "error"
                          : ""
                      }
                    />
                  </Form.Item>
                </div>

                <div className="p-3 border-light-grey border-t border-r">
                  <Form.Item
                    name={[field.name, "criteria"]}
                    rules={[{ required: true, message: "" }]}
                    noStyle
                  >
                    <TextArea
                      autoSize
                      status={
                        props.rubricForm.getFieldError([
                          "rubrics",
                          field.name,
                          "criteria",
                        ]).length > 0
                          ? "error"
                          : ""
                      }
                    />
                  </Form.Item>
                </div>

                {props.scores.map((score, colIndex) => (
                  <div
                    key={`${field.key}-level-${colIndex}`}
                    className="p-3 border-light-grey bg-white hover:bg-gray-100 border-t border-r"
                  >
                    <Form.Item
                      name={[field.name, "levels", colIndex, "description"]}
                      noStyle
                    >
                      <TextArea autoSize />
                    </Form.Item>

                    <Form.Item
                      name={[field.name, "levels", colIndex, "level_no"]}
                      initialValue={score}
                      hidden
                    >
                      <Input />
                    </Form.Item>
                  </div>
                ))}

                {fields.length > 1 && (
                  <div className="p-3 border-light-grey border-t border-r flex items-center justify-center bg-white">
                    <Popconfirm
                      title="ต้องการลบใช่หรือไม่"
                      onConfirm={() => props.onDeleteRow(index)}
                    >
                      <img
                        src="/assets/course/delete-icon.svg"
                        alt="delete icon"
                        width={18}
                        className="cursor-pointer hover:opacity-70 transition-opacity"
                      />
                    </Popconfirm>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Form.List>

      <Form.Item shouldUpdate noStyle>
        {({ getFieldValue }) => {
          return (
            <Form.Item
              hidden
              name="total_weight_validator"
              rules={[
                {
                  validator: () => {
                    const rubrics = getFieldValue("rubrics") || [];

                    const totalWeight = rubrics.reduce(
                      (sum: number, r: any) => sum + (Number(r?.weight) || 0),
                      0,
                    );

                    if (totalWeight !== 100) {
                      return Promise.reject(
                        new Error("น้ำหนักรวมของทุกเกณฑ์ต้องเท่ากับ 100%"),
                      );
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            ></Form.Item>
          );
        }}
      </Form.Item>
    </div>
  );
};

export default RubricTable;
