-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- HAND-EDITED: two types Prisma cannot emit
--
-- subject_clo_measurable_behavior.learning_activity and .cognitive_level are
-- Unsupported("...") in schema.prisma, so `prisma migrate diff` names the types
-- but never creates them, and the migration fails on the first table that uses
-- one. They have to be declared here by hand.
--
-- Their value sets are NOT RECOVERABLE. The original database is gone, no code
-- reads or writes this table, and neither the thesis document nor
-- docs/database-schema.md records the members (that document lists only the 15
-- enums Prisma declares). Rather than invent values, both are created EMPTY:
-- the type exists, the table can be created, and any INSERT fails loudly
-- instead of silently accepting a made-up vocabulary. Fill them in with
-- ALTER TYPE ... ADD VALUE in a follow-up migration once the real members are
-- known. See D2.
CREATE TYPE "public"."learning_activity_enum" AS ENUM ();
CREATE TYPE "public"."cognitive_level_enum" AS ENUM ();

-- CreateEnum
CREATE TYPE "public"."activity_type_enum" AS ENUM ('group', 'individual', 'parent');

-- CreateEnum
CREATE TYPE "public"."announcement_status" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "public"."attachment_type" AS ENUM ('file', 'link');

-- CreateEnum
CREATE TYPE "public"."course_material_type" AS ENUM ('LECTURE', 'RECORD');

-- CreateEnum
CREATE TYPE "public"."learning_outcome_type" AS ENUM ('knowledge', 'skills', 'ethics', 'character');

-- CreateEnum
CREATE TYPE "public"."mapping_level_enum" AS ENUM ('I', 'D', 'P', 'A', 'E');

-- CreateEnum
CREATE TYPE "public"."outcome_type_enum" AS ENUM ('knowledge', 'skills', 'ethics', 'character');

-- CreateEnum
CREATE TYPE "public"."role_enum" AS ENUM ('FULL_ADMIN', 'FACULTY_ADMIN', 'DEPT_ADMIN', 'PROG_MANAGER', 'TEACHER', 'STUDENT', 'GUEST');

-- CreateEnum
CREATE TYPE "public"."status_enum" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "public"."student_activity_group_member_role" AS ENUM ('LEADER', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."student_activity_group_member_status" AS ENUM ('PENDING', 'ACCEPT', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."student_activity_status" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED', 'GRADING', 'GRADED');

-- CreateEnum
CREATE TYPE "public"."student_status_enum" AS ENUM ('active', 'inactive', 'graduated', 'suspended');

-- CreateEnum
CREATE TYPE "public"."subject_type_enum" AS ENUM ('required', 'elective');

-- CreateEnum
CREATE TYPE "public"."weekday" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateTable
CREATE TABLE "public"."activities" (
    "id" SERIAL NOT NULL,
    "score_ratio_id" INTEGER,
    "activity_type" VARCHAR(20) NOT NULL,
    "activity_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "score_number" INTEGER DEFAULT 0,
    "announcement_date" TIMESTAMP(6),
    "deadline_date" TIMESTAMP(6),
    "course_syllabus_id" INTEGER,
    "is_average_score" BOOLEAN NOT NULL DEFAULT false,
    "is_self_assessment" BOOLEAN NOT NULL DEFAULT false,
    "detail" JSONB,
    "section_id" INTEGER,
    "expected_level" INTEGER,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_attachments" (
    "activity_id" INTEGER NOT NULL,
    "attachment_id" INTEGER NOT NULL,

    CONSTRAINT "activity_attachments_pkey" PRIMARY KEY ("activity_id","attachment_id")
);

-- CreateTable
CREATE TABLE "public"."activity_clo_mapping" (
    "id" SERIAL NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "sequence_order" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "clo_id" SMALLINT,
    "score_ratio_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "detail" TEXT,

    CONSTRAINT "activity_clo_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_evidence" (
    "evidence_id" SERIAL NOT NULL,
    "section_id" INTEGER NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "evidence_type" VARCHAR(50),
    "description" TEXT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "uploaded_by" VARCHAR(8),
    "uploaded_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(8),
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "activity_evidence_pkey" PRIMARY KEY ("evidence_id")
);

-- CreateTable
CREATE TABLE "public"."activity_scores" (
    "score_id" SERIAL NOT NULL,
    "student_id" VARCHAR(20),
    "activity_id" INTEGER,
    "clo_id" VARCHAR(10),
    "score" DECIMAL(5,2),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_scores_pkey" PRIMARY KEY ("score_id")
);

-- CreateTable
CREATE TABLE "public"."announcement_attachments" (
    "announcement_id" INTEGER NOT NULL,
    "attachment_id" INTEGER NOT NULL,

    CONSTRAINT "announcement_attachments_pkey1" PRIMARY KEY ("announcement_id","attachment_id")
);

-- CreateTable
CREATE TABLE "public"."announcements" (
    "announcement_id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" JSONB NOT NULL,
    "created_by" VARCHAR(8) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."announcement_status",
    "is_pinned" BOOLEAN DEFAULT false,
    "view_count" INTEGER DEFAULT 0,
    "section_id" INTEGER NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("announcement_id")
);

-- CreateTable
CREATE TABLE "public"."attachments" (
    "attachment_id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "attachment_type" "public"."attachment_type" NOT NULL,
    "file_path" VARCHAR(500),
    "url" VARCHAR(1000),
    "file_size" BIGINT,
    "original_filename" VARCHAR(255),
    "uploaded_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "file_type" VARCHAR(100),

    CONSTRAINT "announcement_attachments_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateTable
CREATE TABLE "public"."clo_course_cycle_cloplan" (
    "clo_course_cycle_id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "subject_id" VARCHAR(20) NOT NULL,
    "program_id" VARCHAR(10) NOT NULL,
    "academic_year" VARCHAR(4) NOT NULL,

    CONSTRAINT "clo_course_cycle_cloplan_pkey" PRIMARY KEY ("clo_course_cycle_id")
);

-- CreateTable
CREATE TABLE "public"."clo_course_cycle_detail_cloplan" (
    "clo_course_cycle_detail_id" BIGSERIAL NOT NULL,
    "clo_course_cycle_id" BIGINT NOT NULL,
    "clo_id" INTEGER NOT NULL,
    "detail_type" VARCHAR(30) NOT NULL,
    "detail_text" TEXT NOT NULL,
    "reference_academic_year" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clo_course_cycle_detail_cloplan_pkey" PRIMARY KEY ("clo_course_cycle_detail_id")
);

-- CreateTable
CREATE TABLE "public"."course_material" (
    "id" SERIAL NOT NULL,
    "course_syllabus_id" INTEGER NOT NULL,
    "attachment_id" INTEGER NOT NULL,
    "type" "public"."course_material_type" NOT NULL,

    CONSTRAINT "course_material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."course_section_schedule" (
    "id" SERIAL NOT NULL,
    "section_id" INTEGER NOT NULL,
    "day_of_week" "public"."weekday" NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "classroom" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_section_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."course_sections" (
    "section_id" SERIAL NOT NULL,
    "semester_course_id" INTEGER NOT NULL,
    "section_number" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_sections_pkey" PRIMARY KEY ("section_id")
);

-- CreateTable
CREATE TABLE "public"."course_sections_teacher" (
    "id" SERIAL NOT NULL,
    "semester_course_id" INTEGER NOT NULL,
    "user_id" VARCHAR(8) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "updated_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "section_id" INTEGER,

    CONSTRAINT "course_sections_teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."course_syllabus" (
    "week_no" SMALLINT NOT NULL,
    "description" TEXT,
    "remark" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "created_by" VARCHAR(8),
    "section_id" INTEGER,
    "id" SERIAL NOT NULL,

    CONSTRAINT "course_syllabus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."departments" (
    "department_id" VARCHAR(2) NOT NULL,
    "department_name_en" VARCHAR(200),
    "department_name_th" VARCHAR(200),
    "is_active" BOOLEAN DEFAULT true,
    "faculty_id" VARCHAR(10),

    CONSTRAINT "departments_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "public"."faculty" (
    "faculty_id" VARCHAR(10) NOT NULL,
    "faculty_name_en" VARCHAR(200) NOT NULL,
    "faculty_name_th" VARCHAR(200) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "faculty_pkey" PRIMARY KEY ("faculty_id")
);

-- CreateTable
CREATE TABLE "public"."learning_activities" (
    "id" SERIAL NOT NULL,
    "learning_activity_type" VARCHAR(20) NOT NULL,
    "learning_activity_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "announcement_date" TIMESTAMP(6),
    "deadline_date" TIMESTAMP(6),
    "course_syllabus_id" INTEGER,
    "section_id" INTEGER NOT NULL,
    "detail" JSONB,

    CONSTRAINT "learning_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."learning_activity_attachments" (
    "learning_activity_id" INTEGER NOT NULL,
    "attachment_id" INTEGER NOT NULL,

    CONSTRAINT "learning_activity_attachments_pkey" PRIMARY KEY ("learning_activity_id","attachment_id")
);

-- CreateTable
CREATE TABLE "public"."learning_activity_clo_mapping" (
    "id" SERIAL NOT NULL,
    "learning_activity_id" INTEGER NOT NULL,
    "sequence_order" INTEGER NOT NULL,
    "clo_id" SMALLINT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_activity_clo_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."learning_outcomes" (
    "outcome_id" SERIAL NOT NULL,
    "program_id" VARCHAR(10) NOT NULL,
    "outcome_code" VARCHAR(50) NOT NULL,
    "outcome_title" VARCHAR(500) NOT NULL,
    "outcome_description" TEXT,
    "outcome_type" "public"."learning_outcome_type" NOT NULL,
    "parent_outcome_id" INTEGER,
    "sequence_order" INTEGER NOT NULL,
    "level_depth" SMALLINT DEFAULT 1,
    "is_expanded" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "updated_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "created_by" VARCHAR(20),
    "updated_by" VARCHAR(20),
    "section_id" INTEGER,

    CONSTRAINT "learning_outcomes_pkey" PRIMARY KEY ("outcome_id")
);

-- CreateTable
CREATE TABLE "public"."portfolio" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR(8) NOT NULL,
    "template_id" INTEGER,
    "portfolio_name" VARCHAR(255),
    "template_color" VARCHAR(20),
    "about_me" TEXT,
    "isShowPersonal" BOOLEAN DEFAULT true,
    "isShowEducation" BOOLEAN DEFAULT true,
    "isShowTraining" BOOLEAN DEFAULT true,
    "isShowCertificate" BOOLEAN DEFAULT true,
    "isShowSkill" BOOLEAN DEFAULT true,
    "isShowIntern" BOOLEAN DEFAULT true,
    "isShowThesis" BOOLEAN DEFAULT true,
    "isShowAward" BOOLEAN DEFAULT true,
    "isShowActivity" BOOLEAN DEFAULT true,
    "public_share_token" UUID DEFAULT gen_random_uuid(),
    "share_expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_activities" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(8) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "date" DATE,
    "role" VARCHAR(255),
    "description" TEXT,
    "is_show" BOOLEAN DEFAULT true,

    CONSTRAINT "portfolio_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_activity_attachments" (
    "activity_id" INTEGER NOT NULL,
    "attachment_id" INTEGER NOT NULL,

    CONSTRAINT "pk_portfolio_activity_attachments" PRIMARY KEY ("activity_id","attachment_id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_award" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(8) NOT NULL,
    "organize" VARCHAR(255),
    "name" VARCHAR(255),
    "award" VARCHAR(255),
    "date" DATE,
    "description" TEXT,
    "is_show" BOOLEAN DEFAULT true,

    CONSTRAINT "pk_portfolio_award" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_award_attachments" (
    "award_id" INTEGER NOT NULL,
    "attachment_id" INTEGER NOT NULL,

    CONSTRAINT "pk_portfolio_award_attachments" PRIMARY KEY ("award_id","attachment_id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_certificate" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(8) NOT NULL,
    "date" DATE,
    "organize" VARCHAR(255),
    "name" VARCHAR(255),
    "description" TEXT,
    "is_show" BOOLEAN DEFAULT true,

    CONSTRAINT "portfolio_certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_certificate_attachments" (
    "certificate_id" INTEGER NOT NULL,
    "attachment_id" INTEGER NOT NULL,

    CONSTRAINT "pk_portfolio_certificate_attachments" PRIMARY KEY ("certificate_id","attachment_id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_education" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(8) NOT NULL,
    "education_level" VARCHAR(50) NOT NULL,
    "institution" VARCHAR(255),
    "start_year" INTEGER,
    "end_year" INTEGER,
    "country" VARCHAR(100),
    "gpa" DECIMAL(3,2),
    "study_plan" VARCHAR(255),
    "faculty" VARCHAR(255),
    "major" VARCHAR(255),
    "is_show" BOOLEAN DEFAULT true,

    CONSTRAINT "pk_portfolio_education" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_internship" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(8) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255),
    "position" VARCHAR(255),
    "company" VARCHAR(255),
    "country" VARCHAR(100),
    "province" VARCHAR(100),
    "start_date" DATE,
    "end_date" DATE,
    "resp" TEXT,
    "is_show_resp" BOOLEAN DEFAULT true,
    "learning_out" TEXT,
    "is_show_learning" BOOLEAN DEFAULT true,
    "reflection" TEXT,
    "is_show_reflec" BOOLEAN DEFAULT true,

    CONSTRAINT "pk_portfolio_internship" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_internship_attachments" (
    "internship_id" INTEGER NOT NULL,
    "attachment_id" INTEGER NOT NULL,

    CONSTRAINT "pk_portfolio_internship_attachments" PRIMARY KEY ("internship_id","attachment_id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_personal" (
    "user_id" VARCHAR(8) NOT NULL,
    "date_of_birth" DATE,
    "nationality" VARCHAR(100),
    "race" VARCHAR(100),
    "github" VARCHAR(255),
    "linkedin" VARCHAR(255),
    "email" VARCHAR(255),
    "phone_number" VARCHAR(50),
    "attachment_id" INTEGER,

    CONSTRAINT "portfolio_personal_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_skill" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "user_id" VARCHAR(8) NOT NULL,

    CONSTRAINT "portfolio_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_skill_activity_mapping" (
    "id" SERIAL NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "student_activity_id" INTEGER NOT NULL,
    "repository" TEXT,
    "role_and_resp" TEXT,
    "init_expect" TEXT,
    "reflection" TEXT,
    "isShowRepo" BOOLEAN DEFAULT false,
    "isShowRole" BOOLEAN DEFAULT false,
    "isShowInit" BOOLEAN DEFAULT false,
    "isShowReflec" BOOLEAN DEFAULT false,

    CONSTRAINT "portfolio_skill_activity_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_skill_mapping" (
    "portfolio_id" UUID NOT NULL,
    "skill_id" INTEGER NOT NULL,

    CONSTRAINT "portfolio_skill_mapping_pkey" PRIMARY KEY ("portfolio_id","skill_id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_template" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "portfolio_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_thesis" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(8) NOT NULL,
    "name" VARCHAR(255),
    "repository" VARCHAR(255),
    "role_and_resp" TEXT,
    "init_expect" TEXT,
    "reflection" TEXT,
    "is_show_repo" BOOLEAN DEFAULT true,
    "is_show_role" BOOLEAN DEFAULT true,
    "is_show_init" BOOLEAN DEFAULT true,
    "is_show_reflec" BOOLEAN DEFAULT true,

    CONSTRAINT "pk_portfolio_thesis" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_thesis_attachments" (
    "thesis_id" INTEGER NOT NULL,
    "attachment_id" INTEGER NOT NULL,

    CONSTRAINT "pk_portfolio_thesis_attachments" PRIMARY KEY ("thesis_id","attachment_id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_training" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(8) NOT NULL,
    "year" INTEGER,
    "country" VARCHAR(100),
    "organize" VARCHAR(255),
    "name" VARCHAR(255),
    "description" TEXT,
    "is_show" BOOLEAN DEFAULT true,

    CONSTRAINT "pk_portfolio_training" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_training_attachments" (
    "training_id" INTEGER NOT NULL,
    "attachment_id" INTEGER NOT NULL,

    CONSTRAINT "pk_portfolio_training_attachments" PRIMARY KEY ("training_id","attachment_id")
);

-- CreateTable
CREATE TABLE "public"."program_subjects" (
    "id" SERIAL NOT NULL,
    "program_id" VARCHAR(10) NOT NULL,
    "subject_id" VARCHAR(20) NOT NULL,
    "subject_type" "public"."subject_type_enum" NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "updated_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "created_by" VARCHAR(20),
    "updated_by" VARCHAR(20),

    CONSTRAINT "program_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."programs" (
    "program_id" VARCHAR(10) NOT NULL,
    "program_name_en" VARCHAR(200),
    "program_name_th" VARCHAR(200),
    "department_id" VARCHAR(2),
    "year" VARCHAR(4),
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "updated_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),

    CONSTRAINT "programs_pkey" PRIMARY KEY ("program_id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "role_id" VARCHAR(20) NOT NULL,
    "role_name" VARCHAR(20) NOT NULL,
    "priority" INTEGER NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "public"."rubric_activity_mapping" (
    "id" SERIAL NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "criteria" VARCHAR(255) NOT NULL,
    "weight" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(20),

    CONSTRAINT "rubric_activity_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rubric_details" (
    "id" SERIAL NOT NULL,
    "rubric_id" INTEGER NOT NULL,
    "criteria_name_en" VARCHAR(255) NOT NULL,
    "criteria_name_th" VARCHAR(255) NOT NULL,
    "level_4_description" TEXT,
    "level_3_description" TEXT,
    "level_2_description" TEXT,
    "level_1_description" TEXT,
    "weight" DECIMAL(5,2) DEFAULT 1.00,
    "display_order" INTEGER DEFAULT 0,
    "created_by" VARCHAR(8),
    "updated_by" VARCHAR(8),

    CONSTRAINT "rubric_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rubric_levels" (
    "id" SERIAL NOT NULL,
    "rubric_id" INTEGER NOT NULL,
    "level_no" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rubric_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rubrics" (
    "id" SERIAL NOT NULL,
    "rubric_code" VARCHAR(20) NOT NULL,
    "rubric_name_en" VARCHAR(255) NOT NULL,
    "rubric_name_th" VARCHAR(255) NOT NULL,
    "display_order" INTEGER DEFAULT 0,
    "created_by" VARCHAR(8),
    "updated_by" VARCHAR(8),
    "program_id" VARCHAR(10),

    CONSTRAINT "rubrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."semester_courses" (
    "id" SERIAL NOT NULL,
    "academic_year" VARCHAR(4) NOT NULL,
    "semester" SMALLINT NOT NULL,
    "subject_id" VARCHAR(8) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "updated_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "program_id" VARCHAR(10),

    CONSTRAINT "semester_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student" (
    "student_id" VARCHAR(8) NOT NULL,
    "first_name_th" VARCHAR(100) NOT NULL,
    "last_name_th" VARCHAR(100) NOT NULL,
    -- HAND-EDITED: Prisma introspects a Postgres generated column as an ordinary
    -- @default(dbgenerated(...)), and emits it back as a DEFAULT, which Postgres
    -- rejects ("cannot use column reference in DEFAULT expression"). Restored to
    -- the GENERATED ALWAYS ... STORED form the original database had. See D2.
    "full_name_th" VARCHAR(200) GENERATED ALWAYS AS ((((first_name_th)::text || ' '::text) || (last_name_th)::text)) STORED,
    "department_id" VARCHAR(2) NOT NULL,
    "program_id" VARCHAR(10) NOT NULL,
    "status" "public"."student_status_enum" DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "updated_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    -- HAND-EDITED: same reason as full_name_th above.
    "admission_year" VARCHAR(4) GENERATED ALWAYS AS (((("left"((student_id)::text, 2))::integer + 2500))::text) STORED,
    "test" TEXT,

    CONSTRAINT "student_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "public"."student_activity" (
    "id" SERIAL NOT NULL,
    "student_id" VARCHAR(8) NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "status" "public"."student_activity_status" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "score" DECIMAL(5,2),
    "feedback" TEXT,
    "submitted_at" TIMESTAMPTZ(6),
    "graded_at" TIMESTAMPTZ(6),
    "graded_by" VARCHAR(20),
    "is_bookmark" BOOLEAN NOT NULL DEFAULT false,
    "remark" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_activity_attachments" (
    "student_activity_id" INTEGER NOT NULL,
    "attachment_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_activity_attachments_pkey" PRIMARY KEY ("student_activity_id","attachment_id")
);

-- CreateTable
CREATE TABLE "public"."student_activity_group" (
    "id" SERIAL NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "status" "public"."student_activity_status" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(8),

    CONSTRAINT "student_activity_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_activity_group_member" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "student_id" VARCHAR(8) NOT NULL,
    "status" "public"."student_activity_group_member_status" NOT NULL DEFAULT 'ACCEPT',
    "invite_token" VARCHAR(255),
    "token_expiry" TIMESTAMP(6),
    "role" "public"."student_activity_group_member_role" NOT NULL DEFAULT 'MEMBER',
    "student_activity_id" INTEGER NOT NULL,

    CONSTRAINT "student_activity_group_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_activity_rubric_score" (
    "id" SERIAL NOT NULL,
    "student_activity_id" INTEGER NOT NULL,
    "rubric_activity_mapping_id" INTEGER NOT NULL,
    "rubric_level_id" INTEGER NOT NULL,
    "calculated_score" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_activity_rubric_score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_course" (
    "student_id" VARCHAR(8) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "updated_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "section_id" INTEGER NOT NULL,

    CONSTRAINT "student_course_pkey" PRIMARY KEY ("section_id","student_id")
);

-- CreateTable
CREATE TABLE "public"."student_group" (
    "group_id" SERIAL NOT NULL,
    "group_name" VARCHAR(100) NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "updated_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "section_id" INTEGER,

    CONSTRAINT "student_group_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "public"."student_group_change_log" (
    "log_id" SERIAL NOT NULL,
    "group_id" SMALLINT NOT NULL,
    "group_name" VARCHAR(100) NOT NULL,
    "student_id" VARCHAR(8),
    "action_type" VARCHAR(20) NOT NULL,
    "old_group_id" SMALLINT,
    "new_group_id" SMALLINT,
    "performed_by" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "section_id" INTEGER NOT NULL,

    CONSTRAINT "student_group_change_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "public"."student_group_member" (
    "group_id" INTEGER NOT NULL,
    "student_id" VARCHAR(8) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),

    CONSTRAINT "student_group_member_pkey" PRIMARY KEY ("group_id","student_id")
);

-- CreateTable
CREATE TABLE "public"."student_learning_activity" (
    "id" SERIAL NOT NULL,
    "student_id" VARCHAR(20) NOT NULL,
    "learning_activity_id" INTEGER NOT NULL,
    "status" "public"."student_activity_status" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "feedback" TEXT,
    "submitted_at" TIMESTAMPTZ(6),
    "graded_at" TIMESTAMPTZ(6),
    "graded_by" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_bookmark" BOOLEAN NOT NULL DEFAULT false,
    "remark" TEXT,

    CONSTRAINT "student_learning_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_learning_activity_attachments" (
    "student_learning_activity_id" INTEGER NOT NULL,
    "attachment_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_learning_activity_attachments_pkey" PRIMARY KEY ("student_learning_activity_id","attachment_id")
);

-- CreateTable
CREATE TABLE "public"."student_learning_activity_group" (
    "id" SERIAL NOT NULL,
    "learning_activity_id" INTEGER NOT NULL,
    "status" "public"."student_activity_status" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(8),

    CONSTRAINT "student_learning_activity_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_learning_activity_group_member" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "student_id" VARCHAR(8) NOT NULL,
    "status" "public"."student_activity_group_member_status" NOT NULL DEFAULT 'ACCEPT',
    "invite_token" VARCHAR(255),
    "token_expiry" TIMESTAMP(6),
    "role" "public"."student_activity_group_member_role" NOT NULL DEFAULT 'MEMBER',
    "student_learning_activity_id" INTEGER NOT NULL,

    CONSTRAINT "student_learning_activity_group_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subject_clo" (
    "clo_id" SERIAL NOT NULL,
    "clo_number" VARCHAR(50),
    "clo_detail" TEXT,
    "teaching_method" TEXT,
    "assessment_method" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "updated_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "section_id" INTEGER NOT NULL,
    "plo_id" INTEGER,
    "created_by" VARCHAR(8),

    CONSTRAINT "subject_clo_pkey" PRIMARY KEY ("clo_id")
);

-- CreateTable
CREATE TABLE "public"."subject_clo_achievement_criteria" (
    "id" SERIAL NOT NULL,
    "clo_id" SMALLINT NOT NULL,
    "criteria_no" SMALLINT NOT NULL,
    "achievement_level" VARCHAR(20) NOT NULL,
    "criteria_detail" TEXT NOT NULL,
    "criteria_description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "section_id" INTEGER,

    CONSTRAINT "subject_clo_achievement_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subject_clo_measurable_behavior" (
    "id" SERIAL NOT NULL,
    "clo_id" SMALLINT NOT NULL,
    "behavior_no" SMALLINT NOT NULL,
    "learning_activity" learning_activity_enum NOT NULL,
    "behavior_detail" TEXT NOT NULL,
    "cognitive_level" cognitive_level_enum NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "section_id" INTEGER,

    CONSTRAINT "subject_clo_measurable_behavior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subject_plo_mapping" (
    "mapping_id" SERIAL NOT NULL,
    "program_id" VARCHAR(10) NOT NULL,
    "outcome_id" INTEGER,
    "subject_id" VARCHAR(20) NOT NULL,
    "mapping_level" "public"."mapping_level_enum" DEFAULT 'E',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(8),
    "updated_by" VARCHAR(8),

    CONSTRAINT "subject_plo_mapping_pkey" PRIMARY KEY ("mapping_id")
);

-- CreateTable
CREATE TABLE "public"."subject_score_ratio" (
    "score_ratio_id" SERIAL NOT NULL,
    "sequence_order" INTEGER NOT NULL,
    "score_category" TEXT NOT NULL,
    "weight" SMALLINT DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "section_id" INTEGER,

    CONSTRAINT "subject_score_ratio_pkey" PRIMARY KEY ("score_ratio_id")
);

-- CreateTable
CREATE TABLE "public"."subjects" (
    "subject_id" VARCHAR(20) NOT NULL,
    "subject_name_en" VARCHAR(200) NOT NULL,
    "subject_name_th" VARCHAR(200) NOT NULL,
    "credits" INTEGER NOT NULL,
    "description_th" TEXT,
    "description_en" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "updated_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "created_by" VARCHAR(8),
    "updated_by" VARCHAR(8),
    "is_active" BOOLEAN DEFAULT true,
    "department_id" VARCHAR(20),

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("subject_id")
);

-- CreateTable
CREATE TABLE "public"."user_image" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(8) NOT NULL,
    "image_path" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),

    CONSTRAINT "user_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_log" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(8) NOT NULL,
    "activity" VARCHAR(20) NOT NULL,
    "time_stamp" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'Asia/Bangkok'::text),

    CONSTRAINT "user_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_roles" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(8) NOT NULL,
    "scope_id" VARCHAR(10),
    "assigned_at" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "assigned_by" VARCHAR(8),
    "is_active" BOOLEAN DEFAULT true,
    "role_id" VARCHAR(20),

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "user_id" VARCHAR(8) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30),
    "title_th" VARCHAR(30),
    "first_name_th" VARCHAR(100),
    "last_name_th" VARCHAR(100),
    "title_en" VARCHAR(30),
    "first_name_en" VARCHAR(100),
    "last_name_en" VARCHAR(100),
    "department_id" CHAR(2),
    "program_id" VARCHAR(10),
    "status" "public"."status_enum" DEFAULT 'active',
    "created_at" TIMESTAMP(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "updated_at" TIMESTAMP(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'::text),
    "is_verified" BOOLEAN DEFAULT false,
    "verification_token" VARCHAR(255),
    "password" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_clo_mapping_activity_id_sequence_order_key" ON "public"."activity_clo_mapping"("activity_id", "sequence_order");

-- CreateIndex
CREATE INDEX "idx_activity_evidence_section_activity" ON "public"."activity_evidence"("section_id", "activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_scores_student_id_activity_id_clo_id_key" ON "public"."activity_scores"("student_id", "activity_id", "clo_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cycle_subject_program_year" ON "public"."clo_course_cycle_cloplan"("subject_id", "program_id", "academic_year");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cloplan_cycle_clo_type" ON "public"."clo_course_cycle_detail_cloplan"("clo_course_cycle_id", "clo_id", "detail_type");

-- CreateIndex
CREATE UNIQUE INDEX "uq_course_material" ON "public"."course_material"("course_syllabus_id", "attachment_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_sections_semester_course_id_section_number_key" ON "public"."course_sections"("semester_course_id", "section_number");

-- CreateIndex
CREATE UNIQUE INDEX "course_sections_teacher_section_id_user_id_uq" ON "public"."course_sections_teacher"("section_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_sections_teacher_semester_course_id_section_id_u_key" ON "public"."course_sections_teacher"("semester_course_id", "section_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_learning_activity_sequence" ON "public"."learning_activity_clo_mapping"("learning_activity_id", "sequence_order");

-- CreateIndex
CREATE UNIQUE INDEX "unique_program_outcome_code" ON "public"."learning_outcomes"("program_id", "outcome_code");

-- CreateIndex
CREATE UNIQUE INDEX "program_subjects_program_id_subject_id_key" ON "public"."program_subjects"("program_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_rubric_level" ON "public"."rubric_levels"("rubric_id", "level_no");

-- CreateIndex
CREATE UNIQUE INDEX "rubrics_rubric_code_key" ON "public"."rubrics"("rubric_code");

-- CreateIndex
CREATE UNIQUE INDEX "semester_courses_academic_year_semester_subject_id_key" ON "public"."semester_courses"("academic_year", "semester", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_activity_group_member_student_activity_id_key" ON "public"."student_activity_group_member"("student_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "uk_group_student" ON "public"."student_activity_group_member"("group_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "uk_student_activity_rubric" ON "public"."student_activity_rubric_score"("student_activity_id", "rubric_activity_mapping_id");

-- CreateIndex
CREATE INDEX "idx_student_group_change_student" ON "public"."student_group_change_log"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_learning_activity_grou_student_learning_activity_id_key" ON "public"."student_learning_activity_group_member"("student_learning_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "pk_group_student" ON "public"."student_learning_activity_group_member"("group_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_subject_clo" ON "public"."subject_clo"("section_id", "clo_number");

-- CreateIndex
CREATE UNIQUE INDEX "uk_scac" ON "public"."subject_clo_achievement_criteria"("section_id", "clo_id", "criteria_no");

-- CreateIndex
CREATE UNIQUE INDEX "unique_mapping" ON "public"."subject_plo_mapping"("subject_id", "outcome_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_image" ON "public"."user_image"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_image_user_id" ON "public"."user_image"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_scope_id_key" ON "public"."user_roles"("user_id", "role_id", "scope_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- AddForeignKey
ALTER TABLE "public"."activities" ADD CONSTRAINT "fk_score_ratio" FOREIGN KEY ("score_ratio_id") REFERENCES "public"."subject_score_ratio"("score_ratio_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."activity_attachments" ADD CONSTRAINT "fk_activity" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."activity_attachments" ADD CONSTRAINT "fk_attachment" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("attachment_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."activity_clo_mapping" ADD CONSTRAINT "fk_activity_clo_mapping_activity_id" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_clo_mapping" ADD CONSTRAINT "fk_activity_clo_mapping_score_ratio" FOREIGN KEY ("score_ratio_id") REFERENCES "public"."subject_score_ratio"("score_ratio_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_evidence" ADD CONSTRAINT "fk_activity_evidence_activity" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."activity_evidence" ADD CONSTRAINT "fk_activity_evidence_section" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("section_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."activity_evidence" ADD CONSTRAINT "fk_activity_evidence_updated_by" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."activity_evidence" ADD CONSTRAINT "fk_activity_evidence_uploaded_by" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."activity_scores" ADD CONSTRAINT "activity_scores_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."student"("student_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."announcement_attachments" ADD CONSTRAINT "fk_announcement" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("announcement_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."announcement_attachments" ADD CONSTRAINT "fk_attachment" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("attachment_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."clo_course_cycle_detail_cloplan" ADD CONSTRAINT "fk_cloplan_clo" FOREIGN KEY ("clo_id") REFERENCES "public"."subject_clo"("clo_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."clo_course_cycle_detail_cloplan" ADD CONSTRAINT "fk_cloplan_cycle" FOREIGN KEY ("clo_course_cycle_id") REFERENCES "public"."clo_course_cycle_cloplan"("clo_course_cycle_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."course_material" ADD CONSTRAINT "fk_course_material_attachment" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("attachment_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."course_material" ADD CONSTRAINT "fk_course_material_syllabus" FOREIGN KEY ("course_syllabus_id") REFERENCES "public"."course_syllabus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."course_section_schedule" ADD CONSTRAINT "fk_css_section" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("section_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."course_sections" ADD CONSTRAINT "fk_course_sections_semester_course" FOREIGN KEY ("semester_course_id") REFERENCES "public"."semester_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."course_sections_teacher" ADD CONSTRAINT "fk_course_sections_teacher_section" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("section_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."departments" ADD CONSTRAINT "fk_departments_faculty" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("faculty_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."learning_activity_attachments" ADD CONSTRAINT "fk_attachment" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("attachment_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."learning_activity_attachments" ADD CONSTRAINT "fk_learning_activity" FOREIGN KEY ("learning_activity_id") REFERENCES "public"."learning_activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."learning_activity_clo_mapping" ADD CONSTRAINT "fk_learning_activity_clo_mapping_activity_id" FOREIGN KEY ("learning_activity_id") REFERENCES "public"."learning_activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."learning_outcomes" ADD CONSTRAINT "fk_created_by" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."learning_outcomes" ADD CONSTRAINT "fk_parent_outcome" FOREIGN KEY ("parent_outcome_id") REFERENCES "public"."learning_outcomes"("outcome_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."learning_outcomes" ADD CONSTRAINT "fk_program" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("program_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."learning_outcomes" ADD CONSTRAINT "fk_updated_by" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio" ADD CONSTRAINT "fk_portfolio_template" FOREIGN KEY ("template_id") REFERENCES "public"."portfolio_template"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio" ADD CONSTRAINT "fk_portfolio_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_activities" ADD CONSTRAINT "fk_activities_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_activity_attachments" ADD CONSTRAINT "fk_activity_attachments_activity" FOREIGN KEY ("activity_id") REFERENCES "public"."portfolio_activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_activity_attachments" ADD CONSTRAINT "fk_activity_attachments_attachment" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("attachment_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_award" ADD CONSTRAINT "fk_portfolio_award_users" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_award_attachments" ADD CONSTRAINT "fk_award_attachments_attachment" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("attachment_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_award_attachments" ADD CONSTRAINT "fk_award_attachments_award" FOREIGN KEY ("award_id") REFERENCES "public"."portfolio_award"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_certificate" ADD CONSTRAINT "fk_portfolio_certificate_users" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_certificate_attachments" ADD CONSTRAINT "fk_cert_attachments_attachment" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("attachment_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_certificate_attachments" ADD CONSTRAINT "fk_cert_attachments_cert" FOREIGN KEY ("certificate_id") REFERENCES "public"."portfolio_certificate"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_education" ADD CONSTRAINT "fk_portfolio_education_users" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_internship" ADD CONSTRAINT "fk_portfolio_internship_users" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_internship_attachments" ADD CONSTRAINT "fk_intern_attachments_attachment" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("attachment_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_internship_attachments" ADD CONSTRAINT "fk_intern_attachments_intern" FOREIGN KEY ("internship_id") REFERENCES "public"."portfolio_internship"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_personal" ADD CONSTRAINT "fk_portfolio_personal_attachments_qa" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("attachment_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_personal" ADD CONSTRAINT "fk_portfolio_personal_users_qa" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_skill" ADD CONSTRAINT "fk_portfolio_skill_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_skill_activity_mapping" ADD CONSTRAINT "fk_skill_activity" FOREIGN KEY ("skill_id") REFERENCES "public"."portfolio_skill"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_skill_mapping" ADD CONSTRAINT "fk_mapping_portfolio" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolio"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_skill_mapping" ADD CONSTRAINT "fk_mapping_skill" FOREIGN KEY ("skill_id") REFERENCES "public"."portfolio_skill"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_thesis" ADD CONSTRAINT "fk_portfolio_thesis_users" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_thesis_attachments" ADD CONSTRAINT "fk_thesis_attachments_attachment" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("attachment_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_thesis_attachments" ADD CONSTRAINT "fk_thesis_attachments_thesis" FOREIGN KEY ("thesis_id") REFERENCES "public"."portfolio_thesis"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_training" ADD CONSTRAINT "fk_portfolio_training_users" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_training_attachments" ADD CONSTRAINT "fk_training_attachments_attachment" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("attachment_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."portfolio_training_attachments" ADD CONSTRAINT "fk_training_attachments_training" FOREIGN KEY ("training_id") REFERENCES "public"."portfolio_training"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."program_subjects" ADD CONSTRAINT "fk_program_subjects_program_id" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("program_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."program_subjects" ADD CONSTRAINT "fk_program_subjects_subject_id" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."programs" ADD CONSTRAINT "programs_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("department_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."rubric_activity_mapping" ADD CONSTRAINT "fk_rubric_activity" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."rubric_details" ADD CONSTRAINT "fk_rubric_details_rubric" FOREIGN KEY ("rubric_id") REFERENCES "public"."rubrics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."rubric_levels" ADD CONSTRAINT "fk_rubric_level" FOREIGN KEY ("rubric_id") REFERENCES "public"."rubric_activity_mapping"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."rubrics" ADD CONSTRAINT "fk_rubrics_program" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("program_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."semester_courses" ADD CONSTRAINT "fk_semester_courses_program_id" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("program_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."semester_courses" ADD CONSTRAINT "fk_semester_courses_subject" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student" ADD CONSTRAINT "fk_student_program_id" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("program_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student" ADD CONSTRAINT "fk_student_user" FOREIGN KEY ("student_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student" ADD CONSTRAINT "student_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("department_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_activity" ADD CONSTRAINT "fk_student_activity_activity" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_activity" ADD CONSTRAINT "fk_student_activity_student" FOREIGN KEY ("student_id") REFERENCES "public"."student"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_activity_attachments" ADD CONSTRAINT "fk_saa_attachment" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("attachment_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_activity_attachments" ADD CONSTRAINT "fk_saa_student_activity" FOREIGN KEY ("student_activity_id") REFERENCES "public"."student_activity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_activity_group" ADD CONSTRAINT "fk_sag_activity" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_activity_group_member" ADD CONSTRAINT "fk_sagm_group" FOREIGN KEY ("group_id") REFERENCES "public"."student_activity_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_activity_group_member" ADD CONSTRAINT "fk_sagm_student" FOREIGN KEY ("student_id") REFERENCES "public"."student"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_activity_group_member" ADD CONSTRAINT "fk_sagm_student_activity" FOREIGN KEY ("student_activity_id") REFERENCES "public"."student_activity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_activity_rubric_score" ADD CONSTRAINT "fk_sars_rubric_activity_mapping" FOREIGN KEY ("rubric_activity_mapping_id") REFERENCES "public"."rubric_activity_mapping"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_activity_rubric_score" ADD CONSTRAINT "fk_sars_rubric_level" FOREIGN KEY ("rubric_level_id") REFERENCES "public"."rubric_levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_activity_rubric_score" ADD CONSTRAINT "fk_sars_student_activity" FOREIGN KEY ("student_activity_id") REFERENCES "public"."student_activity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_course" ADD CONSTRAINT "fk_student_course_section" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("section_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_course" ADD CONSTRAINT "fk_student_course_student" FOREIGN KEY ("student_id") REFERENCES "public"."student"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_group" ADD CONSTRAINT "fk_student_group_section" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("section_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_group_change_log" ADD CONSTRAINT "fk_student_group_change_section" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("section_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_group_member" ADD CONSTRAINT "fk_student_group_member_student" FOREIGN KEY ("student_id") REFERENCES "public"."student"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_group_member" ADD CONSTRAINT "student_group_member_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."student_group"("group_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_learning_activity" ADD CONSTRAINT "fk_student_learning_activity_activity" FOREIGN KEY ("learning_activity_id") REFERENCES "public"."learning_activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_learning_activity" ADD CONSTRAINT "fk_student_learning_activity_student" FOREIGN KEY ("student_id") REFERENCES "public"."student"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_learning_activity_attachments" ADD CONSTRAINT "fk_slaa_attachment" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("attachment_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_learning_activity_attachments" ADD CONSTRAINT "fk_slaa_student_learning_activity" FOREIGN KEY ("student_learning_activity_id") REFERENCES "public"."student_learning_activity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_learning_activity_group" ADD CONSTRAINT "fk_sag_learning_activity" FOREIGN KEY ("learning_activity_id") REFERENCES "public"."learning_activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_learning_activity_group_member" ADD CONSTRAINT "fk_slagm_group" FOREIGN KEY ("group_id") REFERENCES "public"."student_learning_activity_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_learning_activity_group_member" ADD CONSTRAINT "fk_slagm_student" FOREIGN KEY ("student_id") REFERENCES "public"."student"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."student_learning_activity_group_member" ADD CONSTRAINT "fk_slagm_student_learning_activity" FOREIGN KEY ("student_learning_activity_id") REFERENCES "public"."student_learning_activity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."subject_clo" ADD CONSTRAINT "fk_subject_clo_plo" FOREIGN KEY ("plo_id") REFERENCES "public"."learning_outcomes"("outcome_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subject_clo_achievement_criteria" ADD CONSTRAINT "fk_scac_section" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("section_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subject_clo_achievement_criteria" ADD CONSTRAINT "fk_subject_clo" FOREIGN KEY ("clo_id") REFERENCES "public"."subject_clo"("clo_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."subject_clo_measurable_behavior" ADD CONSTRAINT "fk_scmb_section" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("section_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subject_clo_measurable_behavior" ADD CONSTRAINT "fk_subject_clo_behavior" FOREIGN KEY ("clo_id") REFERENCES "public"."subject_clo"("clo_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."subject_plo_mapping" ADD CONSTRAINT "fk_created_by" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."subject_plo_mapping" ADD CONSTRAINT "fk_outcome" FOREIGN KEY ("outcome_id") REFERENCES "public"."learning_outcomes"("outcome_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."subject_plo_mapping" ADD CONSTRAINT "fk_subject" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("subject_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."subject_plo_mapping" ADD CONSTRAINT "fk_updated_by" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."subject_score_ratio" ADD CONSTRAINT "subject_score_ratio_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("section_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subjects" ADD CONSTRAINT "fk_subjects_department" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("department_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_image" ADD CONSTRAINT "fk_user_image_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

