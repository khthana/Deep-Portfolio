import { generateHTML, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { CLOMappedActivity } from "@deep-portfolio/api-types";

type Props = {
  activity: CLOMappedActivity;
};

const ActivityCard = (props: Props) => {
  // The package types `detail` as `unknown` because the column is `Json?` and
  // the API genuinely does not know its shape — the narrowing belongs to the
  // reader that decides what it is looking at, which is here. Same cast as
  // announcement-card.tsx.
  const html = props.activity.detail
    ? generateHTML(props.activity.detail as JSONContent, [StarterKit])
    : "";

  const levels = () => {
    if (!props.activity.level_no) return [];

    const level_no = [];
    let index = props.activity.level_no;
    while (index > 0) {
      level_no.push(index);
      index--;
    }

    return level_no;
  };

  return (
    <div className="w-full 2xl:p-6 p-3 rounded-2xl border border-light-grey flex flex-col gap-2">
      <div className="flex justify-between">
        <div className="caption-bold">{props.activity.activity_name}</div>
        <div className="text-primary-grey">{props.activity.weight}%</div>
      </div>
      {html && (
        <div
          className="prose max-w-none line-clamp-1"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

      <div className="bg-background 2xl:px-6 2xl:py-5 px-3 py-2 flex flex-col gap-4 rounded-md w-full">
        <div>ระดับความคาดหวัง</div>

        <div className="w-full flex gap-0.5">
          {levels().length > 0 &&
            levels().map((level) => (
              <div
                key={level}
                className={`text-center 2xl:p-4 p-2 w-full ${
                  level === props.activity.expected_level
                    ? "bg-primary-green text-white"
                    : "bg-white"
                }`}
              >
                {level}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
