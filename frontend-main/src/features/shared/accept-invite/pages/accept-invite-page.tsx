import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Button from "../../../../components/button/button";
import type {
  AcceptInviteBody,
  ValidateInvite,
} from "../../../../types/group-type.type";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { useDispatch, useSelector } from "react-redux";
import {
  postAcceptInvite,
  postValidateInvite,
} from "../stores/teacher-home-action";

const AcceptInvitePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const groupSlice = useSelector((state: RootState) => state.group);

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const navigate = useNavigate();
  const workType = type as "learning-activity" | "activity";

  // สถานะของหน้าจอ: 'confirm' | 'LOADING' | 'SUCCESS' | 'error' | 'rejected'
  const [status, setStatus] = useState<
    "PENDING" | "LOADING" | "ACCEPT" | "ERROR" | "REJECTED"
  >("PENDING");
  const [errorMessage, setErrorMessage] = useState("");

  const handleValidateInvite = async () => {
    if (!token) {
      setStatus("ERROR");
      setErrorMessage("ไม่พบ Token คำเชิญ");
      return;
    }

    const body: ValidateInvite = {
      token,
      type: workType,
    };

    const resp = await dispatch(postValidateInvite(body)).unwrap();
    if (!resp.success) {
      setStatus("ERROR");
      setErrorMessage(resp.message);
      return;
    }

    setStatus(resp.data.status);
  };

  // ฟังก์ชันยิง API ไปหา Backend
  const handleResponse = async (action: "REJECTED" | "ACCEPT") => {
    if (!token) {
      setStatus("ERROR");
      setErrorMessage("ไม่พบ Token คำเชิญ");
      return;
    }

    setStatus("LOADING");

    try {
      const body: AcceptInviteBody = {
        token,
        action,
        type: workType,
      };

      const resp = await dispatch(postAcceptInvite(body)).unwrap();

      //   const data = await response.json();

      if (!resp.success) {
        throw new Error("เกิดข้อผิดพลาดในการดำเนินการ");
      }

      setStatus(action === "ACCEPT" ? "ACCEPT" : "REJECTED");
    } catch (error: any) {
      setStatus("ERROR");
      setErrorMessage(error.message);
    }
  };

  useEffect(() => {
    handleValidateInvite();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      {!groupSlice.postValidateInviteLoading && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          {/* 1. สถานะ: รอกดยืนยัน (หน้าแรกที่เข้ามาเจอ) */}
          {status === "PENDING" && (
            <>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-50 mb-6">
                <svg
                  className="h-10 w-10 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                คำเชิญเข้ากลุ่ม
              </h2>
              <p className="text-gray-500 mb-8">
                คุณได้รับคำเชิญให้เข้าร่วมกลุ่มกิจกรรม
                <br />
                กรุณายืนยันเพื่อเข้าร่วม
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  onClick={() => handleResponse("REJECTED")}
                  variant="secondary"
                >
                  ปฏิเสธ
                </Button>
                <Button onClick={() => handleResponse("ACCEPT")}>ยอมรับ</Button>
              </div>
            </>
          )}

          {/* 2. สถานะ: กำลังโหลด (หมุนๆ) */}
          {status === "LOADING" && (
            <div className="py-8">
              <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-700">
                กำลังประมวลผล...
              </h2>
            </div>
          )}

          {/* 3. สถานะ: สำเร็จ (ยอมรับเข้ากลุ่มแล้ว) */}
          {status === "ACCEPT" && (
            <>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-50 mb-6">
                <svg
                  className="h-10 w-10 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                เข้าร่วมกลุ่มสำเร็จ!
              </h2>
              <p className="text-gray-500 mb-8">
                คุณได้เข้าร่วมกลุ่มเรียบร้อยแล้ว สามารถใช้งานระบบต่อได้เลย
              </p>
              <Button
                onClick={() => navigate("/student")} // เปลี่ยนไปหน้า Dashboard หรือหน้าที่ต้องการ
              >
                กลับสู่หน้าหลัก
              </Button>
            </>
          )}

          {/* 4. สถานะ: ปฏิเสธคำเชิญ */}
          {status === "REJECTED" && (
            <>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 mb-6">
                <svg
                  className="h-10 w-10 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                ปฏิเสธคำเชิญแล้ว
              </h2>
              <p className="text-gray-500 mb-8">
                คุณได้ปฏิเสธการเข้าร่วมกลุ่มนี้
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-8 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition-colors"
              >
                กลับสู่หน้าหลัก
              </button>
            </>
          )}

          {/* 5. สถานะ: ผิดพลาด (ลิงก์พัง/หมดอายุ) */}
          {status === "ERROR" && (
            <>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 mb-6">
                <svg
                  className="h-10 w-10 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                เกิดข้อผิดพลาด
              </h2>
              <p className="text-red-500 mb-8">{errorMessage}</p>
              <button
                onClick={() => navigate("/")}
                className="px-8 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                กลับสู่หน้าหลัก
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AcceptInvitePage;
