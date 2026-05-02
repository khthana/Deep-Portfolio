import {
  Form,
  Input,
  Select,
  Modal,
  message,
  Spin,
  Divider,
  Upload,
  Image,
} from "antd";
import type { UploadFile, InputRef } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../../../components/button/button";
import TextAreaWithCheckbox from "../text-area-with-checkbox";
import {
  getAllPortfolioSkill,
  createPortfolioSkill,
  assignWorkToSkills,
} from "../../../../../services/portfolio-skill.service";
import {
  getEnrolledSubjects,
  getActivitiesBySectionId,
  getActivityDetails,
  getStudentActivityAttachments,
  type EnrolledSubject,
  type ActivityOption,
} from "../../../../../services/student.service";
import { paths } from "../../../../../routes/paths.config";
import type { PortfolioSkillResp } from "../../../../../types/portfolio-skill-type.type";

import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";
import { getFile } from "../../../../../utils/get-file";

const CreateWorkForm = () => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  // Subject / Activity
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [subjects, setSubjects] = useState<EnrolledSubject[]>([]);
  const [activities, setActivities] = useState<ActivityOption[]>([]);

  // Work preview (feedback)
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Skills multi-select
  const [skills, setSkills] = useState<PortfolioSkillResp[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  // Inline "create new skill" modal
  const [createSkillModalOpen, setCreateSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [creatingSkill, setCreatingSkill] = useState(false);

  // Details toggles
  const [showRole, setShowRole] = useState(true);
  const [showInit, setShowInit] = useState(true);
  const [showReflec, setShowReflec] = useState(true);

  const studentActivityId = Form.useWatch("student_activity_id", form);

  // Ref for new-skill input auto-focus
  const newSkillInputRef = useRef<InputRef>(null);

  // Upload states
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

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

  // ── Fetch subjects on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setSubjectsLoading(true);
      try {
        const res = await getEnrolledSubjects(studentId);
        if (res.success) setSubjects(res.data);
      } catch {
        messageApi.error("ไม่สามารถโหลดรายวิชาได้");
      } finally {
        setSubjectsLoading(false);
      }
    };
    load();
  }, [studentId]);

  // ── Fetch all skills on mount ───────────────────────────────────────────────
  useEffect(() => {
    const loadSkills = async () => {
      if (!studentId) return;
      setSkillsLoading(true);
      try {
        const res = await getAllPortfolioSkill(studentId);
        if (res.success) setSkills(res.data);
      } catch {
        messageApi.error("ไม่สามารถโหลดทักษะได้");
      } finally {
        setSkillsLoading(false);
      }
    };
    loadSkills();
  }, [studentId]);

  // ── Fetch feedback when activity is selected ──────────────────
  useEffect(() => {
    if (!studentActivityId) {
      setFeedback(null);
      setFileList([]);
      return;
    }

    const load = async () => {
      setDetailsLoading(true);
      try {
        const detailsRes = await getActivityDetails(studentActivityId);
        if (detailsRes.success) {
          setFeedback(detailsRes.data?.feedback || null);
        }

        const attachRes =
          await getStudentActivityAttachments(studentActivityId);
        if (attachRes.success) {
          const files: UploadFile[] = (attachRes.data || []).map(
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
                  : getFile(a.url ?? "")
                : undefined,
            }),
          );
          setFileList(files);
        }
      } catch {
        /* silent */
      } finally {
        setDetailsLoading(false);
      }
    };
    load();
  }, [studentActivityId]);

  // ── Subject change ──────────────────────────────────────────────────────────
  const handleSubjectChange = async (sectionId: number) => {
    form.resetFields(["student_activity_id"]);
    setActivities([]);
    setFeedback(null);
    setFileList([]);
    setActivitiesLoading(true);
    try {
      const res = await getActivitiesBySectionId(sectionId, studentId);
      if (res.success) setActivities(res.data);
    } catch {
      messageApi.error("ไม่สามารถโหลดชิ้นงานได้");
    } finally {
      setActivitiesLoading(false);
    }
  };

  // ── Create new skill on the fly ─────────────────────────────────────────────
  const handleCreateSkill = async () => {
    const name = newSkillName.trim();
    if (!name) return;
    setCreatingSkill(true);
    try {
      const res = await createPortfolioSkill({ user_id: studentId, name });
      if (res.success) {
        const created = res.data;
        setSkills((prev) => [...prev, created]);

        // Auto-select the newly created skill
        const current: number[] = form.getFieldValue("skill_ids") || [];
        form.setFieldValue("skill_ids", [...current, created.id]);

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
    try {
      const values = await form.validateFields();
      setLoading(true);

      await assignWorkToSkills({
        user_id: studentId,
        student_activity_id: values.student_activity_id,
        skill_ids: values.skill_ids,
        repository: values.repository || undefined,
        role_and_resp: values.role_and_resp || undefined,
        init_expect: values.init_expect || undefined,
        reflection: values.reflection || undefined,
        isShowRole: showRole,
        isShowInit: showInit,
        isShowReflec: showReflec,
        isShowRepo: !!values.repository,
      });

      messageApi.success("เพิ่มข้อมูลผลงานเรียบร้อยแล้ว");
      navigate(paths.student.portfolio.experienceSkills.list);
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "errorFields" in err) {
        return;
      }
      messageApi.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Form form={form} layout="vertical">
        {/* Step 1 – Pick Work */}
        <div className="grid grid-cols-2 gap-8">
          <Form.Item label="รายวิชา" name="section_id">
            <Select
              size="large"
              placeholder="เลือกรายวิชา"
              loading={subjectsLoading}
              onChange={handleSubjectChange}
              options={subjects.map((s) => ({
                label: s.subject_name_th || s.subject_name_en,
                value: s.section_id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="ชิ้นงาน"
            name="student_activity_id"
            rules={[{ required: true, message: "กรุณาเลือกชิ้นงาน" }]}
          >
            <Select
              size="large"
              placeholder="เลือกชิ้นงาน"
              loading={activitiesLoading}
              notFoundContent={
                activitiesLoading ? (
                  <Spin size="small" />
                ) : (
                  <span className="text-gray-400">ไม่มีชิ้นงาน</span>
                )
              }
              options={activities
                .filter((a) => a.student_activity_id !== null)
                .map((a) => ({
                  label: a.activity_name,
                  value: a.student_activity_id,
                  disabled:
                    a.status === "NOT_SUBMITTED" || !a.student_activity_id,
                }))}
            />
          </Form.Item>
        </div>

        {/* Work preview panel */}
        {studentActivityId && (
          <div className="mb-6 p-4 bg-[#F9F9F9] rounded-2xl">
            {detailsLoading ? (
              <div className="flex justify-center p-4">
                <Spin />
              </div>
            ) : (
              <div className="space-y-4">
                <Form.Item label="ไฟล์แนบจากชิ้นงาน" className="mb-0">
                  <div className="mt-2">
                    <Upload
                      fileList={fileList}
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
                          setFileList(
                            fileList.filter((f) => f.uid !== file.uid),
                          );
                        } else {
                          setFileList(fileList);
                        }
                      }}
                      onPreview={handlePreview}
                      showUploadList={{ showRemoveIcon: false }}
                      listType="picture-card"
                    />
                  </div>
                </Form.Item>

                {feedback && (
                  <div>
                    <div className="caption text-primary-black mb-1">
                      Feedback
                    </div>
                    <div className="p-3 bg-white border border-[#E9E9E9] rounded-xl caption-regular text-primary-grey whitespace-pre-wrap">
                      {feedback}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Divider className="my-6" />

        {/* Step 2 – Assign Skills */}
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
            options={skills.map((s) => ({
              label: s.name || "(ไม่มีชื่อ)",
              value: s.id,
            }))}
          />
        </Form.Item>

        <Divider className="my-6" />

        {/* Step 3 – Details */}
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

        <div className="text-end mt-2">
          <Button onClick={handleSave} loading={loading}>
            บันทึก
          </Button>
        </div>
      </Form>

      {/* Inline "create skill" modal */}
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

export default CreateWorkForm;
