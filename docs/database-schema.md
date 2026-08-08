# พจนานุกรมข้อมูล (Data Dictionary)

สกัดจากเอกสารปริญญานิพนธ์ `CE68-21 DEEP-Portfolio.docx` หัวข้อ "การออกแบบโครงสร้างระบบฐานข้อมูล" (ตาราง 3.17–3.51) ตัวเอกสารต้นฉบับถูกนำออกจากเครื่องแล้วตาม D12 ใน [spec](./spec-refactor-redeploy.md)

> **schema.prisma คือแหล่งความจริง** (D2) — เอกสารนี้เก็บ*คำอธิบาย*ของแต่ละคอลัมน์ ซึ่งเป็นสิ่งเดียวที่ `schema.prisma` ไม่มี ที่ใดขัดกัน ให้ยึด `schema.prisma`

เอกสารอธิบายไว้ 35 ตาราง จากทั้งหมด 72 ตารางใน schema อีก 37 ตารางไม่มีคำอธิบายในเอกสาร (ดูท้ายไฟล์)

## ตารางที่มีคำอธิบายในเอกสาร

### `activities`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีของกิจกรรม |
| FK | `score_ratio_id` | int | ไอดีของสัดส่วนคะแนน |
|  | `activity_type` | varchar | ประเภทของกิจกรรม |
|  | `activity_name` | varchar | ชื่อกิจกรรม |
|  | `description` | varchar | คำอธิบายกิจกรรม |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `updated_at` | timestamp | วันเวลาที่แก้ไขข้อมูล |
|  | `score_number` | int | จำนวนคะแนน |
|  | `announcement_date` | timestamp | วันที่ประกาศ |
|  | `deadline_date` | timestamp | วันสิ้นสุดกำหนดการ |
| FK | `course_syllabus_id` | int | ไอดีของประมวลรายวิชา |
|  | `is_average_score` | boolean | สถานะการเฉลี่ยคะแนน |
|  | `is_self_assessment` | boolean | สถานะการประเมินตนเอง |
|  | `detail` | json | รายละเอียดเพิ่มเติม |
| FK | `section_id` | int | ไอดีของกลุ่มเรียน |
|  | `expected_level` | int | ระดับที่คาดหวัง |

### `activity_clo_mapping`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีของตาราง |
| FK | `activity_id` | int | ไอดีของกิจกรรม |
|  | `sequence_order` | int | ลำดับการแสดงผล |
|  | `weight` | int | น้ำหนักคะแนน |
| FK | `clo_id` | int | ไอดีผลการเรียนรู้ที่คาดหวัง (CLO) |
| FK | `score_ratio_id` | int | ไอดีสัดส่วนคะแนน |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `updated_at` | timestamp | วันเวลาที่แก้ไขข้อมูล |
|  | `score` | float | คะแนน |
|  | `detail` | varchar | รายละเอียดเพิ่มเติม |

### `announcements`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `announcement_id` | int | ไอดีของประกาศ |
|  | `title` | varchar | หัวข้อประกาศ |
|  | `content` | json | เนื้อหาของประกาศ |
|  | `created_by` | varchar | ผู้สร้างประกาศ |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `updated_at` | timestamp | วันเวลาที่แก้ไขข้อมูล |
|  | `published_at` | timestamp | วันเวลาที่เผยแพร่ |
|  | `is_pinned` | boolean | สถานะการปักหมุด |
|  | `view_count` | int | จำนวนผู้เข้าชม |
| FK | `section_id` | int | ไอดีของกลุ่มเรียน |

> **ต่างจาก `schema.prisma`** — มีใน schema แต่เอกสารไม่ได้อธิบาย: `status`

### `attachments`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีของไฟล์แนบ |
| FK | `announcement_id` | int | ไอดีของประกาศ |
|  | `title` | varchar | ชื่อไฟล์แนบ |
|  | `attachment_type` | enum | ประเภทไฟล์แนบ — ค่า: `file`, `link` |
|  | `file_path` | varchar | ที่อยู่ของไฟล์ |
|  | `url` | varchar | URL ของลิงก์ |
|  | `file_size` | int | ขนาดไฟล์ (bytes) |
|  | `original_filename` | varchar | ชื่อไฟล์ดั้งเดิม |
|  | `description` | varchar | รายละเอียด |
|  | `display_order` | int | ลำดับการแสดงผล |
|  | `uploaded_at` | timestamp | วันเวลาที่อัปโหลด |
| FK | `uploaded_by` | varchar | ไอดีผู้อัปโหลด |
|  | `download_count` | int | จำนวนการดาวน์โหลด |
|  | `is_active` | boolean | สถานะการใช้งาน |
|  | `file_type` | varchar | ชนิดของไฟล์ |

> **ต่างจาก `schema.prisma`** — มีในเอกสารแต่ไม่มีใน schema: `id`, `announcement_id`, `description`, `display_order`, `uploaded_by`, `download_count`, `is_active` / มีใน schema แต่เอกสารไม่ได้อธิบาย: `attachment_id`

### `course_material`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `announcement_id` | int | ไอดีของประกาศ |
| PK | `section_id` | int | ไอดีของกลุ่มเรียน |

> **ต่างจาก `schema.prisma`** — มีในเอกสารแต่ไม่มีใน schema: `announcement_id`, `section_id` / มีใน schema แต่เอกสารไม่ได้อธิบาย: `id`, `course_syllabus_id`, `attachment_id`, `type`

### `course_sections`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `section_id` | int | ไอดีของกลุ่มเรียน |
|  | `semester_course_id` | int | ไอดีรายวิชาในภาคการศึกษา |
|  | `section_number` | varchar | หมายเลขกลุ่มเรียน |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `updated_at` | timestamp | วันเวลาที่แก้ไขข้อมูล |

### `course_syllabus`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
|  | `week_no` | int | สัปดาห์ที่ |
|  | `description` | varchar | รายละเอียดการสอน |
|  | `remark` | varchar | หมายเหตุ |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `updated_at` | timestamp | วันเวลาที่แก้ไขข้อมูล |
|  | `title` | varchar | ชื่อหัวข้อ |
|  | `created_by` | varchar | ไอดีผู้สร้าง |
| FK | `section_id` | int | ไอดีของกลุ่มเรียน |
| PK | `id` | int | ไอดีของประมวลรายวิชา |

### `learning_activities`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีกิจกรรมการเรียนรู้ |
|  | `learning_activity_type` | varchar | ประเภทกิจกรรมการเรียนรู้ |
|  | `learning_activity_name` | varchar | ชื่อกิจกรรมการเรียนรู้ |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `updated_at` | timestamp | วันเวลาที่แก้ไขข้อมูล |
|  | `announcement_date` | timestamp | วันที่ประกาศกิจกรรม |
|  | `deadline_date` | timestamp | วันสิ้นสุดกำหนดการ |
|  | `course_syllabus_id` | int | ไอดีของประมวลรายวิชา |
| FK | `section_id` | int | ไอดีของกลุ่มเรียน |
|  | `detail` | json | รายละเอียดเพิ่มเติม |

### `learning_outcomes`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `outcome_id` | int | ไอดีของผลลัพธ์การเรียนรู้ |
| FK | `program_id` | varchar | รหัสหลักสูตร |
|  | `outcome_code` | varchar | รหัสผลลัพธ์การเรียนรู้ |
|  | `outcome_title` | varchar | ชื่อผลลัพธ์การเรียนรู้ |
|  | `outcome_description` | varchar | รายละเอียดผลลัพธ์การเรียนรู้ |
|  | `outcome_type` | enum | ประเภทผลลัพธ์การเรียนรู้ — ค่า: `knowledge`, `skills`, `ethics`, `character` |
| FK | `parent_outcome_id` | int | ไอดีของผลลัพธ์การเรียนรู้แม่ |
|  | `sequence_order` | int | ลำดับ |
|  | `level_depth` | int | ระดับความลึก |
|  | `is_expanded` | boolean | สถานะการขยาย |
|  | `is_active` | boolean | สถานะการใช้งาน |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `updated_at` | timestamp | วันเวลาที่แก้ไขข้อมูล |
| FK | `created_by` | varchar | ไอดีของผู้สร้าง |
| FK | `updated_by` | varchar | ไอดีของผู้แก้ไข |

> **ต่างจาก `schema.prisma`** — มีใน schema แต่เอกสารไม่ได้อธิบาย: `section_id`

### `learning_activity_clo_mapping`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีของตาราง |
| FK | `learning_activity_id` | int | ไอดีกิจกรรมการเรียนรู้ |
|  | `sequence_order` | int | ลำดับ |
|  | `clo_id` | int | ไอดีผลการเรียนรู้ (CLO) |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `updated_at` | timestamp | วันเวลาที่แก้ไขข้อมูล |

### `portfolio`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | uuid | ไอดีของพอร์ตโฟลิโอ |
| FK | `user_id` | varchar | ไอดีผู้ใช้ |
| FK | `template_id` | int | ไอดีของเทมเพลต |
|  | `portfolio_name` | varchar | ชื่อพอร์ตโฟลิโอ |
|  | `template_color` | varchar | สีของเทมเพลต |
|  | `about_me` | varchar | ข้อมูลส่วนตัวโดยย่อ |
|  | `is_show_personal` | boolean | สถานะแสดงข้อมูลส่วนตัว |
|  | `is_show_education` | boolean | สถานะแสดงประวัติการศึกษา |
|  | `is_show_training` | boolean | สถานะแสดงการอบรม |
|  | `is_show_certificate` | boolean | สถานะแสดงเกียรติบัตร |
|  | `is_show_skill` | boolean | สถานะแสดงทักษะ |
|  | `is_show_intern` | boolean | สถานะแสดงการฝึกงาน |
|  | `is_show_thesis` | boolean | สถานะแสดงหัวข้อวิจัย |
|  | `is_show_award` | boolean | สถานะแสดงรางวัล |
|  | `is_show_activity` | boolean | สถานะแสดงกิจกรรม |
|  | `public_share_token` | uuid | โทเค็นการแชร์สาธารณะ |
|  | `share_expires_at` | timestamp | วันหมดอายุการแชร์ |

> **ต่างจาก `schema.prisma`** — ชื่อคอลัมน์จริงไม่ตรงกับเอกสาร: `is_show_personal` → `isShowPersonal`, `is_show_education` → `isShowEducation`, `is_show_training` → `isShowTraining`, `is_show_certificate` → `isShowCertificate`, `is_show_skill` → `isShowSkill`, `is_show_intern` → `isShowIntern`, `is_show_thesis` → `isShowThesis`, `is_show_award` → `isShowAward`, `is_show_activity` → `isShowActivity`

### `portfolio_activities`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีกิจกรรมในพอร์ต |
| FK | `user_id` | varchar | ไอดีผู้ใช้ |
|  | `name` | varchar | ชื่อกิจกรรม |
|  | `date` | date | วันที่ทำกิจกรรม |
|  | `role` | varchar | บทบาทที่ได้รับ |
|  | `description` | varchar | รายละเอียดกิจกรรม |
|  | `is_show` | boolean | สถานะการแสดงผล |

### `portfolio_award`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีรางวัล |
| FK | `user_id` | varchar | ไอดีผู้ใช้ |
|  | `organize` | varchar | หน่วยงานที่จัด |
|  | `name` | varchar | ชื่อรายการรางวัล |
|  | `award` | varchar | รางวัลที่ได้รับ |
|  | `date` | date | วันที่ได้รับ |
|  | `description` | varchar | คำอธิบาย |
|  | `is_show` | boolean | สถานะการแสดงผล |

### `portfolio_certificate`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีเกียรติบัตร |
| FK | `user_id` | varchar | ไอดีผู้ใช้ |
|  | `date` | date | วันที่ได้รับ |
|  | `organize` | varchar | หน่วยงานที่ออกให้ |
|  | `name` | varchar | ชื่อเกียรติบัตร |
|  | `description` | varchar | คำอธิบาย |
|  | `is_show` | boolean | สถานะการแสดงผล |

### `portfolio_education`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีประวัติการศึกษา |
| FK | `user_id` | varchar | ไอดีผู้ใช้ |
|  | `education_level` | varchar | ระดับการศึกษา |
|  | `institution` | varchar | สถาบันการศึกษา |
|  | `start_year` | int | ปีที่เริ่ม |
|  | `end_year` | int | ปีที่จบ |
|  | `country` | varchar | ประเทศ |
|  | `gpa` | float | เกรดเฉลี่ยสะสม |
|  | `study_plan` | varchar | แผนการเรียน |
|  | `faculty` | varchar | คณะ |
|  | `major` | varchar | สาขาวิชา |
|  | `is_show` | boolean | สถานะการแสดงผล |

### `portfolio_personal`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| FK | `user_id` | varchar | ไอดีผู้ใช้ |
|  | `date_of_birth` | date | วันเกิด |
|  | `nationality` | varchar | สัญชาติ |
|  | `race` | varchar | เชื้อชาติ |
|  | `github` | varchar | ลิงก์ GitHub |
|  | `linkedin` | varchar | ลิงก์ LinkedIn |
|  | `email` | varchar | อีเมลติดต่อ |
|  | `phone_number` | varchar | เบอร์โทรศัพท์ติดต่อ |
|  | `attachment_id` | int | ไอดีรูปภาพแนบ |

### `portfolio_internship`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีการฝึกงาน |
| FK | `user_id` | varchar | ไอดีผู้ใช้ |
|  | `type` | varchar | ประเภทการฝึกงาน |
|  | `title` | varchar | หัวข้อการฝึกงาน |
|  | `position` | varchar | ตำแหน่งที่ได้รับ |
|  | `company` | varchar | บริษัทที่ฝึกงาน |
|  | `country` | varchar | ประเทศ |
|  | `province` | varchar | จังหวัด |
|  | `start_date` | date | วันที่เริ่ม |
|  | `end_date` | date | วันที่จบ |
|  | `resp` | varchar | หน้าที่รับผิดชอบ |
|  | `is_show_resp` | boolean | สถานะแสดงความรับผิดชอบ |
|  | `learning_out` | varchar | สิ่งที่ได้รับจากการเรียนรู้ |
|  | `is_show_learning` | boolean | สถานะแสดงสิ่งที่ได้รับ |
|  | `reflection` | varchar | การสะท้อนกลับ |
|  | `is_show_reflec` | boolean | สถานะแสดงการสะท้อนกลับ |

### `portfolio_skill`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีทักษะ |
|  | `name` | varchar | ชื่อทักษะ |
| FK | `user_id` | varchar | ไอดีผู้ใช้ |

### `portfolio_skill_mapping`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| FK | `portfolio_id` | uuid | ไอดีพอร์ตโฟลิโอ |
| FK | `skill_id` | int | ไอดีทักษะ |

### `portfolio_skill_activity_mapping`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีการแมปทักษะกับกิจกรรม |
| FK | `skill_id` | int | ไอดีทักษะ |
| FK | `student_activity_id` | int | ไอดีกิจกรรมนักศึกษา |
|  | `repository` | varchar | แหล่งเก็บรหัสต้นฉบับ |
|  | `role_and_resp` | varchar | บทบาทและความรับผิดชอบ |
|  | `init_expect` | varchar | ความคาดหวังเริ่มแรก |
|  | `reflection` | varchar | การสะท้อนกลับ |
|  | `is_show_repo` | boolean | สถานะแสดง Repo |
|  | `is_show_role` | boolean | สถานะแสดงบทบาท |
|  | `is_show_init` | boolean | สถานะแสดงความคาดหวัง |
|  | `is_show_reflec` | boolean | สถานะแสดงการสะท้อนกลับ |

> **ต่างจาก `schema.prisma`** — ชื่อคอลัมน์จริงไม่ตรงกับเอกสาร: `is_show_repo` → `isShowRepo`, `is_show_role` → `isShowRole`, `is_show_init` → `isShowInit`, `is_show_reflec` → `isShowReflec`

### `portfolio_thesis`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีหัวข้อวิจัย/วิทยานิพนธ์ |
| FK | `user_id` | varchar | ไอดีผู้ใช้ |
|  | `name` | varchar | ชื่อวิทยานิพนธ์ |
|  | `repository` | varchar | แหล่งเก็บผลงาน |
|  | `role_and_resp` | varchar | บทบาทและความรับผิดชอบ |
|  | `init_expect` | varchar | ความคาดหวังเริ่มแรก |
|  | `reflection` | varchar | การสะท้อนกลับ |
|  | `is_show_repo` | boolean | สถานะแสดง Repo |
|  | `is_show_role` | boolean | สถานะแสดงบทบาท |
|  | `is_show_init` | boolean | สถานะแสดงความคาดหวัง |
|  | `is_show_reflec` | boolean | สถานะแสดงการสะท้อนกลับ |

### `portfolio_template`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีเทมเพลต |
|  | `name` | varchar | ชื่อเทมเพลต |

### `portfolio_training`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีประวัติการอบรม |
| FK | `user_id` | varchar | ไอดีผู้ใช้ |
|  | `year` | int | ปีที่เข้าอบรม |
|  | `country` | varchar | ประเทศที่จัด |
|  | `organize` | varchar | หน่วยงานที่จัด |
|  | `name` | varchar | ชื่อหลักสูตรอบรม |
|  | `description` | varchar | รายละเอียดการอบรม |
|  | `is_show` | boolean | สถานะการแสดงผล |

### `rubric_activity_mapping`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีของตาราง |
| FK | `activity_id` | int | ไอดีของกิจกรรม |
|  | `criteria` | varchar | เกณฑ์การประเมิน |
|  | `weight` | int | น้ำหนักคะแนน |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `updated_at` | timestamp | วันเวลาที่แก้ไขข้อมูล |
|  | `created_by` | varchar | ไอดีผู้สร้าง |

### `student`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `student_id` | varchar | รหัสนักศึกษา |
|  | `first_name_th` | varchar | ชื่อ (ภาษาไทย) |
|  | `last_name_th` | varchar | นามสกุล (ภาษาไทย) |
|  | `full_name_th` | varchar | ชื่อ-นามสกุล (ภาษาไทย) |
|  | `department_id` | varchar | ไอดีภาควิชา |
|  | `program_id` | varchar | ไอดีหลักสูตร |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `updated_at` | timestamp | วันเวลาที่แก้ไขข้อมูล |
|  | `admission_year` | varchar | ปีที่เข้าศึกษา |
|  | `test` | varchar | ฟิลด์ทดสอบ |

> **ต่างจาก `schema.prisma`** — มีใน schema แต่เอกสารไม่ได้อธิบาย: `status`

### `student_activity`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีของกิจกรรมนักศึกษา |
| FK | `student_id` | varchar | รหัสนักศึกษา |
| FK | `activity_id` | int | ไอดีของกิจกรรม |
|  | `score` | float | คะแนนที่ได้ |
|  | `feedback` | varchar | ข้อเสนอแนะ |
|  | `submitted_at` | timestamp | วันที่ส่งงาน |
|  | `graded_at` | timestamp | วันที่ให้คะแนน |
|  | `graded_by` | varchar | ไอดีผู้ให้คะแนน |
|  | `is_bookmark` | boolean | สถานะการคั่นหน้า |
|  | `remark` | varchar | หมายเหตุ |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `updated_at` | timestamp | วันเวลาที่แก้ไขข้อมูล |

> **ต่างจาก `schema.prisma`** — มีใน schema แต่เอกสารไม่ได้อธิบาย: `status`

### `student_activity_group`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีของกลุ่มกิจกรรม |
| FK | `activity_id` | int | ไอดีของกิจกรรม |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `created_by` | varchar | ไอดีผู้สร้างกลุ่ม |

> **ต่างจาก `schema.prisma`** — มีใน schema แต่เอกสารไม่ได้อธิบาย: `status`

### `student_activity_group_member`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีของตาราง |
| FK | `group_id` | int | ไอดีของกลุ่มกิจกรรม |
| FK | `student_id` | varchar | รหัสนักศึกษา |
|  | `invite_token` | varchar | โทเค็นสำหรับเชิญเข้ากลุ่ม |
|  | `token_expiry` | timestamp | วันหมดอายุโทเค็น |
| FK | `student_activity_id` | int | ไอดีกิจกรรมนักศึกษา |

> **ต่างจาก `schema.prisma`** — มีใน schema แต่เอกสารไม่ได้อธิบาย: `status`, `role`

### `student_activity_rubric_score`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีของตาราง |
| FK | `student_activity_id` | int | ไอดีกิจกรรมนักศึกษา |
| FK | `rubric_activity_mapping_id` | int | ไอดีการแมปรูบริกกิจกรรม |
|  | `rubric_level_id` | int | ระดับคะแนนรูบริก |
|  | `calculated_score` | float | คะแนนที่คำนวณได้ |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `updated_at` | timestamp | วันเวลาที่แก้ไขข้อมูล |

### `student_learning_activity`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีตารางกิจกรรมเรียนรู้รายบุคคล |
| FK | `student_id` | varchar | รหัสนักศึกษา |
| FK | `learning_activity_id` | int | ไอดีกิจกรรมการเรียนรู้ |
|  | `feedback` | varchar | ข้อเสนอแนะ |
|  | `submitted_at` | timestamp | วันที่ส่งงาน |
|  | `graded_at` | timestamp | วันที่ตรวจงาน |
|  | `graded_by` | varchar | ไอดีผู้ตรวจงาน |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `updated_at` | timestamp | วันเวลาที่แก้ไขข้อมูล |
|  | `is_bookmark` | boolean | สถานะคั่นหน้า |
|  | `remark` | varchar | หมายเหตุ |

> **ต่างจาก `schema.prisma`** — มีใน schema แต่เอกสารไม่ได้อธิบาย: `status`

### `student_learning_activity_group`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีกลุ่มกิจกรรมเรียนรู้ |
| FK | `learning_activity_id` | int | ไอดีกิจกรรมการเรียนรู้ |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `created_by` | varchar | ไอดีผู้สร้างกลุ่ม |

> **ต่างจาก `schema.prisma`** — มีใน schema แต่เอกสารไม่ได้อธิบาย: `status`

### `student_learning_activity_group_member`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `id` | int | ไอดีของตาราง |
| FK | `group_id` | int | ไอดีกลุ่มกิจกรรมเรียนรู้ |
| FK | `student_id` | varchar | รหัสนักศึกษา |
|  | `invite_token` | varchar | โทเค็นเชิญเข้ากลุ่ม |
|  | `token_expiry` | timestamp | วันหมดอายุโทเค็น |
| FK | `student_learning_activity_id` | int | ไอดีตารางกิจกรรมเรียนรู้รายบุคคล |

> **ต่างจาก `schema.prisma`** — มีใน schema แต่เอกสารไม่ได้อธิบาย: `status`, `role`

### `subject_clo`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `clo_id` | int | ไอดีผลการเรียนรู้รายวิชา |
|  | `clo_number` | varchar | รหัสเลข CLO |
|  | `clo_detail` | varchar | รายละเอียด CLO |
|  | `teaching_method` | varchar | วิธีการสอน |
|  | `assessment_method` | varchar | วิธีการประเมิน |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `updated_at` | timestamp | วันเวลาที่แก้ไขข้อมูล |
| FK | `section_id` | int | ไอดีของกลุ่มเรียน |
| FK | `plo_id` | int | ไอดีผลลัพธ์การเรียนรู้ (PLO) |
|  | `created_by` | varchar | ไอดีผู้สร้าง |

### `subject_score_ratio`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `score_ratio_id` | int | ไอดีสัดส่วนคะแนน |
|  | `sequence_order` | int | ลำดับ |
|  | `score_category` | varchar | หมวดหมู่ของคะแนน |
|  | `weight` | int | น้ำหนักคะแนน |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `updated_at` | timestamp | วันเวลาที่แก้ไขข้อมูล |
| FK | `section_id` | int | ไอดีของกลุ่มเรียน |

### `users`

| คีย์ | ชื่อแอททริบิวต์ | ชนิดตัวแปร | รายละเอียด |
| --- | --- | --- | --- |
| PK | `user_id` | varchar | ไอดีของผู้ใช้ |
|  | `email` | varchar | อีเมล |
|  | `phone` | varchar | เบอร์โทรศัพท์ |
|  | `title_th` | varchar | คำนำหน้าชื่อ (ภาษาไทย) |
|  | `first_name_th` | varchar | ชื่อจริง (ภาษาไทย) |
|  | `last_name_th` | varchar | นามสกุล (ภาษาไทย) |
|  | `title_en` | varchar | คำนำหน้าชื่อ (ภาษาอังกฤษ) |
|  | `first_name_en` | varchar | ชื่อจริง (ภาษาอังกฤษ) |
|  | `last_name_en` | varchar | นามสกุล (ภาษาอังกฤษ) |
| FK | `department_id` | varchar | รหัสภาควิชา |
| FK | `program_id` | varchar | รหัสหลักสูตร |
|  | `status` | enum | สถานะ — ค่า: `active`, `inactive` |
|  | `created_at` | timestamp | วันเวลาที่สร้างข้อมูล |
|  | `updated_at` | timestamp | วันเวลาที่แก้ไขข้อมูล |
|  | `is_verified` | boolean | สถานะการยืนยันตัวตน |
|  | `verification_token` | varchar | โทเค็นสำหรับยืนยันตัวตน |
|  | `password` | varchar | รหัสผ่าน (hashed) |

## ตารางที่ไม่มีคำอธิบายในเอกสาร

อีก 37 ตารางนี้มีอยู่ใน `schema.prisma` แต่เอกสารไม่ได้อธิบายไว้ ต้องอ่านความหมายจาก schema และโค้ดที่เรียกใช้เอง

- `activity_attachments` (2 คอลัมน์)
- `activity_evidence` (14 คอลัมน์)
- `activity_scores` (7 คอลัมน์)
- `announcement_attachments` (2 คอลัมน์)
- `clo_course_cycle_cloplan` (5 คอลัมน์)
- `clo_course_cycle_detail_cloplan` (7 คอลัมน์)
- `course_section_schedule` (8 คอลัมน์)
- `course_sections_teacher` (6 คอลัมน์)
- `departments` (5 คอลัมน์)
- `faculty` (4 คอลัมน์)
- `learning_activity_attachments` (2 คอลัมน์)
- `portfolio_activity_attachments` (2 คอลัมน์)
- `portfolio_award_attachments` (2 คอลัมน์)
- `portfolio_certificate_attachments` (2 คอลัมน์)
- `portfolio_internship_attachments` (2 คอลัมน์)
- `portfolio_thesis_attachments` (2 คอลัมน์)
- `portfolio_training_attachments` (2 คอลัมน์)
- `program_subjects` (9 คอลัมน์)
- `programs` (8 คอลัมน์)
- `roles` (3 คอลัมน์)
- `rubric_details` (12 คอลัมน์)
- `rubric_levels` (5 คอลัมน์)
- `rubrics` (8 คอลัมน์)
- `semester_courses` (7 คอลัมน์)
- `student_activity_attachments` (3 คอลัมน์)
- `student_course` (4 คอลัมน์)
- `student_group` (5 คอลัมน์)
- `student_group_change_log` (10 คอลัมน์)
- `student_group_member` (3 คอลัมน์)
- `student_learning_activity_attachments` (3 คอลัมน์)
- `subject_clo_achievement_criteria` (9 คอลัมน์)
- `subject_clo_measurable_behavior` (9 คอลัมน์)
- `subject_plo_mapping` (9 คอลัมน์)
- `subjects` (12 คอลัมน์)
- `user_image` (4 คอลัมน์)
- `user_log` (4 คอลัมน์)
- `user_roles` (7 คอลัมน์)

## Enum

`schema.prisma` ประกาศ enum ไว้ 15 ตัว เอกสารต้นฉบับเขียนค่าไม่ครบหลายจุด (เช่น `สถานะ (active` ที่ขาดวงเล็บปิด) ตารางข้างบนจึงใช้ค่าจาก schema แทน

| Enum | ค่าที่เป็นไปได้ |
| --- | --- |
| `activity_type_enum` | `group`, `individual`, `parent` |
| `announcement_status` | `draft`, `published`, `archived` |
| `attachment_type` | `file`, `link` |
| `course_material_type` | `LECTURE`, `RECORD` |
| `learning_outcome_type` | `knowledge`, `skills`, `ethics`, `character` |
| `mapping_level_enum` | `I`, `D`, `P`, `A`, `E` |
| `outcome_type_enum` | `knowledge`, `skills`, `ethics`, `character` |
| `role_enum` | `FULL_ADMIN`, `FACULTY_ADMIN`, `DEPT_ADMIN`, `PROG_MANAGER`, `TEACHER`, `STUDENT`, `GUEST` |
| `status_enum` | `active`, `inactive` |
| `student_activity_group_member_role` | `LEADER`, `MEMBER` |
| `student_activity_group_member_status` | `PENDING`, `ACCEPT`, `REJECTED` |
| `student_activity_status` | `NOT_SUBMITTED`, `SUBMITTED`, `GRADING`, `GRADED` |
| `student_status_enum` | `active`, `inactive`, `graduated`, `suspended` |
| `subject_type_enum` | `required`, `elective` |
| `weekday` | `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN` |
