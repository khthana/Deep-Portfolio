import { useParams } from "react-router-dom";
import ActivityEvaluation from "../components/evaluation/activity-evalution";
import LearningActivityEvaluation from "../components/evaluation/learning-activity-evalution";

const StudentCourseEvaluationDetailPage = () => {
  const { secId, category, workId } = useParams();

  return (
    <div>
      {category === "activity" ? (
        <ActivityEvaluation />
      ) : (
        <LearningActivityEvaluation />
      )}
    </div>
  );
};

export default StudentCourseEvaluationDetailPage;
