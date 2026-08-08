// import React from 'react'
// import Button from '../button/button'
// import UploadButton from './upload-button'
// import type { JSONContent } from '@tiptap/react';
// import type { UploadChangeParam, UploadFile } from 'antd/es/upload';
// import type { AttachmentDetailItem, AttachmentType } from '../../features/teacher/announcement/types/announement-type';

// const UploadAttachment = () => {
//       const handleOnChange = (value: JSONContent | null) => {
//     const error = announcementForm.getFieldError("detail");

//     setFieldError(error.length > 0);

//     announcementForm.setFieldValue("detail", value);
//   };

//   const handleOnUpload = (
//     info: UploadChangeParam<UploadFile>,
//     type: AttachmentType
//   ) => {
//     const { file } = info;
//     // ป้องกันการเรียกใช้ function 2 รอบ
//     if (file.status !== "done") return;

//     setPreviewAllFiles((prev: AttachmentDetailItem[]) => {
//       if (type === "LINK") {
//         const linkItem = {
//           title: "Google",
//           url: "https://google.com",
//         };

//         return [
//           ...prev,
//           {
//             attachmentType: "LINK",
//             attachmentItems: linkItem,
//           },
//         ];
//       }

//       return [
//         ...prev,
//         {
//           attachmentType: type,
//           attachmentItems: info.file,
//         },
//       ];
//     });
//   };

//   const handleOnRemove = (item: AttachmentDetailItem) => {
//     const newList = previewAllFiles.filter((prev) => prev !== item);

//     setPreviewAllFiles(newList);
//   };
  
//   return (
//     <div>
//           <div className="flex gap-6">
//             <Button
//               variant="secondary"
//               iconSrc="/assets/announcement/add-link-icon.svg"
//               type="button"
//               className="h-fit"
//               onClick={() => setShowUploadLinkForm((prev) => !prev)}
//             >
//               เพิ่มลิ้งค์
//             </Button>

//             <UploadButton
//               label="เพิ่มไฟล์"
//               iconSrc="/assets/announcement/add-file-icon.svg"
//               accept=".pdf"
//               name="attachments"
//               onUpload={handleOnUpload}
//               attachmentType={AttachmentType.FILE}
//             />
//             <UploadButton
//               label="เพิ่มรูปภาพ"
//               iconSrc="/assets/announcement/add-image-icon.svg"
//               accept=".png,.jpg,.jpeg"
//               name="attachments"
//               onUpload={handleOnUpload}
//               attachmentType={AttachmentType.IMAGE}
//             />
//           </div>

//           {showUploadLinkForm && <UploadLinkForm />}

//           <PreviewListFile
//             attachmentItems={previewAllFiles}
//             handleOnRemove={handleOnRemove}
//           />
//         </div>
//   )
// }

// export default UploadAttachment