import { generateHTML } from "@tiptap/react";
import type { LearningActivityDetail } from "../types/mapping-type.type";
import StarterKit from "@tiptap/starter-kit";

type Props = {
  learningActivity: LearningActivityDetail;
};

const LearningActivityCard = (props: Props) => {
  const html =
    props.learningActivity.detail &&
    generateHTML(props.learningActivity.detail, [StarterKit]);

  return (
    <div className="w-full 2xl:p-6 p-3 rounded-2xl border border-light-grey flex flex-col gap-2">
      <div className="caption-bold">
        {props.learningActivity.learning_activity_name}
      </div>

      {html && (
        <div
          className="prose max-w-none line-clamp-1"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
};

export default LearningActivityCard;
