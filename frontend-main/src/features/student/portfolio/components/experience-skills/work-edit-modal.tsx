import {
  Modal,
  Form,
  Input,
  Select,
  Divider,
  message,
  Spin,
  Upload,
  Image,
} from "antd";
import { getFile } from "../../../../../utils/get-file";
import type { UploadFile } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import Button from "../../../../../components/button/button";
import TextAreaWithCheckbox from "../text-area-with-checkbox";
import { getStudentActivityAttachments } from "../../../../../services/student.service";
import {
  getAllPortfolioSkill,
  createPortfolioSkill,
  assignWorkToSkills,
} from "../../../../../services/portfolio-skill.service";
import type {
  PortfolioWorkResp,
  PortfolioSkillResp,
} from "../../../../../types/portfolio-skill-type.type";

type WorkEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  work: PortfolioWorkResp | null;
  activityName: string;
  subjectInfo: string;
};

import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";

const WorkEditModal = ({
  isOpen,
  onClose,
  onSuccess,
  work,
  activityName,
  subjectInfo,
}: WorkEditModalProps) => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  // Skills state
  const [allSkills, setAllSkills] = useState<PortfolioSkillResp[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  // Inline create-skill
  const [createSkillModalOpen, setCreateSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [creatingSkill, setCreatingSkill] = useState(false);
  const newSkillInputRef = useRef<any>(null);

  // Detail toggles
  const [showRole, setShowRole] = useState(false);
  const [showInit, setShowInit] = useState(false);
  const [showReflec, setShowReflec] = useState(false);

  // Upload states
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [idsToDelete, setIdsToDelete] = useState<number[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const handleRemove = (file: UploadFile) => {
    if (file.url) {
      setIdsToDelete((prev) => [...prev, Number(file.uid)]);
    }
    return true;
  };

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handlePreview = async (file: UploadFile) => {
    let src = file.url as string;
    if (!src) {
      src = await getBase64(file.originFileObj as File);
    }
    const isPdf =
      file.name?.toLowerCase().endsWith(".pdf") ||
      src.startsWith("data:application/pdf");
    if (isPdf) {
      const pdfWindow = window.open("");
      if (pdfWindow) {
        pdfWindow.document.write(
          `<iframe width='100%' height='100%' src='${src}'></iframe>`,
        );
      }
      return;
    }
    setPreviewImage(src);
    setPreviewOpen(true);
  };

  // ── Load all skills on open ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      if (!studentId) return;
      setSkillsLoading(true);
      try {
        const res = await getAllPortfolioSkill(studentId);
        if (res.success) setAllSkills(res.data);
      } catch {
        messageApi.error("ไม่สามารถโหลดทักษะได้");
      } finally {
        setSkillsLoading(false);
      }
    };
    load();
  }, [isOpen, studentId]);

  // ── Populate form from work data ────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !work) {
      form.resetFields();
      setFileList([]);
      setIdsToDelete([]);
      return;
    }
    setShowRole(work.isShowRole);
    setShowInit(work.isShowInit);
    setShowReflec(work.isShowReflec);
    form.setFieldsValue({
      skill_ids: work.skills.map((s) => s.id),
      repository: work.repository,
      role_and_resp: work.role_and_resp,
      init_expect: work.init_expect,
      reflection: work.reflection,
    });

    const fetchAttachments = async () => {
      try {
        const res = await getStudentActivityAttachments(
          work.student_activity_id,
        );
        if (res.success) {
          const files: UploadFile[] = (res.data || []).map(
            (
              a: {
                attachment_id?: number;
                original_filename: string;
                url?: string;
              },
              index: number,
            ) => ({
              uid: String(a.attachment_id || index),
              name: a.original_filename,
              status: "done",
              url: a.url
                ? a.url.startsWith("http")
                  ? a.url
                  : getFile(a.url)
                : undefined,
            }),
          );
          setFileList(files);
        }
      } catch (error) {
        console.error("Failed to fetch attachments", error);
      }
    };
    fetchAttachments();
  }, [isOpen, work, form]);

  // ── Create new skill inline ─────────────────────────────────────────────────
  const handleCreateSkill = async () => {
    const name = newSkillName.trim();
    if (!name) return;
    setCreatingSkill(true);
    try {
      const res = await createPortfolioSkill({ user_id: studentId, name });
      if (res.success) {
        setAllSkills((prev) => [...prev, res.data]);
        const next = [...(form.getFieldValue("skill_ids") || []), res.data.id];
        form.setFieldValue("skill_ids", next);
        messageApi.success(`เพิ่มทักษะ "${name}" เรียบร้อย`);
        setNewSkillName("");
        setCreateSkillModalOpen(false);
      }
    } catch {
      messageApi.error("เกิดข้อผิดพลาดในการสร้างทักษะ");
    } finally {
      setCreatingSkill(false);
    }
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!work) return;
    try {
      const values = await form.validateFields();
      setLoading(true);

      const skillIds: number[] = values.skill_ids || [];
      if (skillIds.length === 0) {
        messageApi.warning("กรุณาเลือกอย่างน้อย 1 ทักษะ");
        return;
      }

      await assignWorkToSkills({
        user_id: studentId,
        student_activity_id: work.student_activity_id,
        skill_ids: skillIds,
        repository: values.repository || undefined,
        role_and_resp: values.role_and_resp || undefined,
        init_expect: values.init_expect || undefined,
        reflection: values.reflection || undefined,
        isShowRole: showRole,
        isShowInit: showInit,
        isShowReflec: showReflec,
        isShowRepo: !!values.repository,
      });

      messageApi.success("แก้ไขข้อมูลผลงานเรียบร้อยแล้ว");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      messageApi.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={
          <div className="my-4">
            <h2 className="body-bold-1 text-primary-orange">
              {activityName || "แก้ไขผลงาน"}
            </h2>
            {subjectInfo && (
              <p className="caption-regular text-primary-grey mt-1">
                {subjectInfo}
              </p>
            )}
          </div>
        }
        open={isOpen}
        onCancel={onClose}
        width={800}
        footer={
          <div className="flex justify-end gap-4 my-4">
            <Button onClick={onClose} variant="secondary">
              ยกเลิก
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={loading}
              className="bg-[#0e305cff] text-white"
            >
              บันทึก
            </Button>
          </div>
        }
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {/* Assign Skills (Same as CreateWorkForm) */}
          <Form.Item
            label="ทักษะที่เกี่ยวข้อง"
            name="skill_ids"
            rules={[{ required: true, message: "กรุณาเลือกอย่างน้อย 1 ทักษะ" }]}
          >
            <Select
              mode="multiple"
              size="large"
              placeholder="เลือกทักษะ (เลือกได้หลายทักษะ)"
              loading={skillsLoading}
              optionFilterProp="label"
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider className="my-1" />
                  <div
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 text-primary-orange font-semibold"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setCreateSkillModalOpen(true);
                      setTimeout(() => newSkillInputRef.current?.focus(), 100);
                    }}
                  >
                    <PlusOutlined />
                    สร้างทักษะใหม่
                  </div>
                </>
              )}
              options={allSkills.map((s) => ({
                label: s.name || "(ไม่มีชื่อ)",
                value: s.id,
              }))}
            />
          </Form.Item>

          {work && (
            <div className="mb-6 p-4 bg-[#F9F9F9] rounded-2xl space-y-4">
              <div>
                <div className="caption-regular text-primary-black mb-2">
                  ไฟล์แนบจากชิ้นงาน:
                </div>
                {/* Replaced WorkAttachmentList with a readonly Upload component */}
                <div className="mt-2">
                  <Upload
                    fileList={fileList} // Using the form's fileList state
                    onChange={({ file, fileList }) => {
                      if (file.status === "uploading") {
                        setFileList(fileList);
                        return;
                      }

                      if (file.size && file.size < 10 * 1024 * 1024) {
                        setFileList(fileList);
                        if (file.status === "done") {
                          messageApi.success("เพิ่มไฟล์สำเร็จ");
                        }
                      } else if (file.size) {
                        messageApi.error("ไฟล์เกินขนาดที่กำหนด");
                        setFileList(fileList.filter((f) => f.uid !== file.uid));
                      } else {
                        setFileList(fileList);
                      }
                    }}
                    onPreview={handlePreview}
                    showUploadList={{ showRemoveIcon: false }}
                    listType="picture-card"
                  />
                </div>
              </div>

              {work.feedback && (
                <div>
                  <div className="caption-regular text-primary-black mb-1">
                    Feedback:
                  </div>
                  <div className="p-3 bg-white border border-[#E9E9E9] rounded-xl caption-regular text-primary-grey whitespace-pre-wrap">
                    {work.feedback}
                  </div>
                </div>
              )}
            </div>
          )}

          <Divider className="my-6" />

          {/* Shared metadata */}
          <Form.Item label="Repository" name="repository">
            <Input size="large" placeholder="เช่น https://github.com/..." />
          </Form.Item>

          <TextAreaWithCheckbox
            label="บทบาทและการทำงานในชิ้นงาน"
            name="role_and_resp"
            isShow={showRole}
            setIsShow={setShowRole}
          />
          <TextAreaWithCheckbox
            label="ความคาดหวังเริ่มแรกเมื่อจะทำชิ้นงาน"
            name="init_expect"
            isShow={showInit}
            setIsShow={setShowInit}
          />
          <TextAreaWithCheckbox
            label="สิ่งที่สะท้อนความคิดจากการทำงาน"
            name="reflection"
            isShow={showReflec}
            setIsShow={setShowReflec}
          />
        </Form>
      </Modal>

      {/* Inline create skill */}
      <Modal
        title={
          <span className="body-bold-1 text-primary-orange">
            สร้างทักษะใหม่
          </span>
        }
        open={createSkillModalOpen}
        onCancel={() => {
          setCreateSkillModalOpen(false);
          setNewSkillName("");
        }}
        footer={
          <div className="flex justify-end gap-4 my-2">
            <Button
              variant="secondary"
              onClick={() => {
                setCreateSkillModalOpen(false);
                setNewSkillName("");
              }}
            >
              ยกเลิก
            </Button>
            <Button
              variant="primary"
              loading={creatingSkill}
              onClick={handleCreateSkill}
              className="bg-[#0e305cff] text-white"
            >
              สร้างทักษะ
            </Button>
          </div>
        }
        width={480}
        destroyOnClose
        zIndex={1050}
      >
        <Input
          ref={newSkillInputRef}
          size="large"
          placeholder="เช่น Web Development"
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          onPressEnter={handleCreateSkill}
          className="mt-4 mb-2"
        />
      </Modal>

      <div style={{ display: "none" }}>
        <Image
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            src: previewImage,
          }}
        />
      </div>
    </>
  );
};

export default WorkEditModal;
