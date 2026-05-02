import { useMemo } from "react";
import { Table, type TableProps } from "antd";
import WhiteContainer from "../../../../../components/container/white-container";
import type { RubricDetail } from "../../../../../types/activity-type.type";

type Props = {
  rubrics: RubricDetail[];
  expected_level: number;
  color?: "blue" | "orange";
};

type DataType = {
  key: number;
  desc: string;
  [key: string]: string | number;
};

const RubricTable = ({ rubrics, expected_level, color = "orange" }: Props) => {
  const { tableDataSource, tableColumns } = useMemo(() => {
    if (!rubrics || rubrics.length === 0) {
      return { tableDataSource: [], tableColumns: [] };
    }

    const allLevels = new Set<number>();
    rubrics.forEach((r) => {
      r.rubric_levels.forEach((l) => allLevels.add(l.level_no));
    });

    const sortedLevels = Array.from(allLevels).sort((a, b) => b - a);

    const dataSource: DataType[] = rubrics.map((item) => {
      const row: DataType = {
        key: item.id,
        desc: item.criteria,
      };

      item.rubric_levels.forEach((l) => {
        row[`level_${l.level_no}`] = l.description;
      });

      return row;
    });

    const dynamicLevelColumns: TableProps<DataType>["columns"] =
      sortedLevels.map((levelNo) => ({
        title: `${levelNo}`,
        dataIndex: `level_${levelNo}`,
        key: `level_${levelNo}`,
        align: "center",
        width: 150,
        render: (text) => (
          <div className="text-left caption-regular text-primary-black">
            {text || "-"}
          </div>
        ),
        onHeaderCell: () => ({
          style:
            levelNo === expected_level
              ? { backgroundColor: "#3B8B5C", color: "#fff" }
              : undefined,
        }),
      }));

    const columns: TableProps<DataType>["columns"] = [
      {
        title: "เกณฑ์การประเมิน",
        dataIndex: "desc",
        key: "desc",
        align: "center",
        width: 200,
        render: (text) => (
          <div className="text-left caption-bold text-primary-black">
            {text}
          </div>
        ),
      },
      ...dynamicLevelColumns,
    ];

    return { tableDataSource: dataSource, tableColumns: columns };
  }, [rubrics]);

  if (!rubrics || rubrics.length === 0) return null;

  return (
    <WhiteContainer>
      <div className="pb-5 border-b border-light-grey flex gap-5">
        <div className="body-bold-1">เกณฑ์การประเมิน</div>
        <div className="flex gap-2 items-center">
          <div className="rounded-full w-5 h-5 bg-primary-green"></div>
          <div className="caption-bold text-primary-green">ระดับที่คาดหวัง</div>
        </div>
      </div>

      <Table<DataType>
        columns={tableColumns}
        dataSource={tableDataSource}
        bordered
        pagination={false}
        rowHoverable={false}
        scroll={{ x: "1200px" }}
        className={`ical-align-top-table custom-table ${color}`}
      />
    </WhiteContainer>
  );
};

export default RubricTable;
