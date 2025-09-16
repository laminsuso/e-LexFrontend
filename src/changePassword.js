import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { useNavigate, useParams } from "react-router-dom";

export default function ChangePassword() {
  const params = useParams();
  const email = params?.email;
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [passwordState, setPasswordState] = useState({
    password: "",
    confirm_password: "",
  });

  let navigate=useNavigate();
  const savePassword = async () => {
    try {
      toast.dismiss();
      if (passwordState?.current_password?.length === 0) {
        toast.error("Please enter current password", {
          containerId: "changePassword",
        });
        return;
      } else if (passwordState?.password?.length === 0) {
        toast.error("Please enter new password", { containerId: "changePassword" });
        return;
      } else if (passwordState?.confirm_password?.length === 0) {
        toast.error("Please enter confirm password", {
          containerId: "changePassword",
        });
        return;
      } else if (passwordState?.confirm_password !== passwordState?.password) {
        toast.error("Password and confirm password don't match", {
          containerId: "changePassword",
        });
        return;
      }

   

      let response = await axios.post(
        `${BASE_URL}/resetPassword`,
        {password:passwordState.password,email}
      );

      
setPasswordState({
  password:'',
  confirm_password:''
})
      toast.success("Password updated successfully", {
        containerId: "changePassword",
      });
      setIsChangingPassword(false);
      navigate('/join')
    } catch (e) {
    
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, { containerId: "changePassword" });
      } else {
        toast.error("Something went wrong please try again", {
          containerId: "changePassword",
        });
      }
    }
  };
  return (
    <div>
      <ToastContainer containerId={"changePassword"} />
      <div className="bg-white p-6 rounded-lg w-full lg:px-[90px] lg:py-[60px] px-[10px] py-[20px]">
        <h3 className="text-[30px] text-[#0067AB] font-bold mb-4">
          Reset Your Password{" "}
        </h3>
        <h2 className="text-[#666666] text-[1rem] mb-[30px]">
          {`New Password for ${email} `}{" "}
        </h2>
        <div className="space-y-4">
          <div className="mt-[20px]">
            <label className="text-[1rem] text-[#0067AB] mb-[20px] flex">New Password</label>
            <input
              type="password"
              value={passwordState.password}
              onChange={(e) => {
                setPasswordState({
                  ...passwordState,
                  password: e.target.value,
                });
              }}
              placeholder="New Password"
              className="w-full p-2 border rounded-[20px] max-w-[300px]"
            />
          </div>
          <div className="mt-[20px]">
            <label className="text-[1rem] mb-[20px] flex text-[#0067AB]">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordState.confirm_password}
              onChange={(e) => {
                setPasswordState({
                  ...passwordState,
                  confirm_password: e.target.value,
                });
              }}
              placeholder="Confirm New Password"
              className="w-full p-2 border rounded-[20px] max-w-[300px]"
            />
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <button
            onClick={savePassword}
            className="px-[30px] py-2 bg-[#0067AB] text-white hover:bg-[#002864] font-bold text-[22px] rounded-[10px]"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}
