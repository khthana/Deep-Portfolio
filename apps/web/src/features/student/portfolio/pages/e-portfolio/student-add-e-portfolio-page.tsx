import {
  Breadcrumb,
  Form,
  Input,
  Select,
  Table,
  message,
  Checkbox,
  ColorPicker,
  Spin,
} from "antd";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WhiteContainer from "../../../../../components/container/white-container";
import Button from "../../../../../components/button/button";
import { paths } from "../../../../../routes/paths.config";
import BackButton from "../../../../../components/button/back-button";
import { getAllPortfolioSkill } from "../../../../../services/portfolio-skill.service";
import {
  createPortfolio,
  getAllTemplates,
  type CreatePortfolioReq,
  type PortfolioTemplate,
} from "../../../../../services/portfolio.service";
import type { PortfolioSkillResp } from "../../../../../types/portfolio-skill-type.type";

type ConfigDataType = {
  key: string;
  no: number;
  dataName: string;
  isShow: boolean;
  isHeader?: boolean;
};

interface FormValues {
  portfolioName: string;
  templateName: string;
  templateColor: string | { toHexString: () => string };
  about_me: string;
}

import { useSelector } from "react-redux";
import type { RootState } from "../../../../../stores/stores";

const StudentAddEPortfolioPage = () => {
  const { studentId } = useSelector((state: RootState) => state.home);
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [configData, setConfigData] = useState<ConfigDataType[]>([]);
  const [skills, setSkills] = useState<PortfolioSkillResp[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<PortfolioTemplate[]>([]);

  useEffect(() => {
    // Initial config for new portfolio
    const initialConfig: ConfigDataType[] = [
      {
        key: "personal",
        no: 1,
        dataName: "ข้อมูลส่วนตัว",
        isShow: true,
      },
      {
        key: "education",
        no: 2,
        dataName: "ประวัติการศึกษา",
        isShow: true,
      },
      {
        key: "training",
        no: 3,
        dataName: "การฝึกอบรม",
        isShow: true,
      },
      {
        key: "certificate",
        no: 4,
        dataName: "คุณวุฒิทางวิชาชีพ",
        isShow: true,
      },
      {
        key: "skill",
        no: 5,
        dataName: "ทักษะ",
        isShow: true,
      },
      {
        key: "intern",
        no: 6,
        dataName: "การฝึกงาน/สหกิจศึกษา",
        isShow: true,
      },
      {
        key: "thesis",
        no: 7,
        dataName: "โครงงานปริญญาตรี",
        isShow: true,
      },
      {
        key: "award",
        no: 8,
        dataName: "รางวัลและการแข่งขัน",
        isShow: true,
      },
      {
        key: "activity",
        no: 9,
        dataName: "กิจกรรม",
        isShow: true,
      },
    ];
    setConfigData(initialConfig);

    const fetchSkills = async () => {
      if (!studentId) return;
      try {
        const res = await getAllPortfolioSkill(studentId);
        if (res.success) {
          setSkills(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch skills:", error);
      }
    };

    const fetchTemplates = async () => {
      if (!studentId) return;
      try {
        const res = await getAllTemplates();
        if (res.success) {
          setTemplates(res.data);
          // Default to Standard if exists, otherwise first template
          const standard = res.data.find((t) => t.name === "Standard");
          if (standard) {
            form.setFieldsValue({ templateName: "Standard" });
          } else if (res.data.length > 0) {
            form.setFieldsValue({ templateName: res.data[0].name });
          }
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      }
    };

    fetchSkills();
    fetchTemplates();
  }, [form, studentId]);

  const handleCheckboxChange = (key: string, checked: boolean) => {
    setConfigData((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, isShow: checked } : item,
      ),
    );
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const visibilityFlags: Record<string, boolean> = {};
      configData.forEach((item) => {
        const flagKey = `isShow${item.key.charAt(0).toUpperCase()}${item.key.slice(1)}`;
        visibilityFlags[flagKey] = item.isShow;
      });

      const templateColor =
        typeof values.templateColor === "string"
          ? values.templateColor
          : values.templateColor?.toHexString?.() || "#0e305cff";

      const selectedTemplate = templates.find(
        (t) => t.name === values.templateName,
      );

      const payload = {
        user_id: studentId,
        portfolio_name: values.portfolioName,
        template_color: templateColor,
        about_me: values.about_me,
        template_id: selectedTemplate?.id || 1,
        selectedSkillIds: selectedSkillIds,
        ...visibilityFlags,
      } as CreatePortfolioReq;

      const res = await createPortfolio(payload);

      if (res.success) {
        messageApi.success("สร้าง Portfolio เรียบร้อย");
        setTimeout(() => {
          navigate(paths.student.portfolio.ePortfolio.list);
        }, 1000);
      } else {
        messageApi.error(res.message || "เกิดข้อผิดพลาดในการสร้าง Portfolio");
      }
    } catch (error) {
      console.error("Save error:", error);
      messageApi.error("กรุณากรอกข้อมูลให้ครบถ้วน");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "ลำดับที่",
      dataIndex: "no",
      key: "no",
      align: "center" as const,
      width: 100,
    },
    {
      title: "ชื่อข้อมูล",
      dataIndex: "dataName",
      key: "dataName",
    },
    {
      title: "แสดงข้อมูล",
      dataIndex: "isShow",
      key: "isShow",
      align: "center" as const,
      width: 150,
      render: (checked: boolean, record: ConfigDataType) => (
        <Checkbox
          checked={checked}
          onChange={(e) => handleCheckboxChange(record.key, e.target.checked)}
        />
      ),
    },
    {
      title: "รายละเอียดเพิ่มเติม",
      key: "detail",
      width: 500,
      render: (_unknown: unknown, record: ConfigDataType) => {
        if (record.key === "skill") {
          return (
            <Select
              mode="multiple"
              placeholder="เลือกทักษะ"
              className="w-full"
              value={selectedSkillIds}
              onChange={(values: number[]) => setSelectedSkillIds(values)}
              options={skills.map((s) => ({ label: s.name, value: s.id }))}
              disabled={!record.isShow}
            />
          );
        }
        return null;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {contextHolder}
      <Breadcrumb
        className="breadcrumb-bold"
        separator=">"
        items={[
          { title: "แฟ้มผลงาน" },
          {
            title: "e-Portfolio",
            // custom navigation to avoid full reload if href is used with normal anchor
            onClick: () => navigate(paths.student.portfolio.ePortfolio.list),
            className: "cursor-pointer",
          },
          { title: "เพิ่ม e-Portfolio" },
        ]}
      />
      <div className="flex items-center">
        <BackButton
          href="/student/portfolio/e-portfolio"
          title=""
          color="black"
        />
        <h2 className="body-bold-1">เพิ่ม e-Portfolio</h2>
      </div>
      <WhiteContainer>
        <div className="flex flex-col gap-4">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              templateName: "Standard",
              templateColor: "#1A2A5D",
            }}
          >
            <div className="flex gap-4">
              <Form.Item
                label="ชื่อ Portfolio"
                name="portfolioName"
                rules={[{ required: true, message: "กรุณากรอกชื่อ Portfolio" }]}
                className="basis-2/5"
              >
                <Input placeholder="กรอกชื่อ Portfolio" />
              </Form.Item>

              <Form.Item
                label="Portfolio Template"
                name="templateName"
                rules={[{ required: true, message: "กรุณาเลือก Template" }]}
                className="basis-2/5"
              >
                <Select
                  disabled={templates.length <= 1}
                  placeholder="เลือก Template"
                  options={templates.map((t) => ({
                    value: t.name,
                    label: t.name,
                  }))}
                />
              </Form.Item>

              <Form.Item
                label="สีของ Template"
                name="templateColor"
                rules={[{ required: true, message: "กรุณาเลือกสี Template" }]}
                initialValue="#0e305cff"
                className="basis-1/5"
              >
                <ColorPicker
                  showText
                  format="hex"
                  disabledAlpha
                  className="w-full justify-start"
                />
              </Form.Item>
            </div>

            <Form.Item label="About Me" name="about_me" className="w-full">
              <Input.TextArea placeholder="แนะนำตัวเอง" rows={4} />
            </Form.Item>
          </Form>

          <div>
            <h3 className="mb-2 caption-regular">จัดการข้อมูล</h3>
            <Table
              dataSource={configData}
              columns={columns}
              pagination={false}
              bordered
              rowKey="key"
            />
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <Button
              onClick={() => navigate(-1)}
              variant="secondary"
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="bg-[#0e305cff] text-white"
              loading={loading}
            >
              บันทึก
            </Button>
          </div>
        </div>
      </WhiteContainer>
    </div>
  );
};

export default StudentAddEPortfolioPage;
