import { Table, type TableProps } from "antd";
import WhiteContainer from "../../../../components/container/white-container";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { fetchScoreWeight } from "../stores/course-action";

type DataType = {
  key: string;
  title: string;
  weight: number;
};

const columns: TableProps<DataType>["columns"] = [
  {
    title: "หัวข้อ",
    dataIndex: "title",
    key: "title",
    render: (text) => <div className="caption-bold text-left">{text}</div>,
    align: "center",
    width: "70%",
  },
  {
    title: "น้ำหนัก (%)",
    dataIndex: "weight",
    key: "weight",
    render: (text) => <div className="text-center">{text}</div>,
    align: "center",
    width: "30%",
  },
];

const ScoreWeightTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const courseSlice = useSelector((state: RootState) => state.studentCourse);

  const [data, setData] = useState<DataType[]>([]);

  const handleFetchData = async () => {
    if (!courseSlice.selectedCourse) return;

    const result = await dispatch(
      fetchScoreWeight(courseSlice.selectedCourse.section_id),
    ).unwrap();

    const mappedData = result.data.map((score) => ({
      key: score.score_ratio_id.toString(),
      title: score.score_category,
      weight: score.weight,
      id: score.score_ratio_id,
    }));

    setData(mappedData);
  };

  useEffect(() => {
    handleFetchData();
  }, [courseSlice.selectedCourse]);

  return (
    <WhiteContainer>
      <div className="body-bold-1 pb-5 border-b border-light-grey">
        สัดส่วนคะแนน
      </div>

      <Table<DataType>
        columns={columns}
        dataSource={data}
        bordered
        rowHoverable={false}
        pagination={false}
        scroll={{ x: 600 }}
      />
    </WhiteContainer>
  );
};

export default ScoreWeightTable;
