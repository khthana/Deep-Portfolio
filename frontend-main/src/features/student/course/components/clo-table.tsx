import { Table, type TableProps } from "antd";
import WhiteContainer from "../../../../components/container/white-container";
import { fetchCLO } from "../stores/course-action";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";

type DataType = {
  key: string;
  clo: number;
  desc: string;
};

const columns: TableProps<DataType>["columns"] = [
  {
    title: "CLO",
    dataIndex: "clo",
    key: "clo",
    render: (text) => <div className="caption-bold">CLO-{text}</div>,
    align: "center",
    width: "10%",
  },
  {
    title: "ผลการเรียนรู้",
    dataIndex: "desc",
    key: "desc",
    render: (text) => <div className="text-left">{text}</div>,
    align: "center",
    width: "90%",
  },
];

const CLOTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const courseSlice = useSelector((state: RootState) => state.studentCourse);

  const [data, setData] = useState<DataType[]>([]);

  const handleFetchData = async () => {
    if (!courseSlice.selectedCourse) return;

    const result = await dispatch(
      fetchCLO(courseSlice.selectedCourse.section_id),
    ).unwrap();

    const mappedData = result.data.map((clo) => ({
      key: clo.clo_id.toString(),
      clo: parseInt(clo.clo_number),
      desc: clo.clo_detail,
    }));

    setData(mappedData);
  };

  useEffect(() => {
    handleFetchData();
  }, [courseSlice.selectedCourse]);

  return (
    <WhiteContainer>
      <div className="body-bold-1 pb-5 border-b border-light-grey">
        ผลการเรียนรู้ระดับรายวิชา
      </div>

      <Table<DataType>
        columns={columns}
        dataSource={data}
        bordered
        rowHoverable={false}
        pagination={false}
        scroll={{ x: 1000 }}
      />
    </WhiteContainer>
  );
};

export default CLOTable;
