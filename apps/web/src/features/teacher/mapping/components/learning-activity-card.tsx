import { generateHTML, type JSONContent } from "@tiptap/react";
import type { CLOMappedLearningActivity } from "@deep-portfolio/api-types";
import StarterKit from "@tiptap/starter-kit";

type Props = {
  learningActivity: CLOMappedLearningActivity;
};

const LearningActivityCard = (props: Props) => {
  // `unknown` narrowed where it is read — see the note in activity-card.tsx.
  const html = props.learningActivity.detail
    ? generateHTML(props.learningActivity.detail as JSONContent, [StarterKit])
    : "";

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
