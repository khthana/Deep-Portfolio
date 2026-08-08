import { Modal } from "antd";
import SharedRubricTitleTable from "./shared-rubric-title-table";
import { useState, type SetStateAction, type Dispatch } from "react";
import SharedRubricDetailTable from "./shared-rubric-detail-table";
import type { RubricDetailForm } from "../types/rubric-type.type";

type Props = {
  openRubricModal: boolean;
  setOpenRubricModal: Dispatch<SetStateAction<boolean>>;
  setSharedRubricData: Dispatch<SetStateAction<RubricDetailForm[]>>;
  selectedRowKeysByRubric: Record<string, React.Key[]>;
  setSelectedRowKeysByRubric: Dispatch<
    SetStateAction<Record<string, React.Key[]>>
  >;
  onDeleteRubricFromForm?: (rubricTitleKey: string, detailKey: string) => void;
};

const SharedRubricModal = (props: Props) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const handleSelectedKey = (key: string) => {
    setSelectedKey(key);
  };

  return (
    <Modal
      open={props.openRubricModal}
      onCancel={() => {
        props.setOpenRubricModal(false);
        setSelectedKey(null);
      }}
      width={1500}
      footer={null}
    >
      <div className="body-bold-3 pb-5 border-b border-light-grey flex items-center gap-2">
        {selectedKey && (
          <div onClick={() => setSelectedKey(null)} className="cursor-pointer">
            <img src="/assets/portfolio/black-back-icon.svg" alt="back icon" />
          </div>
        )}
        <div>เกณฑ์การประเมินกลาง</div>
      </div>

      <div className="relative w-full overflow-hidden mt-6">
        <div
          className={`flex w-[200%] transition-transform duration-500 ease-in-out
            ${selectedKey ? "-translate-x-1/2" : "translate-x-0"}
          `}
        >
          <div className="w-1/2 ">
            <SharedRubricTitleTable handleSelectedKey={handleSelectedKey} />
          </div>

          <div className="w-1/2">
            {selectedKey && (
              <SharedRubricDetailTable
                selectedKey={Number(selectedKey)}
                onBack={() => setSelectedKey(null)}
                setSharedRubricData={props.setSharedRubricData}
                setOpenRubricModal={props.setOpenRubricModal}
                selectedRowKeys={
                  props.selectedRowKeysByRubric[selectedKey] || []
                }
                setSelectedRowKeys={(newKeys) => {
                  props.setSelectedRowKeysByRubric((prev) => ({
                    ...prev,
                    [selectedKey]: newKeys,
                  }));
                }}
                onDeleteRubricFromForm={props.onDeleteRubricFromForm}
              />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SharedRubricModal;
