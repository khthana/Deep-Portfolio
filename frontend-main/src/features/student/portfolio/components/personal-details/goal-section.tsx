import WhiteContainer from "../../../../../components/container/white-container";
import TitleWithEditIcon from "../title-with-edit-icon";

const GoalSection = () => {
  return (
    <WhiteContainer>
      <TitleWithEditIcon
        title="เป้าหมายทางวิชาชีพ"
        onEdit={() => console.log("click")}
      />
      <div>
        พัฒนาตนเองให้เป็นนักพัฒนาซอฟต์แวร์ที่มีความเชี่ยวชาญด้าน Web Development
        และ Cloud Technology โดยมุ่งเน้นการเรียนรู้และฝึกฝนทักษะจากการฝึกงาน
        การอบรม และการทำโครงการจริง รวมถึงตั้งใจศึกษาต่อหรือสอบใบรับรองวิชาชีพ
        เช่น AWS หรือ CCNA เพื่อเติบโตเป็น Full-Stack Developer
        ที่สามารถสร้างสรรค์นวัตกรรมเทคโนโลยีให้เกิดประโยชน์ต่อสังคมในอนาคต
      </div>
    </WhiteContainer>
  );
};

export default GoalSection;
