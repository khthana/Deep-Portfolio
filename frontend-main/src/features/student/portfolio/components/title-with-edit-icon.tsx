type Props = {
  title: string;
  onEdit: () => void;
};

const TitleWithEditIcon = (props: Props) => {
  return (
    <div className="flex justify-between border-b border-light-grey pb-3">
      <div className="body-bold-1">{props.title}</div>
      <img
        src="/assets/course/edit-icon.svg"
        alt="edit icon"
        width={24}
        height={24}
        className="cursor-pointer"
        onClick={props.onEdit}
      />
    </div>
  );
};

export default TitleWithEditIcon;
