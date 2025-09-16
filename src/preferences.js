import { ToastContainer,toast } from "react-toastify";
import axios from "axios";
import { useState,useEffect } from "react";
import { BASE_URL } from "./baseUrl";
export default function Preferences() {
  const [loading,setLoading]=useState(true)
  const [state,setState]=useState({
    allowed_signature_types:'',
    notify_on_signatures:'',
    timezone:'',
    date_format:'',
    send_in_order:''
  })

  useEffect(()=>{
    // createPreferences()
fetchPreferences();
  },[])

const fetchPreferences=async()=>{
try{
  let token=localStorage.getItem('token')
  let headers={
    headers:{
      authorization:`Bearer ${token}`
    }
  }
  let response=await axios.get(`${BASE_URL}/get-preferences`,headers)

setLoading(false)
setState({
  ...response.data.preferences
})
}catch(e){
if(e?.response?.data?.error){
toast.error(e?.response?.data?.error,{containerId:"preferences"})
}else{
  toast.error("Something went wrong please try again",{containerId:"preferences"})
}
}
}

const createPreferences=async()=>{
  try{
    let token=localStorage.getItem('token')
    let headers={
      headers:{
        authorization:`Bearer ${token}`
      }
    }
    let response = await axios.post(
      `${BASE_URL}/preferenceCreate`, 
      {}, 
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json', 
        }
      }
    );
    
  }catch(e){
console.log(e.message)
  }
}


const save = async () => {
  try {
    let token = localStorage.getItem('token');
    
    if (!token) {
      toast.error("Please login again", {containerId: "preferences"});
      return;
    }
    
    // Log what we're sending for debugging
    console.log('Sending state:', state);
    
    let response = await axios.patch(
      `${BASE_URL}/update-preferences`, 
      state, 
      {
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Response:', response.data);
    toast.success("Preferences updated successfully", {containerId: "preferences"});
    
  } catch (e) {
    console.error('Error saving preferences:', e);
    if (e?.response?.data?.error) {
      toast.error(e?.response?.data?.error, {containerId: "preferences"});
    } else {
      toast.error("Something went wrong please try again", {containerId: "preferences"});
    }
  }
}
  return (
  <>
     <>
      <ToastContainer containerId={"preferences"} />
      <div className="w-full bg-white rounded-[20px] min-h-[700px] flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-bold">Preferences</h1>
{loading?<div class="h-[250px] flex justify-center items-center"> <div class="op-loading op-loading-infinity w-[4rem] text-neutral"></div> </div>:<>

  <div className="flex flex-col gap-4">
  <h2 className="text-lg font-semibold">Allowed signature types</h2>
  <div className="flex flex-col md:flex-row gap-6">
    <div className="flex items-center gap-2">
     
  
  <input 
    type="radio" 
    id="signature" 
    name="signatureType"
    value="signature"
    checked={state.allowed_signature_types === 'signature'}
    onChange={(e) => setState({...state, allowed_signature_types: e.target.value})}
    className="w-4 h-4"
  />
  <label htmlFor="signature" className="flex items-center gap-1">
    🖋 Signature
  </label>

    </div>
    <div className="flex items-center gap-2">
      <input 
        type="radio" 
        id="type" 
        name="signatureType"
        value="type"
        checked={state.allowed_signature_types === 'type'}
        onChange={(e) => setState({...state, allowed_signature_types: e.target.value})}
        className="w-4 h-4"
      />
      <label htmlFor="type" className="flex items-center gap-1">
        ⌨ Type
      </label>
    </div>
    <div className="flex items-center gap-2">
      <input 
        type="radio" 
        id="upload" 
        name="signatureType"
        value="upload"
        checked={state.allowed_signature_types === 'upload'}
        onChange={(e) => setState({...state, allowed_signature_types: e.target.value})}
        className="w-4 h-4"
      />
      <label htmlFor="upload" className="flex items-center gap-1">
        📤 Upload
      </label>
    </div>
    <div className="flex items-center gap-2">
      <input 
        type="radio" 
        id="all" 
        name="signatureType"
        value="all"
        checked={state.allowed_signature_types === 'all'}
        onChange={(e) => setState({...state, allowed_signature_types: e.target.value})}
        className="w-4 h-4"
      />
      <label htmlFor="all" className="flex items-center gap-1">
        All
      </label>
    </div>
  </div>
</div>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Notify on signatures</h2>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="notify"
                checked={state.notify_on_signatures === true}
                onChange={() => setState({ ...state, notify_on_signatures: true })}
                className="w-4 h-4"
              />
              Yes
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="notify"
                checked={state.notify_on_signatures === false}
                onChange={() => setState({ ...state, notify_on_signatures: false })}
                className="w-4 h-4"
              />
              No
            </label>
          </div>
        </div>

       
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Timezone</h2>
          <select
            className="border rounded-lg p-2 max-w-xs"
            value={state.timezone}
            onChange={(e) => setState({ ...state, timezone: e.target.value })}
          >
            <option value="">Please select timezone</option>
    <option value="GMT-12:00">(GMT-12:00) International Date Line West</option>
    <option value="GMT-11:00">(GMT-11:00) Midway Island, Samoa</option>
    <option value="GMT-10:00">(GMT-10:00) Hawaii</option>
    <option value="GMT-09:00">(GMT-09:00) Alaska</option>
    <option value="GMT-08:00">(GMT-08:00) Pacific Time (US & Canada)</option>
    <option value="GMT-07:00">(GMT-07:00) Mountain Time (US & Canada)</option>
    <option value="GMT-06:00">(GMT-06:00) Central Time (US & Canada), Mexico City</option>
    <option value="GMT-05:00">(GMT-05:00) Eastern Time (US & Canada), Bogota, Lima</option>
    <option value="GMT-04:00">(GMT-04:00) Atlantic Time (Canada), Caracas, La Paz</option>
    <option value="GMT-03:00">(GMT-03:00) Buenos Aires, Greenland</option>
    <option value="GMT-02:00">(GMT-02:00) Mid-Atlantic</option>
    <option value="GMT-01:00">(GMT-01:00) Azores, Cape Verde Islands</option>
    <option value="GMT+00:00">(GMT+00:00) London, Dublin, Lisbon</option>
    <option value="GMT+01:00">(GMT+01:00) Berlin, Brussels, Madrid, Paris</option>
    <option value="GMT+02:00">(GMT+02:00) Athens, Istanbul, Cairo</option>
    <option value="GMT+03:00">(GMT+03:00) Moscow, St. Petersburg, Kuwait</option>
    <option value="GMT+04:00">(GMT+04:00) Abu Dhabi, Muscat, Baku</option>
    <option value="GMT+05:00">(GMT+05:00) Islamabad, Karachi, Tashkent</option>
    <option value="GMT+05:30">(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
    <option value="GMT+06:00">(GMT+06:00) Almaty, Dhaka</option>
    <option value="GMT+07:00">(GMT+07:00) Bangkok, Hanoi, Jakarta</option>
    <option value="GMT+08:00">(GMT+08:00) Beijing, Singapore, Hong Kong</option>
    <option value="GMT+09:00">(GMT+09:00) Tokyo, Seoul, Osaka</option>
    <option value="GMT+10:00">(GMT+10:00) Sydney, Melbourne, Guam</option>
    <option value="GMT+11:00">(GMT+11:00) Solomon Islands, New Caledonia</option>
    <option value="GMT+12:00">(GMT+12:00) Auckland, Wellington, Fiji</option>
          </select>
        </div>

       
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Date format</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="dateFormat"
                value="12 hr"
                checked={state.date_format === "12 hr"}
                onChange={(e) => setState({ ...state, date_format: e.target.value })}
                className="w-4 h-4"
              />
              12 hr
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="dateFormat"
                value="24 hr"
                checked={state.date_format === "24 hr"}
                onChange={(e) => setState({ ...state, date_format: e.target.value })}
                className="w-4 h-4"
              />
              24 hr
            </label>
          </div>
          <p className="text-gray-500 text-sm">04/04/2025, 16:13:53 GMT +05:00</p>
        </div>

     
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Send in order</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sendOrder"
                checked={state.send_in_order === true}
                onChange={() => setState({ ...state, send_in_order: true })}
                className="w-4 h-4"
              />
              Yes
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sendOrder"
                checked={state.send_in_order === false}
                onChange={() => setState({ ...state, send_in_order: false })}
                className="w-4 h-4"
              />
              No
            </label>
          </div>
        </div>

        <button onClick={save} className="mt-auto bg-[#002864] text-white px-6 py-2 rounded-[20px] self-start">
          Save
        </button>
</>}
      </div>
    </>
  </>
  );
}
