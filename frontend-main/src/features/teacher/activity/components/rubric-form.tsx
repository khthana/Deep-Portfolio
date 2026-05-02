import { useState, type Dispatch, type SetStateAction, useEffect } from "react";
import Button from "../../../../components/button/button";
import RubricTable from "./rubric-table";
import { Form, type FormInstance } from "antd";
import WhiteContainer from "../../../../components/container/white-container";
import type {
  CreateRubricFormType,
  RubricDetailForm,
} from "../types/rubric-type.type";
import type { RubricDetail } from "../../../../types/activity-type.type";

type Props = {
  setOpenModal: Dispatch<SetStateAction<boolean>>;
  rubricForm: FormInstance<CreateRubricFormType>;
  sharedRubricData: RubricDetailForm[];
  onDeleteSharedRubric?: (index: number) => void;
  onUncheckSharedRubric?: (rubricTitleKey: string, detailKey: string) => void;

  edit?: boolean;
  rubricDatail?: RubricDetail[];
};

const RubricForm = (props: Props) => {
  const [scores, setScores] = useState<number[]>([4, 3, 2, 1]);

  const deleteScoreColumn = (scoreToDelete: number) => {
    // ห้ามลบเมื่อเหลือเพียง 4 เลเวล (minimum)
    if (scores.length <= 4) return;

    const newScores = scores.filter((s) => s !== scoreToDelete);

    // Re-level: สร้าง scores ใหม่จาก length ลงมา เช่น 5 items = [5,4,3,2,1]
    const releveledScores = Array.from(
      { length: newScores.length },
      (_, i) => newScores.length - i,
    );

    // สร้าง mapping จาก old score -> new score
    const scoreMapping = new Map<number, number>();
    const oldPositions = scores.map((score, idx) => ({ score, idx }));
    const keptScores = oldPositions.filter((p) => p.score !== scoreToDelete);

    keptScores.forEach((item, newIdx) => {
      scoreMapping.set(item.score, releveledScores[newIdx]);
    });

    setScores(releveledScores);

    // Update ทั้ง rubrics ให้ filter และ re-level ตัว levels
    const currentRows = props.rubricForm.getFieldValue("rubrics") || [];
    const updatedRows = currentRows.map((row: any) => ({
      ...row,
      levels: row.levels
        .filter((level: any) => level.level_no !== scoreToDelete)
        .map((level: any) => ({
          ...level,
          level_no: scoreMapping.get(level.level_no) || level.level_no,
        }))
        .sort((a: any, b: any) => b.level_no - a.level_no),
    }));

    props.rubricForm.setFieldsValue({ rubrics: updatedRows });
  };

  const deleteRow = (index: number) => {
    // ห้ามลบเมื่อเหลือเพียง 1 เกณฑ์ (minimum)
    const currentRows = props.rubricForm.getFieldValue("rubrics") || [];
    if (currentRows.length <= 1) return;

    const deletedRow = currentRows[index];

    // ถ้า rubric นี้มาจาก shared rubric ให้ notify parent
    if (deletedRow?._shared_rubric_index !== undefined) {
      // Uncheck checkbox ใน modal
      if (
        deletedRow._shared_rubric_title_key &&
        deletedRow._shared_rubric_detail_key &&
        props.onUncheckSharedRubric
      ) {
        props.onUncheckSharedRubric(
          deletedRow._shared_rubric_title_key,
          deletedRow._shared_rubric_detail_key,
        );
      }

      // Remove from sharedRubricData
      if (props.onDeleteSharedRubric) {
        props.onDeleteSharedRubric(deletedRow._shared_rubric_index);
      }
    }

    const updatedRows = currentRows.filter((_: any, i: number) => i !== index);
    props.rubricForm.setFieldsValue({ rubrics: updatedRows });
  };

  const addSharedRubricData = () => {
    // เพิ่มเติม shared rubric เข้าไปใน current rubric (ไม่ replace ทั้งหมด)
    const currentRows = props.rubricForm.getFieldValue("rubrics") || [];

    // Filter ออกเกณฑ์ที่มาจาก shared rubric
    const manualRubrics = currentRows.filter(
      (row: any) => row._shared_rubric_index === undefined,
    );

    // Map shared rubric ใหม่
    const updatedSharedRubrics = props.sharedRubricData.map((rubric, index) => {
      const existingLevelNos = rubric.levels.map((lvl) => lvl.level_no);

      const additionalLevels = scores
        .filter((score) => !existingLevelNos.includes(score))
        .map((score) => ({
          level_no: score,
          description: "",
        }));

      if (additionalLevels.length === 0) {
        return {
          ...rubric,
          _shared_rubric_index: index,
        };
      }

      return {
        ...rubric,
        _shared_rubric_index: index,
        levels: [...additionalLevels, ...rubric.levels].sort(
          (a, b) => b.level_no - a.level_no,
        ),
      };
    });

    // Merge: shared rubric + manual rubric
    const mergedRubrics = [...updatedSharedRubrics, ...manualRubrics];

    props.rubricForm.setFieldsValue({
      rubrics: mergedRubrics,
    });
  };

  const handleInitEditForm = () => {
    if (!props.rubricDatail) return;

    const mappedRubrics = (props.rubricDatail || []).map((r) => ({
      criteria: r.criteria,
      weight: r.weight ?? 0,
      levels: (r.rubric_levels || [])
        .map((lvl) => ({
          level_no: lvl.level_no,
          description: lvl.description,
        }))
        .sort((a: any, b: any) => b.level_no - a.level_no),
    }));
    console.log("mappedRubrics : ", mappedRubrics);

    const maxScore = Math.max(...mappedRubrics.map((r) => r.levels.length));
    const newScores = Array.from({ length: maxScore }, (_, i) => maxScore - i);

    setScores(newScores);

    props.rubricForm.setFieldValue(
      "rubrics",
      mappedRubrics.length > 0 ? mappedRubrics : undefined,
    );
  };

  useEffect(() => {
    addSharedRubricData();
  }, [props.sharedRubricData]);

  const addScoreColumn = () => {
    const maxScore = Math.max(...scores);
    const newScore = maxScore + 1;
    const newScores = [newScore, ...scores];
    setScores(newScores);

    const currentRows = props.rubricForm.getFieldValue("rubrics") || [];

    const updatedRows = currentRows.map((row: any) => ({
      ...row,
      levels: [{ level_no: newScore, description: "" }, ...(row.levels || [])],
    }));

    props.rubricForm.setFieldsValue({ rubrics: updatedRows });
  };

  const addRow = () => {
    const currentRows = props.rubricForm.getFieldValue("rubrics") || [];

    const newRow = {
      weight: 0,
      criteria: "",
      levels: scores.map((score) => ({
        level_no: score,
        description: "",
      })),
    };

    props.rubricForm.setFieldsValue({
      rubrics: [...currentRows, newRow],
    });
  };

  const getFirstErrorMessage = () => {
    const errors = props.rubricForm.getFieldsError();

    const rubricFieldError = errors.find(
      (e) => e.name[0] === "rubrics" && e.errors.length > 0,
    );
    if (rubricFieldError) {
      return "กรุณากรอกข้อมูลเกณฑ์การประเมินให้ครบถ้วน";
    }

    const expectedLevelError = errors.find(
      (e) => e.name[0] === "expected_level" && e.errors.length > 0,
    );
    if (expectedLevelError) {
      return "กรุณาเลือกระดับที่คาดหวัง";
    }

    const weightError = errors.find(
      (e) => e.name[0] === "total_weight_validator" && e.errors.length > 0,
    );
    if (weightError) {
      return weightError.errors[0];
    }

    return null;
  };

  useEffect(() => {
    if (props.edit) {
      handleInitEditForm();
    } else {
      const initialRow = {
        weight: 0,
        criteria: "",
        levels: scores.map((score) => ({
          level_no: score,
          description: "",
        })),
      };

      props.rubricForm.setFieldsValue({
        rubrics: [initialRow],
      });
    }
  }, [props.rubricDatail, props.edit]);

  return (
    <WhiteContainer>
      <Form form={props.rubricForm} component={false}>
        <div className="pb-5 border-b border-light-grey flex justify-between">
          <div className="body-bold-1">เกณฑ์การประเมิน</div>
          <div className="flex gap-8">
            {!props.edit && (
              <Button
                variant="secondary"
                className="rounded-4xl"
                iconSrc="/assets/course/add-icon.svg"
                onClick={() => props.setOpenModal(true)}
              >
                Rubric กลาง
              </Button>
            )}
            <Button
              variant="secondary"
              className="rounded-4xl"
              iconSrc="/assets/course/add-icon.svg"
              onClick={addRow}
            >
              เพิ่มเกณฑ์
            </Button>
            <Button
              variant="secondary"
              className="rounded-4xl"
              iconSrc="/assets/course/add-icon.svg"
              onClick={addScoreColumn}
            >
              เพิ่มช่วงคะแนน
            </Button>
          </div>
        </div>

        <RubricTable
          scores={scores}
          rubricForm={props.rubricForm}
          onDeleteScore={deleteScoreColumn}
          onDeleteRow={deleteRow}
          minScoresLength={4}
          expectedLevel={props.rubricForm.getFieldValue("expected_level")}
        />

        <div className="flex justify-end ">
          <Form.Item shouldUpdate noStyle>
            {() => {
              const errorMessage = getFirstErrorMessage();

              return errorMessage ? (
                <div className="text-red-500">{errorMessage}</div>
              ) : null;
            }}
          </Form.Item>
        </div>
      </Form>
    </WhiteContainer>
  );
};

export default RubricForm;
