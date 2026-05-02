import { GetAllStudentActivity } from "../models/student-activity.model";
import { GetAllStudentLearningActivity } from "../models/student-learning-activity.model";
import { ClassworkDetail } from "../models/student.model";

export default class StudentMapper {
  async mapGetAllStudentActivityToClassworkDetail(
    activity: GetAllStudentActivity,
    subjectName: string,
    subjectId: string,
  ): Promise<ClassworkDetail> {
    const deadline = activity.deadline_date
      ? new Date(activity.deadline_date)
      : null;

    return {
      name: activity.activity_name,
      id: activity.student_activity[0].id,
      category: "activity",
      type: activity.activity_type,
      point: activity.score_number,
      received_point: activity.student_activity[0].received_point,
      date: deadline,
      status: activity.student_activity[0].status,
      course: subjectName,
      score_weight_id: activity.score_ratio_id,
      subject_id: subjectId,
      detail: activity.detail,
      section_id: activity.section_id ?? 0,
      deadline_date: activity.deadline_date,
      announcement_date: activity.announcement_date,
    };
  }

  async mapGetAllStudentLearningActivityToClassworkDetail(
    activity: GetAllStudentLearningActivity,
    subjectName: string,
    subjectId: string,
  ): Promise<ClassworkDetail> {
    const deadline = activity.deadline_date
      ? new Date(activity.deadline_date)
      : null;

    return {
      name: activity.learning_activity_name,
      id: activity.student_learning_activity[0].id,
      category: "learning_activity",
      type: activity.learning_activity_type,
      point: null,
      received_point: null,
      date: deadline,
      status: activity.student_learning_activity[0].status,
      course: subjectName,
      score_weight_id: null,
      subject_id: subjectId,
      detail: activity.detail,
      section_id: activity.section_id ?? 0,
      deadline_date: activity.deadline_date,
      announcement_date: activity.announcement_date,
    };
  }
}
