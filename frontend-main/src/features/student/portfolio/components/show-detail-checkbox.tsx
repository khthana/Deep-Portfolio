import CheckboxWithLabel from "../../../../components/input/checkbox-with-label";

type Props = {
  onClick: () => void;
  checked: boolean;
};

const ShowDetailCheckbox = (props: Props) => {
  return (
    <CheckboxWithLabel
      label="แสดงบนหน้าแฟ้มผลงาน"
      onClick={props.onClick}
      checked={props.checked}
      color="black"
    />
  );
};

export default ShowDetailCheckbox;
